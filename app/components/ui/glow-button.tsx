import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonColorTheme = 'amber' | 'cyan' | 'purple' | 'indigo';

const variantStyles: Record<ButtonVariant, Record<ButtonColorTheme, string>> = {
  primary: {
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-[0_0_50px_rgba(245,158,11,0.5)]',
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_0_50px_rgba(6,182,212,0.4)]',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]',
    indigo: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-[0_0_50px_rgba(99,102,241,0.4)]',
  },
  secondary: {
    amber: 'bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30',
    cyan: 'bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30',
    purple: 'bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30',
    indigo: 'bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30',
  },
  ghost: {
    amber: 'bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-amber-500/30',
    cyan: 'bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-cyan-500/30',
    purple: 'bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-purple-500/30',
    indigo: 'bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-indigo-500/30',
  },
};

const glowColors: Record<ButtonColorTheme, string> = {
  amber: 'bg-gradient-to-r from-amber-400 to-orange-400',
  cyan: 'bg-gradient-to-r from-cyan-400 to-blue-400',
  purple: 'bg-gradient-to-r from-purple-400 to-pink-400',
  indigo: 'bg-gradient-to-r from-indigo-400 to-purple-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-10 py-4 text-lg',
  xl: 'px-12 py-5 text-xl',
};

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: ReactNode;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Color theme */
  theme?: ButtonColorTheme;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to show before text */
  icon?: ReactNode;
  /** Enable glow effect on hover */
  glow?: boolean;
  /** Additional className */
  className?: string;
}

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  theme = 'amber',
  loading = false,
  icon,
  glow = true,
  className = '',
  disabled,
  ...props
}: GlowButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        group relative text-white rounded-full font-semibold
        transition-all hover:-translate-y-1
        disabled:opacity-50 disabled:cursor-not-allowed 
        disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${variantStyles[variant][theme]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-3">
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : icon ? (
          <span className="text-xl">{icon}</span>
        ) : null}
        {children}
      </span>
      
      {/* Glow effect */}
      {glow && variant === 'primary' && (
        <div 
          className={`
            absolute inset-0 rounded-full opacity-0 
            group-hover:opacity-100 blur-xl transition-opacity 
            pointer-events-none
            ${glowColors[theme]}
          `} 
        />
      )}
    </button>
  );
}
