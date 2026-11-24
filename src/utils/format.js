export const APP_VERSION = '1.2.0';

export const STORE_INFO = {
  name: 'Toko Retail Anda',
  address: 'Jl. Contoh No. 123, Indonesia',
  phone: '0812-3456-7890',
  footerNote: 'Terima kasih telah berbelanja! Barang yang sudah dibeli tidak dapat ditukar.',
};

export function formatRupiah(amount) {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString));
}

export function formatClockTime(isoString) {
  if (!isoString) return '--:--:--';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function generateInvoiceNumber() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randPart = Math.floor(100 + Math.random() * 900);
  return `INV-${datePart}-${timePart}-${randPart}`;
}
