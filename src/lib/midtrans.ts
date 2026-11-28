/**
 * Midtrans Payment Gateway Helper (Snap & Core API)
 * PT AlphaGen Ecosystem • Sprint 8 Official Module
 *
 * Mendukung: Snap QRIS Dinamis (GoPay, ShopeePay, DANA), Virtual Account (BCA, Mandiri, BNI, BRI, Permata)
 * Signature: SHA512(order_id + status_code + gross_amount + ServerKey)
 */

import crypto from 'crypto';

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  email: string;
  phone?: string;
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export interface SnapResponse {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  error?: string;
}

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string; // 'settlement' | 'capture' | 'pending' | 'deny' | 'cancel' | 'expire'
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_id?: string;
}

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_API_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

// Base64 decoded safe Sandbox fallback for DEV/Preview environments
const DEFAULT_SANDBOX_SERVER_KEY = Buffer.from('U0ItTWlkLXNlcnZlci1vSDBWbFlIellSbXRacU1DeW1VcmF2YTM=', 'base64').toString('utf-8');
const DEFAULT_SANDBOX_CLIENT_KEY = Buffer.from('U0ItTWlkLWNsaWVudC1leVRoYWItb2Q0cFBlRmNJ', 'base64').toString('utf-8');

export function getMidtransConfig() {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return {
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || (isProd ? '' : DEFAULT_SANDBOX_CLIENT_KEY),
    serverKey: process.env.MIDTRANS_SERVER_KEY || (isProd ? '' : DEFAULT_SANDBOX_SERVER_KEY),
    isProduction: isProd,
  };
}

/**
 * Validasi SHA512 Signature Notifikasi Midtrans
 * Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(payload: MidtransNotificationPayload, serverKey: string): boolean {
  const { order_id, status_code, gross_amount, signature_key } = payload;
  const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const hash = crypto.createHash('sha512').update(raw).digest('hex');
  return hash.toLowerCase() === (signature_key || '').toLowerCase();
}

/**
 * Buat Snap Token & Redirect URL untuk Pembayaran
 */
export async function createSnapTransaction(params: CreateSnapTransactionParams): Promise<SnapResponse> {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) {
    return { success: false, error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi.' };
  }

  const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.email,
      phone: params.phone || '081234567890',
    },
    item_details: params.itemDetails || [
      {
        id: params.orderId,
        price: Math.round(params.grossAmount),
        quantity: 1,
        name: 'Langganan ALPHOS POS',
      },
    ],
    callbacks: {
      finish: 'https://alphos-smartpos.vercel.app/verify-account?status=success',
    },
  };

  try {
    const res = await fetch(SNAP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || data.error_messages) {
      return {
        success: false,
        error: Array.isArray(data.error_messages) ? data.error_messages.join(', ') : 'Gagal membuat Snap token',
      };
    }

    return {
      success: true,
      token: data.token,
      redirectUrl: data.redirect_url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
