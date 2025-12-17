interface LoadingScreenProps {
    message?: string;
}

/**
 * 加载屏幕 - 显示加载动画和消息
 */
export function LoadingScreen({
    message = "正在准备您的旅程...",
}: LoadingScreenProps) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
            <div className="text-center relative z-10">
                <LoadingSpinner />
                <p className="text-white/70">{message}</p>
            </div>
        </div>
    );
}

/**
 * 通用加载旋转器
 */
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-8 h-8 border-2",
        md: "w-12 h-12 border-4",
        lg: "w-16 h-16 border-4",
    };

    return (
        <div
            className={`${sizeClasses[size]} border-white/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4`}
        />
    );
}

export type { LoadingScreenProps };
