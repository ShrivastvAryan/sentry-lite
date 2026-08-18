import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function setTokens(access: string, refresh: string) {
  // secure: true should be enabled once you're on HTTPS (e.g. in production)
  Cookies.set(ACCESS_TOKEN_KEY, access, { expires: 1, sameSite: 'lax' });
  Cookies.set(REFRESH_TOKEN_KEY, refresh, { expires: 7, sameSite: 'lax' });
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}