import { NextRequest, NextResponse } from 'next/server';
import { createDuitkuInvoice } from '../../../../../lib/duitku';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, productDetails, customerName, email, paymentMethod } = body;

    if (!orderId || !amount || !customerName || !email) {
      return NextResponse.json({ error: 'Parameter orderId, amount, customerName, dan email wajib diisi.' }, { status: 400 });
    }

    const result = await createDuitkuInvoice({
      orderId,
      amount: Number(amount),
      productDetails: productDetails || 'Langganan ALPHOS POS',
      customerName,
      email,
      paymentMethod: paymentMethod || 'SP', // SP = QRIS Dinamis
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || result.statusMessage }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
