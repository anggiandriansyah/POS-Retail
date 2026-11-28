import { NextRequest, NextResponse } from 'next/server';
import { verifyCallbackSignature, getDuitkuCredentials, type DuitkuCallbackPayload } from '../../../../../lib/duitku';
import { sendSubscriptionApprovedEmail } from '../../../../../lib/email';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const payload: DuitkuCallbackPayload = {
      merchantCode: String(formData.get('merchantCode') || ''),
      amount: String(formData.get('amount') || ''),
      merchantOrderId: String(formData.get('merchantOrderId') || ''),
      signature: String(formData.get('signature') || ''),
      resultCode: String(formData.get('resultCode') || ''),
      reference: String(formData.get('reference') || ''),
      paymentCode: String(formData.get('paymentCode') || ''),
    };

    const { apiKey } = getDuitkuCredentials();
    const isValid = verifyCallbackSignature(payload, apiKey);

    if (!isValid) {
      console.warn('[Duitku Callback] Signature mismatch / Invalid callback source:', payload);
      return NextResponse.json({ error: 'Bad Signature' }, { status: 400 });
    }

    // Hanya proses jika resultCode == '00' (Success)
    if (payload.resultCode === '00') {
      console.log(`[Duitku Success] Order #${payload.merchantOrderId} sebesar Rp ${payload.amount} BERHASIL dibayar.`);

      // Update status langganan toko di Supabase jika credentials server tersedia
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('invoice_number', payload.merchantOrderId);

        // Kirim email notifikasi sukses via Resend
        // (ambil data owner jika ada)
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('owner_email, store_name, owner_name')
          .eq('invoice_number', payload.merchantOrderId)
          .maybeSingle();

        if (sub?.owner_email) {
          await sendSubscriptionApprovedEmail(
            sub.owner_email,
            sub.owner_name || 'Owner Toko',
            sub.store_name || 'Toko ALPHOS',
            payload.merchantOrderId
          );
        }
      }
    }

    // Wajib mengembalikan status 200 OK dengan teks "SUCCESS" untuk Duitku
    return new NextResponse('SUCCESS', { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Duitku Webhook Error]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
