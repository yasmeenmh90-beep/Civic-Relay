import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Issue } from '../../types/issue';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { truncateText, formatTicketId } from '../../utils/formatters';
import { formatDate, calculateSLARemaining } from '../../utils/date';
import {
  ArrowRight,
  Clock,
  Building2,
  MapPin,
  FileCheck2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export interface IssueCardProps {
  issue: Issue;
  className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, className }) => {
  const ticketId = issue.ticket?.ticket_number || issue.ticket_id || formatTicketId(issue.id);
  const deadline = issue.ticket?.expected_response_at || issue.expected_response_at;
  const sla = calculateSLARemaining(deadline, issue.sla_hours || 48);

  const isResolved = issue.status === 'resolved';
  const isOverdue = (sla.isExpired || issue.status === 'sla_expired' || issue.status === 'escalation_pending') && !isResolved;

  return (
    <Card
      variant="interactive"
      className={`group relative overflow-hidden flex flex-col justify-between p-6 sm:p-7 text-left transition-all duration-300 ${
        isOverdue ? 'border-amber-200/80 hover:border-amber-300' : ''
      } ${className || ''}`}
    >
      {/* Top row: Category, Severity, Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">
              {issue.category}
            </span>
            <SeverityBadge severity={issue.severity} size="sm" />
          </div>
          <StatusBadge status={issue.status} size="sm" />
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-cyan-950 transition-colors line-clamp-1">
            {issue.title || `${issue.category.toUpperCase()} Issue`}
          </h3>
          <p className="text-xs text-foreground-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        </div>

        {/* Thumbnail preview if photo exists */}
        {issue.image_url && (
          <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 my-2">
            <img
              src={issue.image_url}
              alt={issue.title || 'Civic Issue'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {issue.address && (
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-1.5 text-[11px] text-white font-medium drop-shadow truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{issue.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Metadata pills: Ticket ID, Authority */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
          <div className="bg-surface-raised p-2.5 rounded-xl border border-border">
            <span className="text-[10px] uppercase font-bold text-foreground-muted block">
              Ticket
            </span>
            <span className="font-mono font-bold text-foreground mt-0.5 block truncate">
              {ticketId}
            </span>
          </div>

          <div className="bg-surface-raised p-2.5 rounded-xl border border-border">
            <span className="text-[10px] uppercase font-bold text-foreground-muted block">
              SLA Window
            </span>
            <span
              className={`font-mono font-bold text-xs mt-0.5 flex items-center gap-1 truncate ${
                isResolved
                  ? 'text-emerald-600 dark:text-neon-mint'
                  : isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                  : 'text-cyan-800 dark:text-neon-cyan'
              }`}
            >
              {isResolved ? (
                'Resolved'
              ) : isOverdue ? (
                <>
                  <Flame className="w-3.5 h-3.5 shrink-0 animate-pulse text-rose-500" />
                  <span>Expired</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 shrink-0 text-cyan-600 dark:text-neon-cyan" />
                  <span>{sla.formatted}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {issue.authority && (
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary truncate">
            <Building2 className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
            <span className="truncate font-medium">{issue.authority}</span>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-foreground-muted">
          {formatDate(issue.created_at)}
        </span>

        <Link to={`/issues/${issue.id}`}>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />}
            className="text-xs font-bold text-foreground hover:text-cyan-700 dark:hover:text-neon-cyan p-0 hover:bg-transparent"
          >
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
};
