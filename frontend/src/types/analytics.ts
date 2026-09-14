export interface AnalyticsOverview {
  total_reports: number;
  active_issues: number;
  resolved_issues: number;
  escalated_issues: number;
  average_resolution_hours: number;
  sla_compliance_rate: number; // e.g. 92.4%
  escalation_resolution_rate: number;
}

export interface TrendDataPoint {
  date: string;
  reports: number;
  resolved: number;
  escalated: number;
}

export interface AuthorityAnalytics {
  id: string;
  authority_name: string;
  total_reports: number;
  active_issues: number;
  resolved_issues: number;
  escalated_issues: number;
  avg_response_hours: number;
  sla_adherence_percent: number;
  category: string;
}

export interface MapAnalyticsPoint {
  id: string;
  latitude: number;
  longitude: number;
  density: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'emergency';
  category: string;
  hotspot_name: string;
  is_anomaly?: boolean;
}

export interface SensorPrediction {
  id: string;
  zone: string;
  sensor_type: string;
  anomaly_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number; // 0-100%
  description: string;
  predicted_impact_date: string;
  suggested_action: string;
}

export interface RecurrencePrediction {
  id: string;
  issue_category: string;
  zone: string;
  recurrence_probability: number; // 0-100%
  cluster_history_count: number;
  summary: string;
  recommended_preventive_measure: string;
}
