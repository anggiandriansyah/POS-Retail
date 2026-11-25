export type PaperWidth = '58mm' | '80mm';

export interface EscPosItem {
  product_name: string;
  qty: number;
  price: number;
  subtotal: number;
  discount_amount?: number;
}

export interface EscPosReceiptInput {
  paperWidth?: PaperWidth;
  storeName?: string;
  invoiceNumber: string;
  items: EscPosItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  paymentMethod: string;
  footerNote?: string;
}

function formatIdr(value: number): string {
  const num = Math.round(Number(value) || 0);
  const abs = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return num < 0 ? `-Rp ${abs}` : `Rp ${abs}`;
}

function fitLine(left: string, right: string, width: number): string {
  const cleanLeft = left.replace(/[^\x20-\x7e]/g, '');
  const cleanRight = right.replace(/[^\x20-\x7e]/g, '');
  if (cleanLeft.length + cleanRight.length + 1 <= width) {
    const spaces = width - cleanLeft.length - cleanRight.length;
    return `${cleanLeft}${' '.repeat(spaces)}${cleanRight}`;
  }
  const maxLeft = Math.max(1, width - cleanRight.length - 1);
  return `${cleanLeft.slice(0, maxLeft)} ${cleanRight}`.slice(0, width);
}

function centerText(text: string, width: number): string {
  const clean = text.replace(/[^\x20-\x7e]/g, '').slice(0, width);
  const pad = Math.max(0, Math.floor((width - clean.length) / 2));
  return `${' '.repeat(pad)}${clean}`;
}

function pushAscii(bytes: number[], line: string, width: number) {
  const clean = line.replace(/[^\x20-\x7e]/g, '').slice(0, width);
  for (let i = 0; i < clean.length; i += 1) {
    bytes.push(clean.charCodeAt(i));
  }
  bytes.push(0x0a);
}

export function buildEscPosReceipt(input: EscPosReceiptInput): Uint8Array {
  const cols = input.paperWidth === '80mm' ? 48 : 32;
  const divider = '-'.repeat(cols);
  const bytes: number[] = [];

  // ESC @ (Initialize printer)
  bytes.push(0x1b, 0x40);

  pushAscii(bytes, centerText('ALPHOS', cols), cols);
  pushAscii(bytes, centerText('by AlphaGen', cols), cols);
  pushAscii(bytes, centerText(input.storeName || 'ALPHOS Store', cols), cols);
  pushAscii(bytes, divider, cols);
  pushAscii(bytes, fitLine('Invoice:', input.invoiceNumber, cols), cols);
  pushAscii(bytes, fitLine('Bayar:', input.paymentMethod.toUpperCase(), cols), cols);
  pushAscii(bytes, divider, cols);

  for (const item of input.items) {
    pushAscii(bytes, item.product_name, cols);
    pushAscii(
      bytes,
      fitLine(`  ${item.qty} x ${formatIdr(item.price)}`, formatIdr(item.subtotal), cols),
      cols
    );
  }

  pushAscii(bytes, divider, cols);
  if ((input.discountAmount ?? 0) > 0) {
    pushAscii(bytes, fitLine('Diskon:', `-${formatIdr(input.discountAmount ?? 0)}`, cols), cols);
  }
  if ((input.taxAmount ?? 0) > 0) {
    pushAscii(bytes, fitLine('PPN:', formatIdr(input.taxAmount ?? 0), cols), cols);
  }
  pushAscii(bytes, fitLine('TOTAL:', formatIdr(input.totalAmount), cols), cols);
  pushAscii(bytes, fitLine('Tunai:', formatIdr(input.cashReceived), cols), cols);
  pushAscii(bytes, fitLine('Kembali:', formatIdr(input.changeAmount), cols), cols);
  pushAscii(bytes, divider, cols);
  if (input.footerNote) {
    pushAscii(bytes, centerText(input.footerNote, cols), cols);
  }
  bytes.push(0x0a, 0x0a);

  // GS V 0 (Full cut)
  bytes.push(0x1d, 0x56, 0x00);

  return new Uint8Array(bytes);
}
