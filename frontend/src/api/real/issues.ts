import { apiClient } from './client';
import { Issue, CreateIssuePayload, IssueCluster } from '../../types/issue';
import { normalizeIssue, normalizeIssueCluster } from '../adapters/issueAdapter';

/**
 * Submits a new issue to POST /issues.
 * Never falls back to fake data on network or backend error.
 */
export async function createIssue(payload: CreateIssuePayload): Promise<{ id: string; issue: Issue }> {
  const backendPayload = {
    description: payload.description,
    latitude: payload.latitude,
    longitude: payload.longitude,
    image_url: payload.image_url,
    urgency_hint: payload.urgency || (payload as any).urgency_hint,
    language: (payload as any).language,
  };

  const raw = await apiClient<any>('/issues', {
    method: 'POST',
    body: JSON.stringify(backendPayload),
  });

  const issue = normalizeIssue(raw);
  const id = String(issue.id || raw.id || raw.issue_id || '');
  return { id, issue };
}

/**
 * Fetches issues list from GET /issues.
 */
export async function getIssues(): Promise<Issue[]> {
  const rawList = await apiClient<any>('/issues', {
    method: 'GET',
  });

  if (Array.isArray(rawList)) {
    return rawList.map(normalizeIssue);
  }
  if (rawList && Array.isArray((rawList as any).issues)) {
    return (rawList as any).issues.map(normalizeIssue);
  }
  return [];
}

/**
 * Fetches single issue details from GET /issues/{id}.
 */
export async function getIssueById(id: string): Promise<Issue> {
  const raw = await apiClient<any>(`/issues/${id}`, {
    method: 'GET',
  });

  return normalizeIssue(raw);
}

/**
 * Fetches issue clusters from GET /issues/clusters.
 */
export async function getIssueClusters(): Promise<IssueCluster[]> {
  const rawClusters = await apiClient<any>('/issues/clusters', {
    method: 'GET',
  });

  if (Array.isArray(rawClusters)) {
    return rawClusters.map(normalizeIssueCluster);
  }
  if (rawClusters && Array.isArray((rawClusters as any).clusters)) {
    return (rawClusters as any).clusters.map(normalizeIssueCluster);
  }
  return [];
}
