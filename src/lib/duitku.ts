/**
 * Duitku Payment Gateway SDK Helper
 * PT AlphaGen Ecosystem • Sprint 8 Official Module
 *
 * Mendukung: Dynamic QRIS (SP), Virtual Account (BCA, Mandiri, BRI, BNI, Permata)
 * Dokumentasi Signature: MD5
 */

import crypto from 'crypto';

export interface CreateDuitkuInvoiceParams {
  orderId: string;
  amount: number;
  productDetails: string;
  customerName: string;
  email: string;
  phoneNumber?: string;
  paymentMethod?: string; // 'SP' untuk QRIS Dinamis (default), atau VA
  returnUrl?: string;
  callbackUrl?: string;
}

export interface DuitkuInvoiceResponse {
  success: boolean;
  paymentUrl?: string;
  qrCodeString?: string;
  reference?: string;
  vaNumber?: string;
  statusCode?: string;
  statusMessage?: string;
  error?: string;
}

export interface DuitkuCallbackPayload {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  signature: string;
  resultCode: string; // '00' = SUCCESS
  reference?: string;
  paymentCode?: string;
  additionalParam?: string;
}

const DUITKU_ENV = process.env.DUITKU_ENV || 'sandbox';
const DUITKU_INQUIRY_URL =
  DUITKU_ENV === 'production'
    ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
    : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

export function getDuitkuCredentials() {
  return {
    merchantCode: process.env.DUITKU_MERCHANT_CODE || 'D1234',
    apiKey: process.env.DUITKU_API_KEY || 'sandbox_alphos_duitku_key',
    env: DUITKU_ENV,
  };
}

/**
 * Generate MD5 Signature untuk Request Pembuatan Invoice
 * Rumus: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
export function generateRequestSignature(merchantCode: string, orderId: string, amount: number, apiKey: string): string {
  const raw = `${merchantCode}${orderId}${amount}${apiKey}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

/**
 * Validasi MD5 Signature dari Notifikasi Webhook / Callback Duitku
 * Rumus: MD5(merchantCode + amount + merchantOrderId + apiKey)
 */
export function verifyCallbackSignature(payload: DuitkuCallbackPayload, apiKey: string): boolean {
  const { merchantCode, amount, merchantOrderId, signature } = payload;
  const raw = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
  const calculated = crypto.createHash('md5').update(raw).digest('hex');
  return calculated.toLowerCase() === (signature || '').toLowerCase();
}

/**
 * Buat Transaksi / Invoice Pembayaran Duitku (QRIS / VA)
 */
export async function createDuitkuInvoice(params: CreateDuitkuInvoiceParams): Promise<DuitkuInvoiceResponse> {
  const { merchantCode, apiKey } = getDuitkuCredentials();
  const signature = generateRequestSignature(merchantCode, params.orderId, params.amount, apiKey);

  const defaultReturn = 'https://alphos-smartpos.vercel.app/verify-account?status=pending';
  const defaultCallback = 'https://alphos-smartpos.vercel.app/api/payment/duitku/callback';

  const body = {
    merchantCode,
    paymentAmount: params.amount,
    paymentMethod: params.paymentMethod || 'SP', // SP = QRIS Dinamis
    merchantOrderId: params.orderId,
    productDetails: params.productDetails,
    email: params.email,
    phoneNumber: params.phoneNumber || '081234567890',
    additionalParam: '',
    merchantUserInfo: params.customerName,
    customerVaName: params.customerName,
    callbackUrl: params.callbackUrl || process.env.DUITKU_CALLBACK_URL || defaultCallback,
    returnUrl: params.returnUrl || defaultReturn,
    signature,
    expiryPeriod: 1440, // 24 jam (dalam menit)
  };

  try {
    const res = await fetch(DUITKU_INQUIRY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || (data.statusCode && data.statusCode !== '00')) {
      return {
        success: false,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage || 'Gagal memproses transaksi Duitku',
        error: data.statusMessage || 'API Duitku menolak request',
      };
    }

    return {
      success: true,
      paymentUrl: data.paymentUrl,
      qrCodeString: data.qrString,
      reference: data.reference,
      vaNumber: data.vaNumber,
      statusCode: data.statusCode,
      statusMessage: data.statusMessage,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
    };
  }
}
