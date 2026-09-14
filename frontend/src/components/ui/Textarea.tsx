import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/formatters';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, charCount, maxChars, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex justify-between items-center">
          {label && (
            <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {label}
            </label>
          )}
          {maxChars !== undefined && charCount !== undefined && (
            <span className="text-xs text-foreground-muted">
              {charCount} / {maxChars}
            </span>
          )}
        </div>
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-surface border border-border text-foreground text-sm rounded-2xl p-4 transition-all placeholder:text-foreground-muted min-h-[140px] leading-relaxed resize-y',
            'focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 focus:shadow-[0_0_18px_rgba(0,217,255,0.15)]',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-foreground-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
