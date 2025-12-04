import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const { eventId } = await req.json();

    // Verifica evento exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        ticketPrice: true,
        coverUrl: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento non trovato' },
        { status: 404 }
      );
    }

    // Calcola prezzo (default 0 se gratuito)
    const ticketPrice = event.ticketPrice ?? 0;

    if (ticketPrice <= 0) {
      return NextResponse.json(
        { error: 'Questo evento non richiede pagamento' },
        { status: 400 }
      );
    }

    // Crea ticket PENDING in database
    const ticket = await prisma.ticket.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
        paid: false,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        code: `TEMP-${Date.now()}`, // Temporaneo, verrà aggiornato dopo il pagamento
        qrData: '', // Verrà generato dopo il pagamento
        price: ticketPrice,
        currency: 'EUR',
        type: 'PAID',
      },
    });

    // Crea Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: event.title,
              images: event.coverUrl ? [event.coverUrl] : [],
            },
            unit_amount: Math.round(ticketPrice * 100), // Stripe usa centesimi
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/tickets?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/eventi/${event.id}?cancelled=true`,
      metadata: {
        ticketId: ticket.id,
        eventId: event.id,
        userId: session.user.id,
      },
      customer_email: session.user.email || undefined,
    });

    // Aggiorna ticket con paymentIntentId
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { paymentIntentId: checkoutSession.id },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      ticketId: ticket.id,
    });
  } catch (error: any) {
    console.error('Errore creazione sessione Stripe:', error);
    return NextResponse.json(
      { error: 'Errore durante la creazione della sessione di pagamento' },
      { status: 500 }
    );
  }
}
