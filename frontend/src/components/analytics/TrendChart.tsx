import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { TrendDataPoint } from '../../types/analytics';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

export interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'Case Inflow & Resolution Dynamics',
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <Card className={`p-6 text-left ${className || ''}`}>
        <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-foreground-secondary mt-0.5">
          Daily reports, completed resolutions, and autonomous escalations
        </p>
        <div className="h-64 flex flex-col items-center justify-center text-foreground-muted">
          <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">No trend data available yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 text-left ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Daily reports, completed resolutions, and autonomous escalations
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00D9FF" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#35D07F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#35D07F" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorEscalated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B81" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF6B81" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E2B42' : '#EEF2F7'} vertical={false} />
            <XAxis dataKey="date" stroke={isDark ? '#627289' : '#94A3B8'} fontSize={12} tickLine={false} />
            <YAxis stroke={isDark ? '#627289' : '#94A3B8'} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0D1422' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#1E2B42' : '#E4E9F0'}`,
                color: isDark ? '#F5F7FA' : '#172033',
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="reports"
              name="New Inflow"
              stroke="#00D9FF"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorReports)"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke="#35D07F"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResolved)"
            />
            <Area
              type="monotone"
              dataKey="escalated"
              name="Escalations"
              stroke="#FF6B81"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEscalated)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
