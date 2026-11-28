/**
 * ALPHOS Single-Device Session Security Enforcer (Sprint 8 Official Module)
 * PT AlphaGen Ecosystem
 *
 * Mencegah login ganda pada akun kasir/owner yang sama di perangkat berbeda,
 * serta menangani auto-logout sesi tidak aktif (Inactivity Timeout 30 menit).
 */

export interface SessionTokenPayload {
  userId: string;
  token: string;
  deviceId: string;
  deviceName?: string;
  issuedAt: number;
}

const SESSION_STORAGE_KEY = 'alphos_device_session_token';

// Pesan kesalahan resmi yang telah disetujui Product Owner (Mas Gege)
export const ERROR_CONCURRENT_LOGIN =
  'Akun sedang aktif digunakan di perangkat lain. Silakan keluar dari perangkat tersebut terlebih dahulu atau hubungi Owner.';

export const ERROR_SESSION_EXPIRED =
  'Sesi Anda telah berakhir. Silakan login kembali.';

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit

export function getLocalDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('alphos_device_unique_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('alphos_device_unique_id', deviceId);
  }
  return deviceId;
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Server';
  const ua = window.navigator.userAgent;
  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('iPhone')) os = 'iPhone (iOS)';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  return `${browser} on ${os}`;
}

export function registerLocalSession(userId: string): string {
  if (typeof window === 'undefined') return '';
  const token = 'tok_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  const payload: SessionTokenPayload = {
    userId,
    token,
    deviceId: getLocalDeviceId(),
    deviceName: getDeviceName(),
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

/**
 * Pemantau aktivitas diam (Idle Inactivity Tracker) 30 menit
 * Jika tidak ada klik/ketik/sentuh selama 30 menit, panggil onTimeout()
 */
export function setupInactivityTracker(onTimeout: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let timer: NodeJS.Timeout;

  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      onTimeout();
    }, INACTIVITY_TIMEOUT_MS);
  }

  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach((evt) => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });

  // Jalankan timer awal
  resetTimer();

  // Return cleanup function
  return () => {
    clearTimeout(timer);
    events.forEach((evt) => {
      window.removeEventListener(evt, resetTimer);
    });
  };
}
