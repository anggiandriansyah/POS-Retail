import { NextRequest, NextResponse } from 'next/server';
import { createSnapTransaction } from '../../../../../lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, grossAmount, customerName, email, phone, itemDetails, finishUrl } = body;

    if (!orderId || !grossAmount || !customerName || !email) {
      return NextResponse.json(
        { error: 'Parameter orderId, grossAmount, customerName, dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await createSnapTransaction({
      orderId,
      grossAmount: Number(grossAmount),
      customerName,
      email,
      phone,
      finishUrl,
      itemDetails,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
