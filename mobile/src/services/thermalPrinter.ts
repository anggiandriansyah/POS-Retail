import { buildEscPosReceipt, type EscPosReceiptInput } from '../utils/escpos';

// ESC/POS Command bytes: ESC @ (0x1B 0x40) init, GS V (0x1D 0x56) paper cut
export const ESC_INIT = [0x1b, 0x40];
export const GS_CUT = [0x1d, 0x56];

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
  address: string;
  paired: boolean;
}

export async function discoverPrinters(): Promise<BluetoothPrinterDevice[]> {
  return [
    {
      id: 'bt-preview-58mm',
      name: 'ALPHOS Thermal 58mm (Preview Fallback)',
      address: '00:11:22:33:44:55',
      paired: false,
    },
  ];
}

export async function connectPrinter(device: BluetoothPrinterDevice): Promise<{ connected: boolean; device: BluetoothPrinterDevice }> {
  try {
    if (!device.paired) {
      throw new Error('Bluetooth printer not paired or permission denied');
    }
    return { connected: true, device };
  } catch {
    return { connected: false, device };
  }
}

export async function disconnectPrinter(_device?: BluetoothPrinterDevice): Promise<{ disconnected: boolean }> {
  try {
    return { disconnected: true };
  } catch {
    return { disconnected: false };
  }
}

export function renderThermalPreviewText(input: EscPosReceiptInput): string {
  const bytes = buildEscPosReceipt(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i];
    if (b === 0x0a) out += '\n';
    else if (b >= 0x20 && b <= 0x7e) out += String.fromCharCode(b);
  }
  return out.trim();
}

export async function printEscPosReceipt(
  input: EscPosReceiptInput,
  device?: BluetoothPrinterDevice | null
): Promise<{ mode: 'bluetooth' | 'preview_fallback'; bytes: Uint8Array; previewText: string }> {
  const bytes = buildEscPosReceipt(input);
  const previewText = renderThermalPreviewText(input);
  if (device && device.paired) {
    return { mode: 'bluetooth', bytes, previewText };
  }
  return { mode: 'preview_fallback', bytes, previewText };
}
