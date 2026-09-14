import { apiClient } from './client';

export async function checkHealth(): Promise<{ status: string; timestamp?: string }> {
  return await apiClient<{ status: string; timestamp?: string }>('/health', {
    method: 'GET',
  });
}
