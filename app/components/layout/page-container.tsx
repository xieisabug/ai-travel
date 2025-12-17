import type { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    showBackgroundDecorations?: boolean;
}

/**
 * 页面容器组件，提供统一的背景装饰和基础样式
 */
export function PageContainer({
    children,
    className = "",
    showBackgroundDecorations = true,
}: PageContainerProps) {
    return (
        <div className={`min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden relative ${className}`}>
            {showBackgroundDecorations && <BackgroundDecorations />}
            {children}
        </div>
    );
}

/**
 * 背景装饰组件 - 可在多个页面复用
 */
export function BackgroundDecorations() {
    return (
        <>
            {/* 渐变背景 */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(102,126,234,0.15),transparent)] pointer-events-none z-0" />
            {/* 网格背景 */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />
            {/* 中心光晕 */}
            <div className="fixed top-1/2 left-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(118,75,162,0.1)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
        </>
    );
}
