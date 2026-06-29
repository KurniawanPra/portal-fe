// ─── API Client ───────────────────────────────────────────────────────────────
// Typed fetch wrapper with auto-auth and token refresh

import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export class ApiRequestError extends Error {
  details?: Array<{ field: string; message: string }>;
  constructor(message: string, details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiRequestError';
    this.details = details;
  }
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Uses Next.js rewrite proxy: /api/* → backend
const BASE = '/api';

// ─── Token Refresh ────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const json = await res.json();
      if (json.success) {
        saveTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${BASE}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Auto-attach content-type for JSON bodies
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  // Auto-attach auth token
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // If 401, try refresh token once
  if (res.status === 401) {
    if (token) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
        if (res.status !== 401) {
          // If retried request succeeds, handle it and return
          if (res.status === 204) {
            return { success: true, data: null as T };
          }
          const json = await res.json();
          if (!json.success) {
            const apiErr = json as ApiError;
            throw new ApiRequestError(apiErr.error || 'Request gagal', apiErr.details);
          }
          return json as ApiResponse<T>;
        }
      }
    }

    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  // 204 No Content (for DELETE)
  if (res.status === 204) {
    return { success: true, data: null as T };
  }

  let json: any;
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server returned status ${res.status}`);
    }
    json = await res.json();
  } catch (parseErr: any) {
    throw new Error(parseErr.message?.startsWith('Server returned') 
      ? `Terjadi kesalahan pada server (Status: ${res.status}).`
      : 'Gagal menghubungi server. Silakan coba beberapa saat lagi.'
    );
  }

  if (!json.success) {
    const apiErr = json as ApiError;
    throw new ApiRequestError(apiErr.error || 'Request gagal', apiErr.details);
  }

  return json as ApiResponse<T>;
}

// ─── Convenience Methods ──────────────────────────────────────────────────────
export const api = {
  get: <T = unknown>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T = unknown>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = unknown>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = unknown>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};
