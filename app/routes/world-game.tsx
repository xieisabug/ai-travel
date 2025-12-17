import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    LoadingScreen,
    ErrorScreen,
    DepartingScreen,
    TravelingScreen,
    ExploringScreen,
    DialogScreen,
    DialogLoading,
    ReturningScreen,
    CompletedScreen,
    FallbackScreen,
} from "~/components/world-game";
import type {
    TravelSession,
    Spot,
    NPCPublicProfile,
    TravelProject,
} from "~/types/world";

type GamePhase =
    | "loading"
    | "departing"
    | "traveling"
    | "exploring"
    | "dialog"
    | "returning"
    | "completed";

interface DialogLine {
    speaker: string;
    text: string;
    emotion?: string;
}

export default function WorldGamePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session");
    const [phase, setPhase] = useState<GamePhase>("loading");
    const [session, setSession] = useState<TravelSession | null>(null);
    const [currentSpot, setCurrentSpot] = useState<Spot | null>(null);
    const [currentNPC, setCurrentNPC] = useState<NPCPublicProfile | null>(null);
    const [isGeneratingDialog, setIsGeneratingDialog] = useState(false);
    const [dialogLines, setDialogLines] = useState<DialogLine[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departComicShown, setDepartComicShown] = useState(false);
    const [departComicRevealed, setDepartComicRevealed] = useState(false);
    const [projectBgmUrl, setProjectBgmUrl] = useState<string | null>(null);

    const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const departTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioProjectRef = useRef<string | null>(null);

    const loadProjectBgm = useCallback(async (projectId: string) => {
        if (!projectId) {
            setProjectBgmUrl(null);
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}`);
            if (!response.ok) throw new Error("加载项目失败");
            const data = (await response.json()) as { project?: TravelProject };
            setProjectBgmUrl(data.project?.bgmUrl || null);
        } catch (err) {
            console.error("加载项目音乐失败:", err);
            setProjectBgmUrl(null);
        }
    }, []);

    const loadSession = useCallback(async () => {
        if (!sessionId) {
            setError("无效的会话ID");
            setProjectBgmUrl(null);
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            if (!response.ok) throw new Error("加载会话失败");
            const data: TravelSession = await response.json();
            setSession(data);
            await loadProjectBgm(data.projectId);

            switch (data.status) {
                case "preparing":
                case "departing":
                    setPhase("departing");
                    break;
                case "traveling":
                    setPhase("traveling");
                    break;
                case "exploring":
                    setPhase("exploring");
                    if (data.currentSpotId) {
                        await loadSpot(data.projectId, data.currentSpotId);
                    }
                    break;
                case "returning":
                    setPhase("returning");
                    break;
                case "completed":
                    setPhase("completed");
                    break;
                default:
                    setPhase("departing");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "加载失败");
            setProjectBgmUrl(null);
        }
    }, [sessionId, loadProjectBgm]);

    const loadSpot = async (projectId: string, spotId: string) => {
        if (!spotId) {
            console.warn("spotId 为空，跳过加载场景");
            return;
        }

        try {
            const response = await fetch(
                `/api/projects/${projectId}/spots/${spotId}`
            );
            if (!response.ok) throw new Error("加载场景失败");
            const spot = (await response.json()) as Spot;
            setCurrentSpot(spot);

            if (spot.npcs && spot.npcs.length > 0) {
                const npc = spot.npcs[0] as unknown as NPCPublicProfile;
                setCurrentNPC(npc);
                generateEntryDialog(spot, npc);
            }
        } catch (err) {
            console.error("加载场景失败:", err);
        }
    };

    const startExploring = async () => {
        if (!session) return;

        try {
            const response = await fetch(
                `/api/sessions/${session.id}/next-spot`,
                {
                    method: "POST",
                }
            );

            const data = (await response.json()) as {
                completed?: boolean;
                error?: string;
                spot?: Spot;
                session?: TravelSession;
            };

            if (!response.ok) {
                if (data.completed) {
                    setPhase("returning");
                } else {
                    throw new Error(data.error || "开始探索失败");
                }
                return;
            }

            if (data.spot) {
                setCurrentSpot(data.spot);
                if (data.spot.npcs && data.spot.npcs.length > 0) {
                    const npc = data.spot
                        .npcs[0] as unknown as NPCPublicProfile;
                    setCurrentNPC(npc);
                    generateEntryDialog(data.spot, npc);
                } else {
                    setPhase("exploring");
                }

                if (data.session) {
                    setSession(data.session);
                }
            }
        } catch (err) {
            console.error("开始探索失败:", err);
            setError(err instanceof Error ? err.message : "开始探索失败");
        }
    };

    const generateEntryDialog = async (spot: Spot, npc: NPCPublicProfile) => {
        setIsGeneratingDialog(true);
        setPhase("dialog");

        try {
            const response = await fetch(`/api/game/npc/${npc.id}/dialog`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: session?.id,
                    spotId: spot.id,
                    dialogType: "entry",
                }),
            });

            if (!response.ok) {
                throw new Error("对话生成失败");
            }

            const data = (await response.json()) as {
                dialogLines: DialogLine[];
            };
            setDialogLines(data.dialogLines);
            setCurrentLineIndex(0);
        } catch (err) {
            console.error("生成对话失败:", err);
            const fallbackLines: DialogLine[] = [
                {
                    speaker: npc.name,
                    text: `欢迎来到${spot.name}！我是${npc.name}，${npc.role}。`,
                    emotion: "happy",
                },
                {
                    speaker: npc.name,
                    text: spot.description,
                    emotion: "neutral",
                },
            ];
            setDialogLines(fallbackLines);
            setCurrentLineIndex(0);
        } finally {
            setIsGeneratingDialog(false);
        }
    };

    useEffect(() => {
        if (phase !== "dialog" || dialogLines.length === 0) return;

        const currentLine = dialogLines[currentLineIndex];
        if (!currentLine) return;

        setDisplayedText("");
        setIsTyping(true);

        let charIndex = 0;
        const text = currentLine.text;

        typewriterRef.current = setInterval(() => {
            if (charIndex < text.length) {
                setDisplayedText(text.substring(0, charIndex + 1));
                charIndex++;
            } else {
                if (typewriterRef.current) {
                    clearInterval(typewriterRef.current);
                }
                setIsTyping(false);
            }
        }, 50);

        return () => {
            if (typewriterRef.current) {
                clearInterval(typewriterRef.current);
            }
        };
    }, [phase, dialogLines, currentLineIndex]);

    const handleContinue = () => {
        if (isTyping) {
            if (typewriterRef.current) {
                clearInterval(typewriterRef.current);
            }
            setDisplayedText(dialogLines[currentLineIndex]?.text || "");
            setIsTyping(false);
        } else if (currentLineIndex < dialogLines.length - 1) {
            setCurrentLineIndex((prev) => prev + 1);
        } else {
            setPhase("exploring");
        }
    };

    const handleNextSpot = async () => {
        if (!session) return;

        try {
            const response = await fetch(
                `/api/sessions/${session.id}/next-spot`,
                {
                    method: "POST",
                }
            );

            const data = (await response.json()) as {
                completed?: boolean;
                error?: string;
                spot?: Spot;
            };

            if (!response.ok) {
                if (data.completed) {
                    setPhase("returning");
                } else {
                    throw new Error(data.error || "前往下一场景失败");
                }
                return;
            }

            if (data.spot) {
                setCurrentSpot(data.spot);
                if (data.spot.npcs && data.spot.npcs.length > 0) {
                    const npc = data.spot
                        .npcs[0] as unknown as NPCPublicProfile;
                    setCurrentNPC(npc);
                    generateEntryDialog(data.spot, npc);
                }
            }
        } catch (err) {
            console.error("前往下一场景失败:", err);
        }
    };

    const handleCompleteTrip = async () => {
        if (!session) return;

        try {
            await fetch(`/api/sessions/${session.id}/complete`, {
                method: "POST",
            });
            setPhase("completed");
        } catch (err) {
            console.error("完成旅程失败:", err);
        }
    };

    const handleGoHome = () => {
        navigate("/");
    };

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    useEffect(() => {
        if (!session?.projectId) return;
        loadProjectBgm(session.projectId);
    }, [session?.projectId, loadProjectBgm]);

    useEffect(() => {
        const allowedStartPhases: GamePhase[] = [
            "exploring",
            "dialog",
            "returning",
            "completed",
        ];
        const canStart = projectBgmUrl && allowedStartPhases.includes(phase);

        if (
            !projectBgmUrl ||
            (session?.projectId &&
                audioProjectRef.current &&
                audioProjectRef.current !== session.projectId)
        ) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            audioProjectRef.current = null;
            return;
        }

        if (canStart && session?.projectId) {
            if (audioProjectRef.current !== session.projectId) {
                if (!audioRef.current) {
                    audioRef.current = new Audio(projectBgmUrl);
                } else {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current.src = projectBgmUrl;
                }
                audioProjectRef.current = session.projectId;
            }

            const audioEl = audioRef.current;
            if (!audioEl) return;

            audioEl.loop = true;

            const playAudio = async () => {
                try {
                    await audioEl.play();
                } catch (err) {
                    console.warn("背景音乐播放失败，可能需要用户交互", err);
                }
            };

            if (audioEl.paused) {
                playAudio();
            }
        }
    }, [projectBgmUrl, phase, session?.projectId]);

    useEffect(() => {
        return () => {
            if (departTimerRef.current) {
                clearTimeout(departTimerRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const departureComicImage = "/img/departure-comic.jpg";

    const handleDepartReveal = () => {
        if (departComicShown) return;
        setDepartComicShown(true);
        requestAnimationFrame(() => setDepartComicRevealed(true));
        departTimerRef.current = setTimeout(() => {
            setPhase("traveling");
        }, 3000);
    };

    // 根据阶段渲染不同的屏幕
    if (phase === "loading") {
        return <LoadingScreen />;
    }

    if (error) {
        return <ErrorScreen message={error} onGoHome={handleGoHome} />;
    }

    if (phase === "departing") {
        return (
            <DepartingScreen
                comicImage={departureComicImage}
                revealed={departComicRevealed}
                shown={departComicShown}
                onReveal={handleDepartReveal}
            />
        );
    }

    if (phase === "traveling") {
        return <TravelingScreen onArrive={startExploring} />;
    }

    if (phase === "exploring" && currentSpot) {
        return (
            <ExploringScreen
                spot={currentSpot}
                npc={currentNPC}
                isGeneratingDialog={isGeneratingDialog}
                onTalk={() =>
                    currentNPC && generateEntryDialog(currentSpot, currentNPC)
                }
                onNextSpot={handleNextSpot}
                onReturn={() => setPhase("returning")}
            />
        );
    }

    if (phase === "dialog" && currentNPC) {
        if (isGeneratingDialog || dialogLines.length === 0) {
            return <DialogLoading backgroundImage={currentSpot?.image} />;
        }

        const currentLine = dialogLines[currentLineIndex];
        const emotionSprite =
            currentLine?.emotion && currentNPC.sprites
                ? currentNPC.sprites[
                      currentLine.emotion as keyof typeof currentNPC.sprites
                  ]
                : undefined;

        return (
            <DialogScreen
                backgroundImage={currentSpot?.image}
                npc={currentNPC}
                displayedText={displayedText}
                isTyping={isTyping}
                currentLineIndex={currentLineIndex}
                totalLines={dialogLines.length}
                speaker={currentLine?.speaker || currentNPC.name}
                emotionSprite={emotionSprite}
                onContinue={handleContinue}
            />
        );
    }

    if (phase === "returning") {
        return (
            <ReturningScreen
                session={session}
                onComplete={handleCompleteTrip}
            />
        );
    }

    if (phase === "completed") {
        return (
            <CompletedScreen
                session={session}
                onExploreMore={() => navigate("/worlds")}
                onGoHome={handleGoHome}
            />
        );
    }

    return <FallbackScreen />;
}
