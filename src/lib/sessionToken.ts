/**
 * Session token utilities for single-device enforcement
 */

export function generateSessionToken(): string {
  // Use crypto-safe randomness where available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const SESSION_TOKEN_KEY = 'kx_session_token';

export function getLocalSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setLocalSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearLocalSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}
