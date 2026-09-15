import { IssueStatus, SeverityLevel } from '../types/issue';

export interface StatusConfig {
  label: string;
  badgeClass: string;
  glowClass: string;
  dotClass: string;
  description: string;
}

export function mapIssueStatus(status?: string): StatusConfig {
  const normalized = (status || '').toLowerCase().trim().replace(/[-\s]/g, '_');

  switch (normalized) {
    case 'processing':
    case 'triaging':
    case 'analyzing':
      return {
        label: 'AI Processing',
        badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-neon-cyan/15 dark:text-neon-cyan dark:border-neon-cyan/40',
        glowClass: 'shadow-[0_0_12px_rgba(0,217,255,0.25)]',
        dotClass: 'bg-neon-cyan animate-ping',
        description: 'Agents are actively analyzing and preparing your complaint.',
      };

    case 'submitted':
    case 'created':
      return {
        label: 'Submitted',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
        glowClass: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
        dotClass: 'bg-blue-500',
        description: 'Case registered and formally dispatched to the department.',
      };

    case 'waiting_for_authority':
    case 'waiting':
    case 'pending_acknowledgment':
      return {
        label: 'Waiting for Authority',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        glowClass: 'shadow-[0_0_8px_rgba(245,158,11,0.25)]',
        dotClass: 'bg-amber-500',
        description: 'Dispatched to authority. Monitoring for first response.',
      };

    case 'in_progress':
    case 'acknowledged':
    case 'active':
      return {
        label: 'In Progress',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
        glowClass: 'shadow-[0_0_10px_rgba(99,102,241,0.25)]',
        dotClass: 'bg-indigo-500',
        description: 'Authority acknowledged and assigned field crews.',
      };

    case 'sla_expired':
    case 'overdue':
    case 'delayed':
      return {
        label: 'SLA Overdue',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
        glowClass: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
        dotClass: 'bg-rose-500 animate-pulse',
        description: 'Expected resolution window passed without action.',
      };

    case 'escalation_pending':
    case 'escalation_ready':
    case 'awaiting_approval':
      return {
        label: 'Escalation Ready',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60',
        glowClass: 'shadow-[0_0_15px_rgba(255,184,77,0.45)]',
        dotClass: 'bg-amber-500 animate-bounce',
        description: 'Escalation drafted. Requires citizen authorization.',
      };

    case 'escalated':
      return {
        label: 'Escalated',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
        glowClass: 'shadow-[0_0_12px_rgba(155,140,255,0.35)]',
        dotClass: 'bg-purple-500',
        description: 'Escalated to senior municipal oversight & department head.',
      };

    case 'resolved':
    case 'closed':
    case 'completed':
      return {
        label: 'Resolved',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        glowClass: 'shadow-[0_0_12px_rgba(52,211,153,0.35)]',
        dotClass: 'bg-emerald-500',
        description: 'Issue inspected and marked resolved by municipal team.',
      };

    case 'failed':
    case 'rejected':
      return {
        label: 'Failed / Rejected',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
        glowClass: '',
        dotClass: 'bg-red-500',
        description: 'Case could not be dispatched or was rejected by jurisdiction.',
      };

    default:
      return {
        label: status || 'Pending',
        badgeClass: 'bg-surface-raised text-foreground border-border dark:bg-surface-elevated dark:text-foreground-secondary dark:border-border',
        glowClass: '',
        dotClass: 'bg-foreground-muted',
        description: 'Case status updating.',
      };
  }
}

export interface SeverityConfig {
  label: string;
  badgeClass: string;
  dotColor: string;
  level: number;
}

export function mapSeverity(severity?: string): SeverityConfig {
  const norm = (severity || '').toLowerCase();
  if (norm === 'emergency' || norm === 'critical') {
    return {
      label: 'EMERGENCY',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      dotColor: '#FF6B81',
      level: 4,
    };
  }
  if (norm === 'high') {
    return {
      label: 'HIGH',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dotColor: '#FFB84D',
      level: 3,
    };
  }
  if (norm === 'medium') {
    return {
      label: 'MEDIUM',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
      dotColor: '#00D9FF',
      level: 2,
    };
  }
  return {
    label: 'LOW',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dotColor: '#5CFFB0',
    level: 1,
  };
}

export function mapCategoryIcon(category?: string): string {
  const norm = (category || '').toLowerCase();
  if (norm.includes('pothole') || norm.includes('road')) return 'AlertTriangle';
  if (norm.includes('garbage') || norm.includes('waste')) return 'Trash2';
  if (norm.includes('street') || norm.includes('light')) return 'Lightbulb';
  if (norm.includes('water') || norm.includes('pipe')) return 'Droplets';
  if (norm.includes('drain')) return 'Waves';
  if (norm.includes('traffic')) return 'Compass';
  if (norm.includes('park')) return 'Trees';
  return 'FileText';
}
