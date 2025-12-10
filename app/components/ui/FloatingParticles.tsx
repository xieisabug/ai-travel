import { useMemo } from 'react';

export type ParticleColor = 'amber' | 'cyan' | 'purple' | 'white';

const colorClasses: Record<ParticleColor, string> = {
  amber: 'bg-amber-400/40',
  cyan: 'bg-cyan-400/40',
  purple: 'bg-purple-400/40',
  white: 'bg-white/30',
};

export interface FloatingParticlesProps {
  /** Number of particles to render */
  count?: number;
  /** Particle color theme */
  color?: ParticleColor;
  /** Minimum animation duration in seconds */
  minDuration?: number;
  /** Maximum animation duration in seconds */
  maxDuration?: number;
  /** Additional className for the container */
  className?: string;
}

export function FloatingParticles({
  count = 20,
  color = 'amber',
  minDuration = 2,
  maxDuration = 4,
  className = '',
}: FloatingParticlesProps) {
  // Generate particle positions and timing once
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${minDuration + Math.random() * (maxDuration - minDuration)}s`,
    }));
  }, [count, minDuration, maxDuration]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-1 h-1 rounded-full animate-twinkle ${colorClasses[color]}`}
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}
