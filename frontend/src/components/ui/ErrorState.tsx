import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/formatters';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load content',
  message = 'An unexpected error occurred while communicating with CivicRelay servers.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-card',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm text-foreground-secondary mt-1.5 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="mt-5 border-rose-200 hover:bg-rose-50"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
