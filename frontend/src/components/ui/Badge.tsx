import React from 'react';
import { cn } from '../../utils/formatters';
import { mapIssueStatus, mapSeverity } from '../../utils/statusMapper';

export interface StatusBadgeProps {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className,
}) => {
  const config = mapIssueStatus(status);

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full font-medium gap-1.5',
    md: 'text-xs px-3 py-1 rounded-full font-semibold gap-1.5',
    lg: 'text-sm px-4 py-1.5 rounded-full font-semibold gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none transition-all shadow-xs',
        config.badgeClass,
        config.glowClass,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span className="relative flex items-center justify-center">
          <span className={cn('rounded-full shrink-0', config.dotClass, dotSizes[size])} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export interface SeverityBadgeProps {
  severity?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  className,
}) => {
  const config = mapSeverity(severity);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-mono uppercase tracking-wider rounded-lg font-bold select-none',
        config.badgeClass,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dotColor }}
      />
      <span>{config.label}</span>
    </span>
  );
};
