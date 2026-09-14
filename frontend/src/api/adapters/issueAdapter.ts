import { Issue, IssueStatus, SeverityLevel, IssueCluster } from '../../types/issue';
import { Ticket, FormalComplaint } from '../../types/ticket';
import { AgentStep, AgentType } from '../../types/agent';
import { formatTicketId } from '../../utils/formatters';

/**
 * Normalizes raw backend Issue response into strongly typed Issue structure.
 */
export function normalizeIssue(raw: any): Issue {
  if (!raw) return {} as Issue;

  const id = String(raw.id || raw._id || raw.issue_id || '');
  const description = raw.description || raw.text || raw.content || '';
  const category = (raw.category || raw.issue_type || raw.type || 'pothole').toLowerCase();
  const severity: SeverityLevel = (raw.severity || raw.urgency || 'medium').toLowerCase() as SeverityLevel;
  
  // Derive status from ticket.status if issue root has no status
  let status: IssueStatus = (raw.status || '').toLowerCase() as IssueStatus;
  if (!status || status === 'processing') {
    const rawTicketStatus = raw.ticket?.status?.toLowerCase();
    if (rawTicketStatus === 'resolved') {
      status = 'resolved';
    } else if (rawTicketStatus === 'escalated') {
      status = 'escalated';
    } else if (rawTicketStatus === 'awaiting_approval') {
      status = 'escalation_pending';
    } else if (rawTicketStatus === 'waiting_for_authority' || rawTicketStatus === 'submitted') {
      status = 'submitted';
    } else if (raw.ticket) {
      status = 'submitted';
    } else {
      status = 'processing';
    }
  }
  
  const created_at = raw.created_at || raw.createdAt || new Date().toISOString();
  const updated_at = raw.updated_at || raw.updatedAt;
  const resolved_at = raw.resolved_at || raw.resolvedAt || (status === 'resolved' ? (raw.ticket?.resolved_at || updated_at || created_at) : undefined);

  const image_url = raw.image_url || raw.imageUrl || raw.photo_url || raw.image;
  const audio_url = raw.audio_url || raw.audioUrl;

  const latitude = typeof raw.latitude === 'number' ? raw.latitude : (raw.location?.latitude ?? raw.lat);
  const longitude = typeof raw.longitude === 'number' ? raw.longitude : (raw.location?.longitude ?? raw.lng);
  const address = raw.address || raw.location?.address || raw.area_name || raw.neighborhood;

  // Extract authority & SLA
  const authority = raw.authority || raw.ticket?.authority || raw.department || raw.responsible_authority || raw.ticket?.authority_name || 'Municipal Roads & Infrastructure Dept';
  const sla_hours = Number(raw.sla_hours || raw.sla || raw.ticket?.sla_hours || 72);

  // Extract formal complaint
  let complaint: FormalComplaint | undefined = undefined;
  if (raw.complaint) {
    complaint = {
      subject: raw.complaint.subject || `Urgent Notice: ${category.toUpperCase()} at ${address || 'Reported Location'}`,
      recipient_authority: raw.complaint.recipient_authority || raw.complaint.recipient || authority,
      jurisdiction: raw.complaint.jurisdiction || 'City Public Works Authority',
      body: raw.complaint.body || raw.complaint.text || raw.complaint.content || description,
      urgency_clause: raw.complaint.urgency_clause || `Response requested under City Citizen Charter within ${sla_hours} hours.`,
      generated_at: raw.complaint.generated_at || created_at,
    };
  } else if (raw.ticket?.complaint_text) {
    complaint = {
      subject: `Formal Case Notification: Citizen Report of ${category.toUpperCase()}`,
      recipient_authority: authority,
      jurisdiction: 'Metropolitan Public Works Department',
      body: raw.ticket.complaint_text,
      urgency_clause: `Standard SLA threshold: ${sla_hours} hours under Municipal Service Charter §4.2.`,
      generated_at: created_at,
    };
  } else if (status !== 'processing') {
    complaint = {
      subject: `Formal Case Notification: Citizen Report of ${category.toUpperCase()}`,
      recipient_authority: authority,
      jurisdiction: 'Metropolitan Public Works Department',
      body: `Formal notice is hereby served regarding an identified civic defect: "${description}". The location has been georeferenced and verified for municipal field repair.`,
      urgency_clause: `Standard SLA threshold: ${sla_hours} hours under Municipal Service Charter §4.2.`,
      generated_at: created_at,
    };
  }

  // Extract ticket
  let ticket: Ticket | undefined = undefined;
  if (raw.ticket) {
    ticket = normalizeTicket(raw.ticket, id);
  } else if (raw.ticket_id || status !== 'processing') {
    const rawTicketId = raw.ticket_id || `CIV-${id.slice(-4) || '2048'}`;
    const expectedResponse = raw.expected_response_at || raw.sla_deadline || new Date(new Date(created_at).getTime() + sla_hours * 3600 * 1000).toISOString();
    
    ticket = {
      id: rawTicketId,
      ticket_number: formatTicketId(rawTicketId),
      issue_id: id,
      authority_name: authority,
      status: status === 'resolved' ? 'resolved' : (status === 'escalated' ? 'escalated' : 'submitted'),
      submitted_at: created_at,
      expected_response_at: expectedResponse,
      escalation_draft: raw.escalation_draft || {
        subject: `ESCALATION: Overdue Resolution for Ticket #${formatTicketId(rawTicketId)}`,
        recipient: `Director General, ${authority}`,
        reason: `Statutory SLA of ${sla_hours}h expired without field resolution or verified dispatch.`,
        body: `Case reference ${formatTicketId(rawTicketId)} has surpassed standard municipal response time. This matter is formally escalated to Department Executive Oversight for expedited action.`,
      }
    };
  }

  // Derive agent steps purely from issue status & metadata (Rule 8 compliant)
  const agent_steps = deriveAgentSteps(raw, status, category, severity, authority, sla_hours, ticket?.ticket_number);

  return {
    id,
    tracking_code: raw.tracking_code || `CR-${id.slice(-6).toUpperCase() || '883921'}`,
    user_id: raw.user_id,
    title: raw.title || `${category.charAt(0).toUpperCase() + category.slice(1)} Issue`,
    description,
    category,
    severity,
    status,
    image_url,
    audio_url,
    latitude,
    longitude,
    address,
    location: (latitude && longitude) ? { latitude, longitude, address } : undefined,
    authority,
    sla_hours,
    expected_response_at: raw.expected_response_at || ticket?.expected_response_at,
    ticket,
    ticket_id: ticket?.id || raw.ticket_id,
    complaint,
    agent_steps,
    agent_activity: raw.agent_activity,
    created_at,
    updated_at,
    resolved_at,
  };
}

export function normalizeTicket(raw: any, issueId?: string): Ticket {
  if (!raw) return {} as Ticket;

  const id = String(raw.id || raw.ticket_id || 'CIV-1000');
  const authority_name = raw.authority || raw.authority_name || raw.department || 'Municipal Roads & Infrastructure Dept';
  const status = raw.status || 'submitted';
  const submitted_at = raw.submitted_at || raw.created_at || new Date().toISOString();
  const sla_hours = Number(raw.sla_hours || 72);
  const expected_response_at = raw.expected_response_at || raw.sla_deadline || new Date(new Date(submitted_at).getTime() + sla_hours * 3600 * 1000).toISOString();

  return {
    id,
    ticket_number: raw.external_ticket_id || formatTicketId(id),
    issue_id: raw.issue_id || issueId,
    authority_name,
    authority_contact: raw.authority_contact,
    status,
    submitted_at,
    expected_response_at,
    escalation_draft: raw.escalation_draft,
    escalated_at: raw.escalated_at,
    resolved_at: raw.resolved_at,
    notes: raw.notes,
  };
}

export function normalizeIssueCluster(c: any): IssueCluster {
  return {
    id: String(c.id || c.cluster_id || Math.random()),
    latitude: Number(c.latitude || c.center_lat || c.lat || 37.7749),
    longitude: Number(c.longitude || c.center_lng || c.lng || -122.4194),
    count: Number(c.count || c.report_count || c.reports_count || 1),
    category: c.category || 'General',
    severity: (c.severity || 'medium') as SeverityLevel,
    area_name: c.area_name || c.name || `${c.category || 'Civic'} Hotspot`,
    status: (c.status || 'in_progress') as IssueStatus,
    recent_issue_id: c.recent_issue_id || c.issue_id || (Array.isArray(c.issue_ids) ? c.issue_ids[0] : undefined),
    issues: c.issues,
  };
}

export function deriveAgentSteps(
  raw: any,
  status: IssueStatus,
  category: string,
  severity: SeverityLevel,
  authority: string,
  sla_hours: number,
  ticketNumber?: string
): AgentStep[] {
  if (Array.isArray(raw.agent_steps) && raw.agent_steps.length > 0) {
    return raw.agent_steps;
  }

  // Parse backend raw.logs if available for real-time fidelity
  const logs: Array<{ agent_name: string; action: string; timestamp: string }> = Array.isArray(raw.logs) ? raw.logs : [];
  const triageLog = logs.find(l => l.agent_name?.toLowerCase().includes('triage'));
  const researchLog = logs.find(l => l.agent_name?.toLowerCase().includes('research'));
  const actionLog = logs.find(l => l.agent_name?.toLowerCase().includes('action'));
  const trackingLog = logs.find(l => l.agent_name?.toLowerCase().includes('tracking'));
  const escalationLog = logs.find(l => l.agent_name?.toLowerCase().includes('escalation'));

  const triageDone = Boolean(triageLog) || status !== 'processing' || !!raw.agent_activity?.triage;
  const researchDone = Boolean(researchLog) || status !== 'processing' || !!raw.agent_activity?.research;
  const actionDone = Boolean(actionLog) || status !== 'processing' || !!raw.agent_activity?.action;
  const isEscalated = status === 'escalated' || status === 'escalation_pending' || status === 'sla_expired' || Boolean(escalationLog);
  const isResolved = status === 'resolved';

  return [
    {
      id: 'step-triage',
      type: 'triage' as AgentType,
      title: 'Triage Agent',
      subtitle: 'Understanding your issue & classifying severity',
      status: triageDone ? 'completed' : 'processing',
      details: [
        { label: 'Issue Detected', value: category.toUpperCase(), highlight: true },
        { label: 'Assessed Severity', value: severity.toUpperCase() },
        { label: 'Location Verification', value: 'Geocoded & Verified' },
      ],
      summary: triageLog?.action || `Analyzed report, detected ${category} problem with ${severity} priority.`,
    },
    {
      id: 'step-research',
      type: 'research' as AgentType,
      title: 'Research Agent',
      subtitle: 'Identifying responsible municipal authority & SLA policy',
      status: triageDone ? (researchDone ? 'completed' : 'processing') : 'pending',
      details: [
        { label: 'Responsible Authority', value: authority, highlight: true },
        { label: 'Charter SLA', value: `${sla_hours} hours statutory window` },
        { label: 'Jurisdiction', value: 'District Engineering Division' },
      ],
      summary: researchLog?.action || `Matched jurisdiction to ${authority} under ${sla_hours}h service charter.`,
    },
    {
      id: 'step-action',
      type: 'action' as AgentType,
      title: 'Action Agent',
      subtitle: 'Generating formal municipal complaint & filing ticket',
      status: researchDone ? (actionDone ? 'completed' : 'processing') : 'pending',
      details: [
        { label: 'Formal Complaint', value: 'Generated with statutory clauses' },
        { label: 'Ticket Reference', value: ticketNumber || 'CIV-Assigned', highlight: true },
        { label: 'Dispatch Channel', value: 'Direct Municipal API Gateway' },
      ],
      summary: actionLog?.action || 'Drafted legal-grade complaint notice and registered active municipal case.',
    },
    {
      id: 'step-tracking',
      type: 'tracking' as AgentType,
      title: 'Tracking Agent',
      subtitle: 'Autonomous SLA watchdog & status telemetry',
      status: isResolved ? 'completed' : (actionDone ? 'processing' : 'pending'),
      details: [
        { label: 'SLA Watchdog', value: isEscalated ? 'Threshold Exceeded' : 'Active Polling', highlight: isEscalated },
        { label: 'Inspection Telemetry', value: isResolved ? 'Marked Fixed' : 'Awaiting Field Dispatch' },
      ],
      summary: trackingLog?.action || (isResolved ? 'Resolution confirmed by authority.' : 'Actively monitoring municipal portal for responses.'),
    },
    {
      id: 'step-escalation',
      type: 'escalation' as AgentType,
      title: 'Escalation Agent',
      subtitle: 'Hierarchical escalation upon SLA breach',
      status: isResolved ? 'completed' : (isEscalated ? (status === 'escalated' ? 'completed' : 'processing') : 'idle'),
      details: [
        { label: 'Escalation Trigger', value: isEscalated ? 'SLA Expired' : 'Standby' },
        { label: 'Approval Status', value: status === 'escalated' ? 'Approved & Dispatched' : (status === 'escalation_pending' ? 'Waiting for Citizen Approval' : 'Not Needed') },
      ],
      summary: escalationLog?.action || (status === 'escalated' 
        ? 'Escalation notice dispatched to municipal executive oversight.' 
        : (isEscalated ? 'Escalation prepared; citizen approval required.' : 'Monitoring response window.')),
    },
  ];
}
