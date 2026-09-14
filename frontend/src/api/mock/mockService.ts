import { User, LoginCredentials, SignupData, AuthResponse } from '../../types/auth';
import { Issue, CreateIssuePayload, IssueCluster } from '../../types/issue';
import { SLAStatus, EscalationDraft } from '../../types/ticket';
import {
  AnalyticsOverview,
  TrendDataPoint,
  AuthorityAnalytics,
  MapAnalyticsPoint,
  SensorPrediction,
  RecurrencePrediction,
} from '../../types/analytics';
import { normalizeIssue } from '../adapters/issueAdapter';
import {
  MOCK_CITIZEN_USER,
  MOCK_STAFF_USER,
  MOCK_ISSUES,
  MOCK_CLUSTERS,
  MOCK_ANALYTICS_OVERVIEW,
  MOCK_ANALYTICS_TRENDS,
  MOCK_AUTHORITIES,
  MOCK_MAP_ANALYTICS_POINTS,
  MOCK_SENSOR_PREDICTIONS,
  MOCK_RECURRENCE_PREDICTIONS,
} from './mockData';

let mockIssuesState: Issue[] = [...MOCK_ISSUES];
let mockCurrentUser: User = MOCK_CITIZEN_USER;

const delay = (ms: number = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockService = {
  // --- Auth ---
  async loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(300);
    const isStaff =
      credentials.email.toLowerCase().includes('staff') ||
      credentials.email.toLowerCase().includes('citygov') ||
      credentials.email.toLowerCase().includes('director');
    const user: User = isStaff ? MOCK_STAFF_USER : { ...MOCK_CITIZEN_USER, email: credentials.email };
    mockCurrentUser = user;
    const fakeToken = `mock_jwt_token_${user.id}_${Date.now()}`;
    return {
      access_token: fakeToken,
      token_type: 'bearer',
      user,
    };
  },

  async signupUser(signupData: SignupData): Promise<any> {
    await delay(400);
    const newUser: User = {
      id: `usr-demo-${Date.now()}`,
      name: signupData.name,
      email: signupData.email,
      role: (signupData.role || 'citizen').toLowerCase() as any,
      created_at: new Date().toISOString(),
    };
    mockCurrentUser = newUser;
    return {
      message: 'Demo user registered successfully',
      user_id: newUser.id,
      user: newUser,
    };
  },

  async getCurrentUser(): Promise<User> {
    await delay(150);
    return mockCurrentUser;
  },

  // --- Issues ---
  async createIssue(payload: CreateIssuePayload): Promise<{ id: string; issue: Issue }> {
    await delay(500);
    const newId = `iss-${Date.now()}`;
    const newIssue: Issue = normalizeIssue({
      id: newId,
      description: payload.description,
      image_url: payload.image_url,
      audio_url: payload.audio_url,
      latitude: payload.latitude || 37.7749,
      longitude: payload.longitude || -122.4194,
      address: payload.address || 'Market Street & 4th, Civic Center',
      category: payload.category || 'pothole',
      severity: payload.urgency || 'high',
      status: 'processing',
      created_at: new Date().toISOString(),
    });
    mockIssuesState.unshift(newIssue);
    return { id: newId, issue: newIssue };
  },

  async getIssues(): Promise<Issue[]> {
    await delay(300);
    return [...mockIssuesState];
  },

  async getIssueById(id: string): Promise<Issue> {
    await delay(250);
    const match = mockIssuesState.find((i) => i.id === id || i.ticket_id === id || i.tracking_code === id);
    if (match) return match;
    return mockIssuesState[0] || MOCK_ISSUES[0];
  },

  async getIssueClusters(): Promise<IssueCluster[]> {
    await delay(300);
    return MOCK_CLUSTERS;
  },

  // --- Tickets ---
  async getSLAStatus(ticketId: string): Promise<SLAStatus> {
    await delay(200);
    const issue = mockIssuesState.find((i) => i.ticket_id === ticketId || i.id === ticketId);
    const isExpired = issue?.status === 'sla_expired' || issue?.status === 'escalated';
    return {
      ticket_id: ticketId,
      sla_hours: 48,
      total_seconds: 48 * 3600,
      remaining_seconds: isExpired ? 0 : 31 * 3600 + 42 * 60,
      elapsed_percentage: isExpired ? 100 : 34,
      is_expired: isExpired,
      deadline: isExpired
        ? new Date(Date.now() - 3600 * 1000).toISOString()
        : new Date(Date.now() + 31 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
      status: isExpired ? 'sla_expired' : 'in_progress',
      can_escalate: isExpired,
    };
  },

  async simulateSLAExpiry(ticketId: string): Promise<{ success: boolean; message: string; ticket_id: string }> {
    await delay(350);
    const issue = mockIssuesState.find((i) => i.ticket_id === ticketId || i.id === ticketId);
    if (issue) {
      issue.status = 'sla_expired';
    }
    return {
      success: true,
      message: `[DEMO MODE] SLA timer for ticket ${ticketId} forcefully expired.`,
      ticket_id: ticketId,
    };
  },

  async escalateTicket(ticketId: string): Promise<{ draft: EscalationDraft; can_approve: boolean }> {
    await delay(350);
    return {
      draft: {
        subject: `URGENT ESCALATION: SLA Overdue on Ticket #${ticketId}`,
        recipient: 'Director General of Municipal Infrastructure & Works',
        reason: 'Statutory SLA threshold exceeded by 24+ hours with zero recorded field dispatch.',
        body: `Citizen complaint ticket #${ticketId} has officially passed its legal resolution timeline under City Service Charter §4.2. CivicRelay AI is escalating this case to Department Executive Oversight for expedited action.`,
        days_overdue: 1,
        escalation_level: 2,
      },
      can_approve: true,
    };
  },

  async approveEscalation(ticketId: string, _notes?: string): Promise<{ success: boolean; status: string; message?: string }> {
    await delay(400);
    const issue = mockIssuesState.find((i) => i.ticket_id === ticketId || i.id === ticketId);
    if (issue) {
      issue.status = 'escalated';
    }
    return {
      success: true,
      status: 'escalated',
      message: 'Escalation officially approved and dispatched in demo mode.',
    };
  },

  async resolveTicket(ticketId: string, _notes?: string): Promise<{ success: boolean; status: string; message?: string }> {
    await delay(400);
    const issue = mockIssuesState.find((i) => i.ticket_id === ticketId || i.id === ticketId);
    if (issue) {
      issue.status = 'resolved';
    }
    return {
      success: true,
      status: 'resolved',
      message: 'Case resolved in demo mode.',
    };
  },

  // --- Uploads ---
  async uploadImage(file: File): Promise<{ image_url: string; analysis?: any }> {
    await delay(500);
    return {
      image_url: URL.createObjectURL(file),
      analysis: {
        category_detected: 'pothole',
        severity_assessment: 'high',
        labels: ['Road surface damage', 'Pothole', 'Asphalt crack'],
        confidence: 0.94,
      },
    };
  },

  async uploadAudio(_file: File | Blob): Promise<{ audio_url: string; transcript?: string }> {
    await delay(600);
    return {
      audio_url: 'mock_audio_blob',
      transcript: 'Severe road surface damage reported at the main traffic intersection.',
    };
  },

  // --- Analytics ---
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    await delay(200);
    return MOCK_ANALYTICS_OVERVIEW;
  },

  async getAnalyticsTrends(): Promise<TrendDataPoint[]> {
    await delay(200);
    return MOCK_ANALYTICS_TRENDS;
  },

  async getAnalyticsByAuthority(): Promise<AuthorityAnalytics[]> {
    await delay(200);
    return MOCK_AUTHORITIES;
  },

  async getAnalyticsMap(): Promise<MapAnalyticsPoint[]> {
    await delay(200);
    return MOCK_MAP_ANALYTICS_POINTS;
  },

  async getSensorPredictions(): Promise<SensorPrediction[]> {
    await delay(250);
    return MOCK_SENSOR_PREDICTIONS;
  },

  async getRecurrencePredictions(): Promise<RecurrencePrediction[]> {
    await delay(250);
    return MOCK_RECURRENCE_PREDICTIONS;
  },

  async checkHealth(): Promise<{ status: string; timestamp?: string }> {
    return { status: 'healthy (mock mode)', timestamp: new Date().toISOString() };
  },
};
