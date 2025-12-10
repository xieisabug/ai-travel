import { type ReactNode } from 'react';

export type ColorTheme = 'amber' | 'cyan' | 'purple' | 'indigo';

const themeColors: Record<ColorTheme, string> = {
  amber: 'text-amber-400',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  indigo: 'text-indigo-400',
};

const themeLabelColors: Record<ColorTheme, string> = {
  amber: 'text-amber-400/80',
  cyan: 'text-cyan-400/80',
  purple: 'text-purple-400/80',
  indigo: 'text-indigo-400/80',
};

export interface SectionHeaderProps {
  /** Small label text above the title */
  label?: string;
  /** Main title - can include ReactNode for colored text */
  title: ReactNode;
  /** Optional description text */
  description?: string;
  /** Color theme for accent text */
  theme?: ColorTheme;
  /** Text alignment */
  align?: 'left' | 'center';
  /** Additional className */
  className?: string;
}

export function SectionHeader({
  label,
  title,
  description,
  theme = 'amber',
  align = 'left',
  className = '',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`${alignClass} ${className}`}>
      {label && (
        <p className={`text-sm font-medium tracking-[0.25em] uppercase mb-4 ${themeLabelColors[theme]}`}>
          {label}
        </p>
      )}
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-white/50 text-lg max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}

/** Helper to create highlighted text within titles */
export function HighlightText({
  children,
  theme = 'amber',
}: {
  children: ReactNode;
  theme?: ColorTheme;
}) {
  return <span className={themeColors[theme]}>{children}</span>;
}
