import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/formatters';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-foreground-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-3 transition-all placeholder:text-foreground-muted',
              'focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 focus:shadow-[0_0_15px_rgba(0,217,255,0.15)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-foreground-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-foreground-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
