import { type ReactNode } from 'react';

export type FeatureCardTheme = 'amber' | 'cyan' | 'purple' | 'orange' | 'default';

const iconColors: Record<FeatureCardTheme, string> = {
  amber: 'text-amber-400',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
  default: 'text-white/60',
};

export interface FeatureCardProps {
  /** Icon or emoji to display */
  icon: ReactNode;
  /** Label text (small, uppercase) */
  label: string;
  /** Main content text */
  content: string;
  /** Color theme for the icon */
  theme?: FeatureCardTheme;
  /** Max lines for content (uses line-clamp) */
  maxLines?: number;
  /** Additional className */
  className?: string;
}

export function FeatureCard({
  icon,
  label,
  content,
  theme = 'default',
  maxLines = 2,
  className = '',
}: FeatureCardProps) {
  return (
    <div 
      className={`
        bg-white/[0.03] border border-white/[0.06] rounded-xl p-4
        transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10
        ${className}
      `}
    >
      <div className={`text-2xl mb-2 ${iconColors[theme]}`}>{icon}</div>
      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-white/80 text-sm line-clamp-${maxLines}`}>{content}</div>
    </div>
  );
}

export interface FeatureGridProps {
  /** Array of feature items */
  features: Array<{
    icon: ReactNode;
    label: string;
    content: string;
    theme?: FeatureCardTheme;
  }>;
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

export function FeatureGrid({ features, columns = 2, className = '' }: FeatureGridProps) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-4 ${className}`}>
      {features.map((feature, idx) => (
        <FeatureCard
          key={idx}
          icon={feature.icon}
          label={feature.label}
          content={feature.content}
          theme={feature.theme}
        />
      ))}
    </div>
  );
}
