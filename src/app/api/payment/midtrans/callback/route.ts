import { NextRequest, NextResponse } from 'next/server';
import { verifyMidtransSignature, getMidtransConfig, type MidtransNotificationPayload } from '../../../../../lib/midtrans';
import { sendSubscriptionApprovedEmail } from '../../../../../lib/email';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MidtransNotificationPayload;
    const { serverKey } = getMidtransConfig();

    const isValid = verifyMidtransSignature(payload, serverKey);
    if (!isValid) {
      console.warn('[Midtrans Webhook] Signature mismatch / Invalid callback:', payload);
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 403 });
    }

    const status = payload.transaction_status;
    const isPaid = status === 'settlement' || (status === 'capture' && payload.fraud_status === 'accept');

    console.log(`[Midtrans Webhook] Order #${payload.order_id} status: ${status} (Paid: ${isPaid})`);

    if (isPaid) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Update status pendaftaran langganan di Supabase
        await supabase
          .from('subscription_registrations')
          .update({
            status: 'APPROVED',
            is_verified: true,
            verified_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('verification_token', payload.order_id);

        // Ambil info toko & kirim invoice email via Resend
        const { data: sub } = await supabase
          .from('subscription_registrations')
          .select('email, store_name, full_name')
          .eq('verification_token', payload.order_id)
          .maybeSingle();

        if (sub?.email) {
          await sendSubscriptionApprovedEmail(
            sub.email,
            sub.full_name || 'Owner Toko',
            sub.store_name || 'Toko ALPHOS',
            payload.order_id
          );
        }
      }
    }

    return NextResponse.json({ status: 'OK', message: 'Notification handled successfully' }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Midtrans Callback Error]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
