import type { NPCPublicProfile } from "~/types/world";

interface DialogScreenProps {
    backgroundImage?: string;
    npc: NPCPublicProfile;
    displayedText: string;
    isTyping: boolean;
    currentLineIndex: number;
    totalLines: number;
    speaker: string;
    emotionSprite?: string;
    onContinue: () => void;
}

/**
 * 对话屏幕 - 显示NPC对话
 */
export function DialogScreen({
    backgroundImage,
    npc,
    displayedText,
    isTyping,
    currentLineIndex,
    totalLines,
    speaker,
    emotionSprite,
    onContinue,
}: DialogScreenProps) {
    return (
        <div
            className="min-h-screen relative overflow-hidden bg-black cursor-pointer"
            onClick={onContinue}
        >
            {/* 背景图片 */}
            <DialogBackground image={backgroundImage} />

            {/* NPC 立绘 */}
            <NPCSprite npc={npc} emotionSprite={emotionSprite} />

            {/* 对话框 */}
            <DialogBox
                speaker={speaker}
                displayedText={displayedText}
                isTyping={isTyping}
                currentLineIndex={currentLineIndex}
                totalLines={totalLines}
            />
        </div>
    );
}

interface DialogBackgroundProps {
    image?: string;
}

function DialogBackground({ image }: DialogBackgroundProps) {
    return (
        <>
            <div
                className="absolute inset-0 bg-cover bg-center brightness-[0.7]"
                style={{
                    backgroundImage: image ? `url(${image})` : undefined,
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </>
    );
}

interface NPCSpriteProps {
    npc: NPCPublicProfile;
    emotionSprite?: string;
}

function NPCSprite({ npc, emotionSprite }: NPCSpriteProps) {
    return (
        <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-[15]">
            {emotionSprite || npc.sprite ? (
                <img
                    src={emotionSprite || npc.sprite}
                    alt={npc.name}
                    className="max-h-[400px] drop-shadow-2xl"
                />
            ) : (
                <div className="flex flex-col items-center text-[8rem] text-white/80 drop-shadow-[0_0_20px_rgba(102,126,234,0.3)]">
                    👤
                    <p className="text-2xl text-white mt-2 font-semibold">
                        {npc.name}
                    </p>
                </div>
            )}
        </div>
    );
}

interface DialogBoxProps {
    speaker: string;
    displayedText: string;
    isTyping: boolean;
    currentLineIndex: number;
    totalLines: number;
}

function DialogBox({
    speaker,
    displayedText,
    isTyping,
    currentLineIndex,
    totalLines,
}: DialogBoxProps) {
    const getHintText = () => {
        if (isTyping) return "点击加速";
        if (currentLineIndex < totalLines - 1) return "点击继续";
        return "点击结束对话";
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-black/85 backdrop-blur-xl px-12 py-8 z-20 min-h-[200px] border-t-2 border-indigo-500/30">
            {/* 说话人名称 */}
            <div className="text-indigo-400 text-xl font-bold mb-3 drop-shadow-[0_0_10px_rgba(102,126,234,0.3)]">
                {speaker}
            </div>

            {/* 对话文本 */}
            <div className="text-white text-lg leading-loose min-h-[80px] tracking-wide">
                {displayedText}
                {isTyping && (
                    <span className="animate-pulse text-indigo-400">▌</span>
                )}
            </div>

            {/* 提示文字 */}
            <div className="absolute bottom-4 right-8 text-white/50 text-sm animate-pulse">
                {getHintText()}
            </div>
        </div>
    );
}

interface DialogLoadingProps {
    backgroundImage?: string;
}

/**
 * 对话加载中屏幕
 */
export function DialogLoading({ backgroundImage }: DialogLoadingProps) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            <DialogBackground image={backgroundImage} />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/70">正在生成对话...</p>
                </div>
            </div>
        </div>
    );
}

export type { DialogScreenProps, DialogLoadingProps };
