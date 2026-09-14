import React from 'react';
import { cn } from '../../utils/formatters';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-surface-elevated',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-card space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-4 border-t border-border flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
};
