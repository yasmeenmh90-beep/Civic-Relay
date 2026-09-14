import { apiClient } from './client';
import {
  AnalyticsOverview,
  TrendDataPoint,
  AuthorityAnalytics,
  MapAnalyticsPoint,
  SensorPrediction,
  RecurrencePrediction,
} from '../../types/analytics';
import {
  normalizeAnalyticsOverview,
  normalizeTrendPoint,
  normalizeAuthorityAnalytics,
  normalizeMapPoint,
  normalizeSensorPrediction,
  normalizeRecurrencePrediction,
} from '../adapters/analyticsAdapter';

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const raw = await apiClient<any>('/analytics/overview', {
    method: 'GET',
  });
  return normalizeAnalyticsOverview(raw);
}

export async function getAnalyticsTrends(): Promise<TrendDataPoint[]> {
  const raw = await apiClient<any[]>('/analytics/trends', {
    method: 'GET',
  });
  if (Array.isArray(raw)) {
    return raw.map(normalizeTrendPoint);
  }
  return [];
}

export async function getAnalyticsByAuthority(): Promise<AuthorityAnalytics[]> {
  const raw = await apiClient<any[]>('/analytics/by-authority', {
    method: 'GET',
  });
  if (Array.isArray(raw)) {
    return raw.map(normalizeAuthorityAnalytics);
  }
  return [];
}

export async function getAnalyticsMap(): Promise<MapAnalyticsPoint[]> {
  const raw = await apiClient<any[]>('/analytics/map', {
    method: 'GET',
  });
  if (Array.isArray(raw)) {
    return raw.map(normalizeMapPoint);
  }
  return [];
}

export async function getSensorPredictions(): Promise<SensorPrediction[]> {
  const raw = await apiClient<any[]>('/analytics/predictions/sensors', {
    method: 'GET',
  });
  if (Array.isArray(raw)) {
    return raw.map(normalizeSensorPrediction);
  }
  return [];
}

export async function getRecurrencePredictions(): Promise<RecurrencePrediction[]> {
  const raw = await apiClient<any[]>('/analytics/predictions/recurrence', {
    method: 'GET',
  });
  if (Array.isArray(raw)) {
    return raw.map(normalizeRecurrencePrediction);
  }
  return [];
}
