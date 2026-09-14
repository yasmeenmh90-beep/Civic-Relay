export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const TOKEN_KEY = 'civicrelay_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// Development debug logger (Rule 10: Logs method, endpoint, status without leaking tokens/passwords)
function logDevRequest(method: string, endpoint: string, status?: number, error?: any) {
  if (import.meta.env.DEV) {
    if (error) {
      console.error(`[API ERROR] ${method} ${endpoint} (Status: ${status ?? 'Network Error'})`, {
        error: error.message || error,
        details: error.data || null,
      });
    } else {
      console.debug(`[API] ${method} ${endpoint} -> ${status}`);
    }
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;
  const method = (customConfig.method || 'GET').toUpperCase();

  let url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = getStoredToken();
  const isFormData = customConfig.body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
    });

    if (response.status === 401) {
      // Clear token on 401 unauthorized & notify auth state
      removeStoredToken();
      window.dispatchEvent(new CustomEvent('civicrelay:unauthorized'));
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : (Array.isArray(errorData.detail) ? errorData.detail.map((e: any) => e.msg || e).join(', ') : JSON.stringify(errorData.detail));
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Response is non-JSON
      }

      const apiErr = new ApiError(errorMessage, response.status, errorData);
      logDevRequest(method, endpoint, response.status, apiErr);
      throw apiErr;
    }

    logDevRequest(method, endpoint, response.status);

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const networkErr = new ApiError(
      (error as Error).message || 'Unable to connect to CivicRelay server.',
      0
    );
    logDevRequest(method, endpoint, 0, networkErr);
    throw networkErr;
  }
}
