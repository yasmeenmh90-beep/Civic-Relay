export type AgentType = 'triage' | 'research' | 'action' | 'tracking' | 'escalation';

export type AgentStepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'idle';

export interface AgentActionSummary {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface AgentStep {
  id: string;
  type: AgentType;
  title: string;
  subtitle: string;
  status: AgentStepStatus;
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  details?: AgentActionSummary[];
  iconName?: string;
}

export interface AgentTimelineState {
  currentAgent: AgentType | null;
  overallStatus: 'processing' | 'ready' | 'escalated' | 'resolved' | 'failed';
  steps: AgentStep[];
}
