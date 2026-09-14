export type TicketStatus = 
  | 'created'
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'sla_expired'
  | 'escalation_pending'
  | 'escalated'
  | 'resolved'
  | 'rejected';

export interface SLAStatus {
  ticket_id: string;
  sla_hours: number;
  total_seconds: number;
  remaining_seconds: number;
  elapsed_percentage: number;
  is_expired: boolean;
  deadline: string;
  created_at: string;
  status: TicketStatus;
  can_escalate: boolean;
}

export interface EscalationDraft {
  subject: string;
  recipient: string;
  reason: string;
  body: string;
  days_overdue?: number;
  escalation_level?: number;
}

export interface FormalComplaint {
  subject: string;
  recipient_authority: string;
  jurisdiction?: string;
  body: string;
  urgency_clause?: string;
  generated_at?: string;
}

export interface Ticket {
  id: string;
  ticket_number?: string;
  issue_id?: string;
  authority_name: string;
  authority_contact?: string;
  status: TicketStatus;
  submitted_at: string;
  expected_response_at: string;
  sla_status?: SLAStatus;
  escalation_draft?: EscalationDraft;
  escalated_at?: string;
  resolved_at?: string;
  notes?: string;
}
