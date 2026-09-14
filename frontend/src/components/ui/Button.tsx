import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'neon' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5',
      md: 'text-sm px-4 py-2.5 rounded-xl font-semibold gap-2',
      lg: 'text-base px-6 py-3.5 rounded-2xl font-semibold gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-foreground text-background hover:opacity-90 active:scale-[0.98] shadow-sm transition-all focus:ring-2 focus:ring-neon-cyan/40',
      secondary:
        'bg-surface-raised border border-border text-foreground hover:bg-surface-elevated active:scale-[0.98] shadow-subtle transition-all focus:ring-2 focus:ring-neon-cyan/30',
      outline:
        'bg-transparent border border-border text-foreground hover:bg-surface-raised hover:border-foreground-muted/40 active:scale-[0.98] transition-all',
      ghost:
        'bg-transparent text-foreground hover:bg-surface-raised active:scale-[0.98] transition-all',
      neon:
        'bg-gradient-to-r from-neon-cyan via-teal-400 to-neon-mint text-slate-900 font-bold shadow-neon-cyan hover:shadow-[0_0_25px_rgba(0,217,255,0.6)] active:scale-[0.98] transition-all duration-300 focus:ring-2 focus:ring-neon-cyan',
      danger:
        'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] shadow-neon-danger transition-all focus:ring-2 focus:ring-rose-400/40',
      success:
        'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm transition-all focus:ring-2 focus:ring-emerald-400/40',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center select-none transition-all disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer focus:outline-none',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
