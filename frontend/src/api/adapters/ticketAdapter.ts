import { SLAStatus, EscalationDraft } from '../../types/ticket';

export function normalizeSLAStatus(raw: any, ticketId: string): SLAStatus {
  const sla_hours = Number(raw.sla_hours || 48);
  const total_seconds = Number(raw.total_seconds || sla_hours * 3600);
  const deadlineStr = raw.sla_deadline || raw.deadline || raw.expected_response_at || new Date().toISOString();
  const deadlineMs = new Date(deadlineStr).getTime();
  const calculatedRemainingSeconds = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));

  const remaining_seconds = Number(raw.remaining_seconds ?? (raw.sla_exceeded ? 0 : calculatedRemainingSeconds));
  const is_expired = Boolean(raw.sla_exceeded ?? raw.is_expired ?? (remaining_seconds <= 0));
  const elapsed_percentage = Number(
    raw.elapsed_percentage ?? Math.min(100, Math.max(0, Math.round(((total_seconds - remaining_seconds) / total_seconds) * 100)))
  );

  return {
    ticket_id: ticketId,
    sla_hours,
    total_seconds,
    remaining_seconds,
    elapsed_percentage,
    is_expired,
    deadline: deadlineStr,
    created_at: raw.created_at || new Date().toISOString(),
    status: raw.status || (is_expired ? 'sla_expired' : 'in_progress'),
    can_escalate: Boolean(raw.can_escalate ?? is_expired),
  };
}

export function normalizeEscalationDraft(raw: any, ticketId: string): EscalationDraft {
  const draft = raw.draft || raw.escalation_draft || raw;
  return {
    subject: draft.subject || `URGENT ESCALATION: Ticket #${ticketId}`,
    recipient: draft.recipient || draft.target_authority || 'Municipal Executive Oversight',
    reason: draft.reason || 'Statutory SLA response window elapsed without action.',
    body: draft.escalation_text || draft.body || draft.message || 'Case escalated due to lack of municipal response within SLA.',
    days_overdue: draft.overdue_hours ? Math.max(1, Math.round(draft.overdue_hours / 24)) : (draft.days_overdue ?? 1),
    escalation_level: draft.escalation_level ?? 2,
  };
}
