import React, { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '../../utils/formatters';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface border border-border rounded-3xl shadow-card',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-foreground-secondary mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm text-foreground-secondary mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="neon"
          size="md"
          onClick={onAction}
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
