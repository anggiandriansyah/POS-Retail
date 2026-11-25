export const APP_VERSION = '1.4.0';

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
