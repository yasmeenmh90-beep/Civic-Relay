import { Ticket, FormalComplaint } from './ticket';
import { AgentStep } from './agent';

export type IssueStatus =
  | 'processing'
  | 'submitted'
  | 'waiting_for_authority'
  | 'in_progress'
  | 'sla_expired'
  | 'escalation_pending'
  | 'escalated'
  | 'resolved'
  | 'failed';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'emergency';

export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlights'
  | 'water'
  | 'drainage'
  | 'traffic'
  | 'parks'
  | 'other';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;
  city?: string;
}

export interface Issue {
  id: string;
  tracking_code?: string;
  user_id?: string;
  title?: string;
  description: string;
  category: IssueCategory | string;
  severity: SeverityLevel;
  status: IssueStatus;
  image_url?: string;
  audio_url?: string;
  location?: LocationData;
  latitude?: number;
  longitude?: number;
  address?: string;
  authority?: string;
  sla_hours?: number;
  expected_response_at?: string;
  ticket?: Ticket;
  ticket_id?: string;
  complaint?: FormalComplaint;
  agent_steps?: AgentStep[];
  agent_activity?: {
    triage?: { category?: string; severity?: string; location_verified?: boolean; summary?: string };
    research?: { authority?: string; sla_hours?: number; jurisdiction?: string; summary?: string };
    action?: { complaint_generated?: boolean; ticket_id?: string; summary?: string };
    tracking?: { current_status?: string; last_ping?: string; summary?: string };
    escalation?: { active?: boolean; status?: string; summary?: string };
  };
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

export interface CreateIssuePayload {
  description: string;
  image_url?: string;
  audio_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  category?: string;
  urgency?: string;
}

export interface IssueCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  category: string;
  severity: SeverityLevel;
  area_name: string;
  recent_issue_id?: string;
  status: IssueStatus;
  issues?: Partial<Issue>[];
}
