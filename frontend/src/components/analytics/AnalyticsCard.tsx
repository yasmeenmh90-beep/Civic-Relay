import React, { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/formatters';

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon: ReactNode;
  iconBgColor?: string;
  className?: string;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = 'bg-cyan-50 text-cyan-600',
  className,
}) => {
  return (
    <Card className={cn('p-6 text-left', className)}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1 font-mono">
            {value}
          </div>
        </div>
        <div className={cn('p-3 rounded-2xl shrink-0 shadow-xs', iconBgColor)}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-foreground-secondary">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-bold font-mono px-2 py-0.5 rounded-md',
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
