import { type ReactNode } from 'react';

export type ImageCardSize = 'sm' | 'md' | 'lg' | 'featured';
export type ImageCardTheme = 'amber' | 'cyan' | 'purple' | 'default';

const hoverBorderColors: Record<ImageCardTheme, string> = {
  amber: 'hover:border-amber-500/30 hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)]',
  cyan: 'hover:border-cyan-500/30 hover:shadow-[0_20px_60px_rgba(6,182,212,0.15)]',
  purple: 'hover:border-purple-500/30 hover:shadow-[0_20px_60px_rgba(168,85,247,0.15)]',
  default: 'hover:border-white/20',
};

const sizeStyles: Record<ImageCardSize, string> = {
  sm: 'aspect-square',
  md: 'aspect-[4/3]',
  lg: 'aspect-[16/10]',
  featured: 'min-h-[400px] h-full',
};

export interface ImageCardProps {
  /** Image source URL */
  src: string;
  /** Alt text for image */
  alt?: string;
  /** Size preset */
  size?: ImageCardSize;
  /** Color theme for hover effects */
  theme?: ImageCardTheme;
  /** Optional overlay content shown on hover */
  overlay?: ReactNode;
  /** Optional badge shown on hover */
  badge?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export function ImageCard({
  src,
  alt = '',
  size = 'md',
  theme = 'amber',
  overlay,
  badge,
  onClick,
  className = '',
}: ImageCardProps) {
  return (
    <div 
      className={`group cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div 
        className={`
          relative rounded-2xl overflow-hidden border border-white/10 
          transition-all duration-500
          ${hoverBorderColors[theme]}
          ${sizeStyles[size]}
        `}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badge */}
        {badge && (
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            {badge}
          </div>
        )}
        
        {/* Custom overlay */}
        {overlay}
      </div>
    </div>
  );
}

export interface ImageBadgeProps {
  /** Badge icon (emoji or component) */
  icon?: ReactNode;
  /** Badge text */
  text: string;
  /** Color theme */
  theme?: ImageCardTheme;
}

export function ImageBadge({ icon, text, theme = 'amber' }: ImageBadgeProps) {
  const bgColors: Record<ImageCardTheme, string> = {
    amber: 'bg-amber-500/80',
    cyan: 'bg-cyan-500/80',
    purple: 'bg-purple-500/80',
    default: 'bg-white/20',
  };

  return (
    <span className={`px-3 py-1.5 backdrop-blur-sm rounded-full text-white text-xs font-medium ${bgColors[theme]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </span>
  );
}
