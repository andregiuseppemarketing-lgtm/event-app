import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Gestisci evento checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const ticketId = session.metadata?.ticketId;

    if (!ticketId) {
      console.error('No ticketId in session metadata');
      return NextResponse.json({ received: true });
    }

    try {
      // Genera codice univoco e QR code
      const uniqueCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const qrDataPayload = JSON.stringify({
        ticketId,
        code: uniqueCode,
        eventId: session.metadata?.eventId,
      });

      const qrCodeBase64 = await QRCode.toDataURL(qrDataPayload, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Aggiorna ticket con stato PAID
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          paid: true,
          paymentStatus: 'PAID',
          status: 'PAID',
          code: uniqueCode,
          qrData: qrCodeBase64,
          receiptUrl: `https://dashboard.stripe.com/payments/${session.payment_intent}`,
          paymentIntentId: session.payment_intent as string ?? session.id,
        },
      });

      console.log(`✅ Ticket ${ticketId} marked as PAID with QR code generated`);
    } catch (error) {
      console.error('Error updating ticket:', error);
      return new NextResponse('Error processing payment', { status: 500 });
    }
  }

  // Gestisci evento payment_intent.payment_failed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Cerca ticket con questo paymentIntentId
    const ticket = await prisma.ticket.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (ticket) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        },
      });
      console.log(`❌ Ticket ${ticket.id} marked as FAILED`);
    }
  }

  return NextResponse.json({ received: true });
}
