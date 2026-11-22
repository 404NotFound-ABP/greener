export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  role: 'admin' | 'user' | string;
}

const TOKEN_KEYS = ['token', 'accessToken', 'access_token'];
const USER_KEY = 'auth_user';

export function saveSession(accessToken: string, user?: AuthUser): void {
  for (const key of TOKEN_KEYS) {
    sessionStorage.setItem(key, accessToken);
    localStorage.setItem(key, accessToken);
  }
  if (user) {
    const userJson = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, userJson);
    localStorage.setItem(USER_KEY, userJson);
  }
}

export function getSessionToken(): string | null {
  for (const key of TOKEN_KEYS) {
    const sessionVal = sessionStorage.getItem(key);
    if (sessionVal) return sessionVal;
    const localVal = localStorage.getItem(key);
    if (localVal) return localVal;
  }
  return null;
}

export function getSessionUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getSessionToken());
}

export function isAdmin(): boolean {
  const user = getSessionUser();
  return user?.role === 'admin';
}

export function clearSession(): void {
  for (const key of TOKEN_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('greener:logout'));
}

export function handleSessionExpired(): void {
  clearSession();
  window.dispatchEvent(
    new CustomEvent('greener:session_expired', {
      detail: { message: 'Sua sessão expirou. Por favor, faça login novamente.' },
    })
  );
}
