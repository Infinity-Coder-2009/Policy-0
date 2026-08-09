/// <reference types="vite/client" />

/**
 * API Client for Policy-0
 * ============================================================
 * Centralized fetch wrapper with auth, error handling, and types.
 * Supports both Clerk auth and legacy JWT auth.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://delightful-cooperation-production-a998.up.railway.app';

// Get API key from environment or use development key
const API_KEY = import.meta.env.VITE_POLICY0_API_KEY || 'policy0-dev-key-change-in-production';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  isFormData?: boolean;
  skipAuth?: boolean; // For public endpoints
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal, isFormData, skipAuth = false } = options;

  const token = skipAuth ? null : localStorage.getItem('accessToken');

  const requestHeaders: Record<string, string> = {
    'x-api-key': API_KEY,
    ...headers,
  };

  // Add Clerk session token if available (for user identification)
  const clerkSession = localStorage.getItem('__clerk_db_jwt');
  if (clerkSession) {
    requestHeaders['x-clerk-session'] = clerkSession;
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 401) {
      // Try to refresh token if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !skipAuth) {
        try {
          const refreshed = await refreshAccessToken(refreshToken);
          localStorage.setItem('accessToken', refreshed.accessToken);
          if (refreshed.refreshToken) {
            localStorage.setItem('refreshToken', refreshed.refreshToken);
          }
          // Retry the request with the new token
          return apiRequest<T>(path, { ...options, skipAuth: true });
        } catch (refreshError) {
          // Clear tokens and force re-auth
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    }

    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data?.code,
      data?.details
    );
  }

  return data as T;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const data = await apiRequest<{ success: boolean; accessToken: string; refreshToken: string }>(
      '/api/auth/refresh',
      { method: 'POST', body: { refreshToken }, skipAuth: true }
    );
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch (error) {
    throw new ApiError('Failed to refresh token', 401);
  }
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { signal }),

  post: <T>(path: string, body?: any, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'POST', body, signal }),

  put: <T>(path: string, body?: any, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'PUT', body, signal }),

  delete: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'DELETE', signal }),

  upload: <T>(path: string, formData: FormData, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'POST', body: formData, signal, isFormData: true }),
};