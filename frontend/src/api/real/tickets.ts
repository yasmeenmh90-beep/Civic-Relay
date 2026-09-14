import { apiClient } from './client';
import { SLAStatus, EscalationDraft } from '../../types/ticket';
import { normalizeSLAStatus, normalizeEscalationDraft } from '../adapters/ticketAdapter';

/**
 * Retrieves live SLA countdown for a ticket from GET /tickets/{id}/sla-status.
 */
export async function getSLAStatus(ticketId: string): Promise<SLAStatus> {
  const raw = await apiClient<any>(`/tickets/${ticketId}/sla-status`, {
    method: 'GET',
  });
  return normalizeSLAStatus(raw, ticketId);
}

/**
 * Backend testing endpoint to simulate SLA expiry: POST /tickets/{id}/simulate-sla-expiry (Rule 9 compliant)
 */
export async function simulateSLAExpiry(ticketId: string): Promise<{ success: boolean; message: string; ticket_id: string }> {
  const raw = await apiClient<any>(`/tickets/${ticketId}/simulate-sla-expiry`, {
    method: 'POST',
  });
  return {
    success: true,
    message: 'SLA timer for ticket forcefully expired.',
    ticket_id: raw?.ticket_id || ticketId,
  };
}

/**
 * Generates escalation draft from POST /tickets/{id}/escalate.
 */
export async function escalateTicket(ticketId: string): Promise<{ draft: EscalationDraft; can_approve: boolean }> {
  const raw = await apiClient<any>(`/tickets/${ticketId}/escalate`, {
    method: 'POST',
  });

  return {
    draft: normalizeEscalationDraft(raw, ticketId),
    can_approve: true,
  };
}

/**
 * Citizen confirms escalation via POST /tickets/{id}/approve-escalation.
 */
export async function approveEscalation(ticketId: string, notes?: string): Promise<{ success: boolean; status: string; message?: string }> {
  const raw = await apiClient<any>(`/tickets/${ticketId}/approve-escalation`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return {
    success: true,
    status: raw?.status || 'escalated',
    message: 'Escalation approved and dispatched to municipal oversight.',
  };
}

/**
 * Marks ticket and issue as resolved via POST /tickets/{id}/resolve.
 */
export async function resolveTicket(ticketId: string, resolutionNotes?: string): Promise<{ success: boolean; status: string; message?: string }> {
  const raw = await apiClient<any>(`/tickets/${ticketId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ notes: resolutionNotes }),
  });
  return {
    success: true,
    status: raw?.status || 'resolved',
    message: 'Case marked resolved.',
  };
}
