/**
 * ALPHOS Single-Device Session Security Enforcer (Hotfix v1.5.1 / Sprint 6 Foundation)
 * Mencegah login ganda pada akun kasir/owner yang sama di perangkat berbeda.
 */

export interface SessionTokenPayload {
  userId: string;
  token: string;
  deviceId: string;
  issuedAt: number;
}

const SESSION_STORAGE_KEY = 'alphos_device_session_token';

export function getLocalDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('alphos_device_unique_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('alphos_device_unique_id', deviceId);
  }
  return deviceId;
}

export function registerLocalSession(userId: string): string {
  if (typeof window === 'undefined') return '';
  const token = 'tok_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  const payload: SessionTokenPayload = {
    userId,
    token,
    deviceId: getLocalDeviceId(),
    issuedAt: Date.now(),
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  return token;
}

export function getActiveSession(): SessionTokenPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionTokenPayload;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
