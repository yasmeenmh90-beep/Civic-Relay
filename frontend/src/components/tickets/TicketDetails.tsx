import React from 'react';
import { Ticket } from '../../types/ticket';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { formatDateTime, formatDate } from '../../utils/date';
import { Building2, Hash, Calendar, Clock, ShieldCheck, Mail } from 'lucide-react';

export interface TicketDetailsProps {
  ticket: Ticket;
  className?: string;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket, className }) => {
  return (
    <Card className={className}>
      <div className="p-6 sm:p-7 text-left space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-neon-cyan">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                MUNICIPAL TICKET REFERENCE
              </span>
              <h3 className="text-xl font-extrabold text-foreground font-mono">
                {ticket.ticket_number || ticket.id}
              </h3>
            </div>
          </div>
          <StatusBadge status={ticket.status} size="lg" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-surface-raised border border-border">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <Building2 className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs font-semibold uppercase tracking-wider">Assigned Authority</span>
            </div>
            <p className="text-sm font-bold text-foreground">{ticket.authority_name}</p>
            {ticket.authority_contact && (
              <p className="text-xs text-foreground-secondary mt-0.5">{ticket.authority_contact}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-surface-raised border border-border">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <Calendar className="w-4 h-4 text-neon-mint" />
              <span className="text-xs font-semibold uppercase tracking-wider">Dispatched Timestamp</span>
            </div>
            <p className="text-sm font-bold text-foreground font-mono">{formatDateTime(ticket.submitted_at)}</p>
            <p className="text-xs text-foreground-secondary mt-0.5">Automated API Transmission</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-raised border border-border">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold uppercase tracking-wider">Target Resolution Deadline</span>
            </div>
            <p className="text-sm font-bold text-foreground font-mono">{formatDateTime(ticket.expected_response_at)}</p>
            <p className="text-xs text-foreground-secondary mt-0.5">Guaranteed by City Service Charter</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-raised border border-border">
            <div className="flex items-center gap-2 text-foreground-muted mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">Jurisdiction Routing</span>
            </div>
            <p className="text-sm font-bold text-foreground">Verified Autonomous Dispatch</p>
            <p className="text-xs text-foreground-secondary mt-0.5">Action Agent Direct Channel</p>
          </div>
        </div>

        {ticket.notes && (
          <div className="p-4 rounded-2xl bg-surface-raised border border-border text-xs text-foreground leading-relaxed">
            <span className="font-bold">Authority Note: </span> {ticket.notes}
          </div>
        )}
      </div>
    </Card>
  );
};
