import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/formatters';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'neon' | 'subtle';
  glowColor?: 'cyan' | 'mint' | 'purple' | 'warning' | 'danger';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glowColor, children, ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-surface border border-border rounded-3xl shadow-card transition-all duration-300',
      glass:
        'glass-panel rounded-3xl shadow-card',
      interactive:
        'bg-surface border border-border rounded-3xl shadow-card hover:border-foreground-muted/40 hover:shadow-3d-hover hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-200',
      neon:
        'bg-surface border border-neon-cyan/40 rounded-3xl shadow-neon-cyan transition-all duration-300',
      subtle:
        'bg-surface-raised border border-border/80 rounded-2xl',
    };

    const glowStyles = glowColor
      ? {
          cyan: 'hover:border-neon-cyan/60 hover:shadow-neon-cyan',
          mint: 'hover:border-neon-mint/60 hover:shadow-neon-mint',
          purple: 'hover:border-neon-purple/60 hover:shadow-neon-purple',
          warning: 'hover:border-status-warning/60 hover:shadow-neon-warning',
          danger: 'hover:border-status-danger/60 hover:shadow-neon-danger',
        }[glowColor]
      : '';

    return (
      <div
        ref={ref}
        className={cn(variantStyles[variant], glowStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
