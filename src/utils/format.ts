export const APP_VERSION = '1.6.0';

export const STORE_INFO = {
  name: 'ALPHOS Store',
  address: 'AlphaGen Retail Center',
  phone: '-',
  footerNote: 'Terima kasih telah berbelanja bersama ALPHOS by AlphaGen.',
} as const;

export function formatRupiah(amount: number | string | null | undefined): string {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDateTime(
  isoString: string | null | undefined,
  lang: 'id' | 'en' = 'id'
): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatClockTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--:--';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randPart = Math.floor(100 + Math.random() * 900);
  return `INV-${datePart}-${timePart}-${randPart}`;
}

export function formatErrorMessage(err: unknown): string {
  if (!err) return 'Terjadi kendala pada sistem.';
  if (typeof err === 'string') return err.trim() || 'Terjadi kendala pada sistem.';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
    if (typeof obj.error_description === 'string' && obj.error_description.trim()) return obj.error_description.trim();
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
    if (typeof obj.details === 'string' && obj.details.trim()) return obj.details.trim();
    if (typeof obj.hint === 'string' && obj.hint.trim()) return obj.hint.trim();
  }
  return 'Terjadi kendala pada sistem.';
}
