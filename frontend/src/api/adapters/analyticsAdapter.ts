import {
  AnalyticsOverview,
  TrendDataPoint,
  AuthorityAnalytics,
  MapAnalyticsPoint,
  SensorPrediction,
  RecurrencePrediction,
} from '../../types/analytics';

export function normalizeAnalyticsOverview(raw: any): AnalyticsOverview {
  if (!raw) return {} as AnalyticsOverview;
  return {
    total_reports: Number(raw.total_issues ?? raw.total_reports ?? raw.total ?? 0),
    active_issues: Number(raw.open_issues ?? raw.active_issues ?? raw.active ?? 0),
    resolved_issues: Number(raw.resolved_issues ?? raw.resolved ?? 0),
    escalated_issues: Number(raw.escalated_issues ?? raw.escalated ?? 0),
    average_resolution_hours: Number(raw.avg_resolution_hours ?? raw.average_resolution_hours ?? raw.avg_resolution_time ?? 0),
    sla_compliance_rate: Number(raw.sla_compliance_rate ?? raw.sla_adherence ?? 0),
    escalation_resolution_rate: Number(raw.escalation_resolution_rate ?? 95),
  };
}

export function normalizeTrendPoint(item: any): TrendDataPoint {
  return {
    date: item.date || item.day || item.name || 'Day',
    reports: Number(item.count ?? item.reports ?? item.total ?? 0),
    resolved: Number(item.resolved ?? Math.round(Number(item.count ?? item.reports ?? 0) * 0.7)),
    escalated: Number(item.escalated ?? Math.round(Number(item.count ?? item.reports ?? 0) * 0.1)),
  };
}

export function normalizeAuthorityAnalytics(item: any, index: number): AuthorityAnalytics {
  return {
    id: String(item.id || item.authority_id || `auth-${index}`),
    authority_name: item.authority || item.authority_name || item.name || item.department || 'Municipal Dept',
    total_reports: Number(item.total ?? item.total_reports ?? 0),
    active_issues: Number(item.open ?? item.active_issues ?? item.active ?? 0),
    resolved_issues: Number(item.resolved ?? item.resolved_issues ?? 0),
    escalated_issues: Number(item.escalated ?? item.escalated_issues ?? 0),
    avg_response_hours: Number(item.avg_resolution_hours ?? item.avg_response_hours ?? item.average_response_time ?? 0),
    sla_adherence_percent: Number(item.sla_adherence_percent ?? item.sla_compliance ?? 92),
    category: item.category || 'Infrastructure Works',
  };
}

export function normalizeMapPoint(p: any, idx: number): MapAnalyticsPoint {
  return {
    id: String(p.id || idx),
    latitude: Number(p.latitude || p.lat || 37.7749),
    longitude: Number(p.longitude || p.lng || -122.4194),
    density: Number(p.density ?? 1),
    severity: p.severity || 'medium',
    category: p.category || 'General',
    hotspot_name: p.hotspot_name || p.zone || `${p.category || 'Civic'} Sector`,
    is_anomaly: Boolean(p.is_anomaly || p.source === 'iot_sensor'),
  };
}

export function normalizeSensorPrediction(s: any, idx: number): SensorPrediction {
  const days = typeof s.projected_days_to_threshold === 'number' ? s.projected_days_to_threshold.toFixed(1) : '3';
  return {
    id: String(s.id || s.sensor_id || `pred-s-${idx}`),
    zone: s.zone || (s.sensor_id ? `Sensor ${s.sensor_id}` : `Ward Area ${idx + 1}`),
    sensor_type: (s.sensor_type || s.type || 'Telemetry Monitor').replace(/_/g, ' '),
    anomaly_type: s.anomaly_type || `Projected Threshold Breach (${days} days)`,
    risk_level: (s.risk_level || (Number(days) <= 3 ? 'high' : 'medium')) as any,
    confidence_score: Number(s.confidence_score ?? 0.88),
    description: s.description || `Sensor trending ${s.trend_direction || 'upward'} at current value ${s.current_value ?? 0}. Evaluated from ${s.readings_analyzed || 6} historical readings.`,
    predicted_impact_date: s.predicted_impact_date || new Date(Date.now() + Number(days) * 86400000).toISOString(),
    suggested_action: s.suggested_action || 'Schedule preventive municipal inspection before critical threshold.',
  };
}

export function normalizeRecurrencePrediction(r: any, idx: number): RecurrencePrediction {
  const count = Number(r.occurrence_count ?? r.cluster_history_count ?? r.historical_cases ?? 2);
  return {
    id: String(r.id || `pred-r-${idx}`),
    issue_category: r.category || r.issue_category || 'Hazard',
    zone: r.zone || `Location (${Number(r.latitude || 37.77).toFixed(3)}, ${Number(r.longitude || -122.41).toFixed(3)})`,
    recurrence_probability: Number(r.recurrence_probability ?? Math.min(95, count * 22)),
    cluster_history_count: count,
    summary: r.risk_note || r.summary || `Repeated defects reported at this coordinate (${count} occurrences). Indicates recurring infrastructure vulnerability.`,
    recommended_preventive_measure: r.recommended_preventive_measure || 'Conduct sub-surface geotechnical assessment and structural overhaul.',
  };
}
