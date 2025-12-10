import type { TravelProject } from '~/types/world';

export type ProjectCardTheme = 'cyan' | 'amber' | 'purple';

const themeStyles: Record<ProjectCardTheme, {
  border: string;
  shadow: string;
  badge: string;
  badgeShadow: string;
  titleHover: string;
  glow: string;
}> = {
  cyan: {
    border: 'hover:border-cyan-500/30',
    shadow: 'hover:shadow-[0_30px_60px_rgba(6,182,212,0.15)]',
    badge: 'bg-cyan-500',
    badgeShadow: 'shadow-cyan-500/30',
    titleHover: 'group-hover:text-cyan-400',
    glow: 'from-cyan-500/10',
  },
  amber: {
    border: 'hover:border-amber-500/30',
    shadow: 'hover:shadow-[0_30px_60px_rgba(245,158,11,0.15)]',
    badge: 'bg-amber-500',
    badgeShadow: 'shadow-amber-500/30',
    titleHover: 'group-hover:text-amber-400',
    glow: 'from-amber-500/10',
  },
  purple: {
    border: 'hover:border-purple-500/30',
    shadow: 'hover:shadow-[0_30px_60px_rgba(168,85,247,0.15)]',
    badge: 'bg-purple-500',
    badgeShadow: 'shadow-purple-500/30',
    titleHover: 'group-hover:text-purple-400',
    glow: 'from-purple-500/10',
  },
};

export interface ProjectCardProps {
  /** Project data */
  project: TravelProject;
  /** Display index (1-based) */
  index: number;
  /** Color theme */
  theme?: ProjectCardTheme;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export function ProjectCard({
  project,
  index,
  theme = 'cyan',
  onClick,
  className = '',
}: ProjectCardProps) {
  const styles = themeStyles[theme];

  return (
    <div
      className={`group relative flex-shrink-0 w-[320px] md:w-[380px] snap-center ${className}`}
      onClick={onClick}
    >
      <div 
        className={`
          relative rounded-2xl overflow-hidden 
          bg-gradient-to-br from-white/[0.06] to-white/[0.02] 
          border border-white/10 transition-all duration-500 
          hover:-translate-y-2 cursor-pointer
          ${styles.border} ${styles.shadow}
        `}
      >
        {/* Project Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {project.coverImage ? (
            <img
              src={project.coverImage}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a]">
              <span className="text-6xl">🗺️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />

          {/* Index Badge */}
          <div 
            className={`
              absolute top-4 left-4 w-10 h-10 rounded-full text-white font-bold 
              flex items-center justify-center shadow-lg
              ${styles.badge} ${styles.badgeShadow}
            `}
          >
            {index}
          </div>

          {/* Difficulty Badge */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white/80">
            难度 {'★'.repeat(project.difficulty)}{'☆'.repeat(5 - project.difficulty)}
          </div>
        </div>

        {/* Project Info */}
        <div className="relative p-6">
          <h4 className={`text-white font-bold text-xl mb-2 line-clamp-1 transition-colors ${styles.titleHover}`}>
            {project.name}
          </h4>
          <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div 
          className={`
            absolute inset-0 rounded-2xl bg-gradient-to-t via-transparent to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
            ${styles.glow}
          `} 
        />
      </div>
    </div>
  );
}

export interface ProjectCarouselProps {
  /** Array of projects */
  projects: TravelProject[];
  /** Color theme */
  theme?: ProjectCardTheme;
  /** Click handler for individual project */
  onProjectClick?: (project: TravelProject) => void;
  /** Additional className */
  className?: string;
}

export function ProjectCarousel({
  projects,
  theme = 'cyan',
  onProjectClick,
  className = '',
}: ProjectCarouselProps) {
  return (
    <div className={`flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 ${className}`}>
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index + 1}
          theme={theme}
          onClick={() => onProjectClick?.(project)}
        />
      ))}
    </div>
  );
}
