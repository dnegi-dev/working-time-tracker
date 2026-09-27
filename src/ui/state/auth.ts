const KEY = 'wtt:auth';

export function isLoggedIn(hash: string): boolean {
  try {
    return localStorage.getItem(KEY) === hash;
  } catch {
    return false;
  }
}

export function rememberLogin(hash: string): void {
  localStorage.setItem(KEY, hash);
}

export function logout(): void {
  localStorage.removeItem(KEY);
}
