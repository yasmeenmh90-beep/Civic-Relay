import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Building2 } from 'lucide-react';
import { AuthorityAnalytics } from '../../types/analytics';
import { Card } from '../ui/Card';
import { formatPercent } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

export interface AuthorityChartProps {
  data: AuthorityAnalytics[];
  className?: string;
}

export const AuthorityChart: React.FC<AuthorityChartProps> = ({ data, className }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <Card className={`p-6 text-left ${className || ''}`}>
        <h3 className="text-base font-bold text-foreground tracking-tight">
          Authority Performance & Workload
        </h3>
        <p className="text-xs text-foreground-secondary mt-0.5">
          Active workload, resolved cases, and charter SLA adherence across municipal departments
        </p>
        <div className="h-64 flex flex-col items-center justify-center text-foreground-muted">
          <Building2 className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">No authority data available yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 text-left ${className || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">
            Authority Performance & Workload
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Active workload, resolved cases, and charter SLA adherence across municipal departments
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E2B42' : '#EEF2F7'} horizontal={false} />
            <XAxis type="number" stroke={isDark ? '#627289' : '#94A3B8'} fontSize={12} tickLine={false} />
            <YAxis
              type="category"
              dataKey="authority_name"
              stroke={isDark ? '#9AA7BA' : '#667085'}
              fontSize={11}
              tickLine={false}
              width={140}
              tickFormatter={(val) => (val.length > 18 ? `${val.slice(0, 18)}...` : val)}
            />
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
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="active_issues" name="Active" fill="#00D9FF" radius={[0, 6, 6, 0]} barSize={12} />
            <Bar dataKey="resolved_issues" name="Resolved" fill="#35D07F" radius={[0, 6, 6, 0]} barSize={12} />
            <Bar dataKey="escalated_issues" name="Escalated" fill="#FF6B81" radius={[0, 6, 6, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SLA Adherence Cards */}
      <div className="mt-6 pt-4 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((item) => (
          <div key={item.id} className="p-3 bg-surface-raised rounded-2xl border border-border/70 text-left">
            <span className="text-[10px] font-bold text-foreground-muted uppercase block truncate">
              {item.authority_name}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-extrabold text-foreground font-mono">
                {formatPercent(item.sla_adherence_percent)}
              </span>
              <span className="text-[11px] text-foreground-secondary font-mono">
                ~{item.avg_response_hours}h avg
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
