// ─── Auth Token Management ────────────────────────────────────────────────────
// Manages JWT access/refresh tokens in localStorage

const ACCESS_TOKEN_KEY  = 'inl_access_token';
const REFRESH_TOKEN_KEY = 'inl_refresh_token';

export function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Set cookies (SameSite=Lax, path=/). Access token: 15 mins (900s), Refresh token: 7 days (604800s).
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=900; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  // Clear cookies by setting max-age to 0 and expires in the past
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
