import { type ReactNode } from 'react';

export interface PageBackgroundProps {
  /** Children content */
  children: ReactNode;
  /** Optional background image URL */
  backgroundImage?: string;
  /** Background image opacity (0-100) */
  backgroundOpacity?: number;
  /** Show default radial gradient */
  showGradient?: boolean;
  /** Additional className */
  className?: string;
}

export function PageBackground({
  children,
  backgroundImage,
  backgroundOpacity = 20,
  showGradient = true,
  className = '',
}: PageBackgroundProps) {
  return (
    <div className={`min-h-screen bg-[#0a0a0f] text-white ${className}`}>
      {/* Background Image */}
      {backgroundImage && (
        <div className="fixed inset-0 pointer-events-none">
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-sm"
            style={{ opacity: backgroundOpacity / 100 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        </div>
      )}

      {/* Default Gradient */}
      {showGradient && !backgroundImage && (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export interface LoadingScreenProps {
  /** Loading message */
  message?: string;
  /** Show background image */
  backgroundImage?: string;
}

export function LoadingScreen({ message = '加载中...', backgroundImage }: LoadingScreenProps) {
  return (
    <PageBackground backgroundImage={backgroundImage} backgroundOpacity={20}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-amber-100/70 text-lg tracking-wider">{message}</p>
        </div>
      </div>
    </PageBackground>
  );
}

export interface ErrorScreenProps {
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Action button text */
  actionText?: string;
  /** Action button handler */
  onAction?: () => void;
}

export function ErrorScreen({
  title = '出错了',
  message,
  actionText = '返回',
  onAction,
}: ErrorScreenProps) {
  return (
    <PageBackground>
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="text-3xl font-bold text-amber-100">{title}</div>
          {message && <div className="text-red-400 text-sm">{message}</div>}
          {onAction && (
            <button
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
              onClick={onAction}
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </PageBackground>
  );
}
