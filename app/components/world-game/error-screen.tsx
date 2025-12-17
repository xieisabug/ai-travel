interface ErrorScreenProps {
    message: string;
    onGoHome: () => void;
}

/**
 * 错误屏幕 - 显示错误信息和返回按钮
 */
export function ErrorScreen({ message, onGoHome }: ErrorScreenProps) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none" />
            <div className="text-center relative z-10">
                <h2 className="text-3xl font-bold mb-4 text-red-400">
                    😢 出错了
                </h2>
                <p className="text-white/70 mb-8">{message}</p>
                <button
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none px-8 py-4 rounded-full text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.4)]"
                    onClick={onGoHome}
                >
                    返回首页
                </button>
            </div>
        </div>
    );
}

export type { ErrorScreenProps };
