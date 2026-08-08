/// <reference types="vite/client" />

/**
 * API Client for Policy-0
 * ============================================================
 * Centralized fetch wrapper with auth, error handling, and types.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:2009';

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
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal, isFormData } = options;

  const token = localStorage.getItem('accessToken');
  const apiKey = 'policy0-dev-key-change-in-production';

  const requestHeaders: Record<string, string> = {
    'x-api-key': apiKey,
    ...headers,
  };

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
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data?.code,
      data?.details
    );
  }

  return data as T;
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