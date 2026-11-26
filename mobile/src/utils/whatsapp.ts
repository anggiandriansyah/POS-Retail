export const DEV_RECEIPT_BASE_URL =
  process.env.EXPO_PUBLIC_RECEIPT_BASE_URL ||
  'https://alphos-develop-anggiandriansyah.vercel.app';

export interface WhatsAppReceiptInput {
  storeName: string;
  invoiceNumber: string;
  totalAmount: number;
  footerNote?: string;
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppReceiptUrl(input: WhatsAppReceiptInput): string {
  const receiptUrl = `${DEV_RECEIPT_BASE_URL}/receipt/${encodeURIComponent(input.invoiceNumber)}`;
  const msg = [
    `*${input.storeName}*`,
    `Invoice: ${input.invoiceNumber}`,
    `Total: ${formatIdr(input.totalAmount)}`,
    input.footerNote || '',
    receiptUrl,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}
