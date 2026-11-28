import { NextRequest, NextResponse } from 'next/server';
import { sendSubscriptionApprovedEmail } from '../../../../lib/email';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { token, orderId } = await req.json();
    const targetToken = token || orderId;

    if (!targetToken) {
      return NextResponse.json({ error: 'Token/OrderId wajib diisi' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ambil data registrasi berdasarkan token/orderId
    const { data: reg, error } = await supabase
      .from('subscription_registrations')
      .select('email, full_name, store_name, status, verification_token')
      .eq('verification_token', targetToken)
      .maybeSingle();

    if (error || !reg) {
      return NextResponse.json({ error: 'Registrasi tidak ditemukan' }, { status: 404 });
    }

    // Update status menjadi APPROVED
    await supabase
      .from('subscription_registrations')
      .update({
        status: 'APPROVED',
        is_verified: true,
        verified_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('verification_token', targetToken);

    // Kirim email ucapan selamat & aktivasi via Resend
    const emailResult = await sendSubscriptionApprovedEmail(
      reg.email,
      reg.full_name || 'Owner Toko',
      reg.store_name || 'Toko ALPHOS',
      targetToken
    );

    return NextResponse.json({
      success: true,
      message: 'Status diaktivasi dan email konfirmasi berhasil dikirim via Resend',
      emailResult,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
