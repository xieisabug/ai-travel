import { type ReactNode } from 'react';

export interface CardStackProps {
  /** Array of image URLs */
  images: string[];
  /** Main card title */
  title?: string;
  /** Subtitle or label */
  subtitle?: string;
  /** Fallback image if no images provided */
  fallbackImage?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export function CardStack({
  images,
  title,
  subtitle,
  fallbackImage,
  onClick,
  className = '',
}: CardStackProps) {
  const displayImages = images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];

  return (
    <div className={`relative ${className}`}>
      <div className="relative h-[500px] flex items-center justify-center">
        {/* Background Card 2 */}
        {displayImages.length > 2 && (
          <div className="absolute w-72 h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform rotate-6 translate-x-12 -translate-y-4 opacity-60">
            <img
              src={displayImages[2]}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* Background Card 1 */}
        {displayImages.length > 1 && (
          <div className="absolute w-72 h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform -rotate-3 translate-x-6 translate-y-2 opacity-80">
            <img
              src={displayImages[1]}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        {/* Main Card */}
        {displayImages.length > 0 && (
          <div
            className="relative w-80 h-[420px] rounded-2xl overflow-hidden border border-amber-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500 cursor-pointer"
            onClick={onClick}
          >
            <img
              src={displayImages[0]}
              alt={title || ''}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {(subtitle || title) && (
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {subtitle && (
                  <div className="text-amber-400 text-xs font-medium tracking-wider uppercase mb-2">
                    {subtitle}
                  </div>
                )}
                {title && (
                  <div className="text-white font-bold text-lg">{title}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {displayImages.length === 0 && (
          <div className="w-80 h-[420px] rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-white/40">
            暂无图片
          </div>
        )}
      </div>
    </div>
  );
}
