/*
 * ─── Penyimpanan token portal ─────────────────────────────────────────────────
 *
 * Aturan:
 *   • access token  → HANYA `sessionStorage` (mati begitu tab ditutup)
 *   • refresh token → HANYA cookie HttpOnly yang diset backend
 *     (`portal-app-be/src/utils/cookie.ts`; endpoint refresh menerima
 *      `body.refreshToken || cookie`, jadi body boleh kosong)
 *
 * Sebelumnya kedua token juga ditulis ke `localStorage`, sehingga satu XSS di
 * origin ini cukup untuk mencuri refresh token 7 hari yang tetap hidup setelah
 * tab ditutup. Nilai lama masih dibersihkan/di-migrasi di bawah supaya sesi yang
 * sedang berjalan tidak ikut terputus saat pembaruan ini dipasang.
 */
const ACCESS_TOKEN_KEY = 'inl_access_token';
const REFRESH_TOKEN_KEY = 'inl_refresh_token';

export function saveTokens(accessToken: string, _refreshToken?: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const fromSession = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (fromSession) return fromSession;

  const fromLocal = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (fromLocal) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, fromLocal);
    return fromLocal;
  }
  return null;
}

/**
 * Hanya untuk masa transisi: mengembalikan refresh token lama yang mungkin masih
 * tersimpan di browser, sekali pakai, lalu membuangnya. Setelah itu refresh
 * sepenuhnya mengandalkan cookie HttpOnly.
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const legacy =
    localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (legacy) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  return legacy;
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
