import { apiClient, setStoredToken } from './client';
import { User, LoginCredentials, SignupData, AuthResponse } from '../../types/auth';

/**
 * Authenticates user against POST /users/login and saves JWT token.
 * Never silently falls back to fake credentials on failure.
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const data = await apiClient<any>('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const token = data.access_token || data.token || (typeof data === 'string' ? data : '');
  if (token) {
    setStoredToken(token);
  }

  const user: User | undefined = data.user ? {
    id: String(data.user.id || data.user._id || 'usr-me'),
    name: data.user.name || data.user.full_name || 'User',
    email: data.user.email || credentials.email,
    role: (data.user.role || 'citizen').toLowerCase(),
    avatar_url: data.user.avatar_url,
    created_at: data.user.created_at,
  } : undefined;

  return {
    access_token: token,
    token_type: data.token_type || 'bearer',
    user,
  };
}

/**
 * Registers new user against POST /users.
 */
export async function signupUser(signupData: SignupData): Promise<any> {
  return await apiClient<any>('/users', {
    method: 'POST',
    body: JSON.stringify(signupData),
  });
}

/**
 * Fetches current authenticated user against GET /users/me.
 */
export async function getCurrentUser(): Promise<User> {
  const raw = await apiClient<any>('/users/me', {
    method: 'GET',
  });

  return {
    id: String(raw.id || raw.user_id || raw._id || 'usr-me'),
    name: raw.name || raw.full_name || raw.username || 'Citizen',
    email: raw.email || '',
    role: (raw.role || 'citizen').toLowerCase(),
    avatar_url: raw.avatar_url || raw.avatar,
    created_at: raw.created_at,
  };
}
