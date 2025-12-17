/**
 * 后备屏幕 - 当没有匹配的状态时显示
 */
export function FallbackScreen() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-black" />
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
                <p className="text-white/70">加载中...</p>
            </div>
        </div>
    );
}
