import React, { useRef, useState, MouseEvent } from 'react';
import { cn } from '../../utils/formatters';

interface DepthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'mint' | 'purple' | 'amber' | 'rose' | 'none';
  tiltIntensity?: number;
  glass?: boolean;
}

export const DepthCard: React.FC<DepthCardProps> = ({
  children,
  className,
  glowColor = 'cyan',
  tiltIntensity = 10,
  glass = false,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -tiltIntensity;
    const rotY = ((x - centerX) / centerX) * tiltIntensity;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlowPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const glowColorMap = {
    cyan: 'rgba(0, 217, 255, 0.15)',
    mint: 'rgba(92, 255, 176, 0.15)',
    purple: 'rgba(155, 140, 255, 0.15)',
    amber: 'rgba(255, 184, 77, 0.15)',
    rose: 'rgba(255, 107, 129, 0.15)',
    none: 'transparent',
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'relative rounded-2xl transition-shadow duration-300 overflow-hidden',
          glass
            ? 'glass-panel shadow-card'
            : 'bg-surface border border-border/80 shadow-subtle hover:shadow-3d-hover',
          className
        )}
        {...props}
      >
        {isHovered && glowColor !== 'none' && (
          <div
            className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300 z-0"
            style={{
              background: `radial-gradient(400px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColorMap[glowColor]}, transparent 70%)`,
            }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};

