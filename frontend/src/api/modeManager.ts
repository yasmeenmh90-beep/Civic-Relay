import { API_BASE_URL, USE_MOCK_API } from './real/client';

export type AppMode = 'dynamic' | 'demo';

export interface SystemStatus {
  mode: AppMode;
  database: 'ok' | 'unreachable' | 'checking';
  has_api_key: boolean;
  provider?: string;
  is_backend_online: boolean;
  message: string;
}

let cachedMode: AppMode = USE_MOCK_API ? 'demo' : 'dynamic';
let cachedStatus: SystemStatus = {
  mode: cachedMode,
  database: 'checking',
  has_api_key: false,
  is_backend_online: false,
  message: 'Initializing CivicRelay connection...',
};

let probePromise: Promise<SystemStatus> | null = null;

export function hasFrontendApiKey(): boolean {
  return Boolean(
    import.meta.env.VITE_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_AWS_ACCESS_KEY_ID
  );
}

/**
 * Checks backend health and API key status to determine whether the app
 * should run as a Dynamic Application (real DB + API key) or use Demo Data.
 */
export async function probeSystemStatus(forceRefresh = false): Promise<SystemStatus> {
  if (USE_MOCK_API) {
    cachedMode = 'demo';
    cachedStatus = {
      mode: 'demo',
      database: 'unreachable',
      has_api_key: false,
      is_backend_online: false,
      message: 'Explicitly configured for mock data (VITE_USE_MOCK_API=true).',
    };
    return cachedStatus;
  }

  if (probePromise && !forceRefresh) {
    return probePromise;
  }

  probePromise = (async () => {
    const healthUrl = `${API_BASE_URL.replace(/\/$/, '')}/health`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const dbOk = data.database === 'ok';
        const apiKeyOk = Boolean(data.has_api_key || hasFrontendApiKey());

        // Connect to real backend when database is ok and either API key is present or mock API is not explicitly forced
        const isDynamic = dbOk && (apiKeyOk || !USE_MOCK_API);
        cachedMode = isDynamic ? 'dynamic' : 'demo';

        let message = 'Dynamic Application Active: Connected to backend, database, and agent pipeline.';
        if (!dbOk) {
          message = 'Operating in Demo Mode: Database unreachable.';
        } else if (!apiKeyOk && USE_MOCK_API) {
          message = 'Operating in Demo Mode: No API key detected.';
        }

        cachedStatus = {
          mode: cachedMode,
          database: dbOk ? 'ok' : 'unreachable',
          has_api_key: apiKeyOk,
          provider: data.provider || (hasFrontendApiKey() ? 'frontend' : 'none'),
          is_backend_online: true,
          message,
        };
      } else {
        cachedMode = 'demo';
        cachedStatus = {
          mode: 'demo',
          database: 'unreachable',
          has_api_key: hasFrontendApiKey(),
          is_backend_online: false,
          message: `Backend returned HTTP ${response.status}. Using demo data.`,
        };
      }
    } catch {
      // Backend not running / connection refused -> fallback to demo data
      cachedMode = 'demo';
      cachedStatus = {
        mode: 'demo',
        database: 'unreachable',
        has_api_key: hasFrontendApiKey(),
        is_backend_online: false,
        message: 'Backend server not reachable at ' + API_BASE_URL + '. Using demo data.',
      };
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('civicrelay:mode_changed', { detail: cachedStatus })
      );
    }

    return cachedStatus;
  })();

  return probePromise;
}

export function getIsDynamicMode(): boolean {
  return cachedMode === 'dynamic';
}

export function getCurrentSystemStatus(): SystemStatus {
  return cachedStatus;
}
