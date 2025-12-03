'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Euro, CheckCircle2, QrCode, Download } from 'lucide-react';
import Image from 'next/image';

interface Event {
  id: string;
  title: string;
  description: string | null;
  dateStart: string;
  dateEnd: string | null;
  coverUrl: string | null;
  minAge: number | null;
  dressCode: string | null;
  venue: {
    name: string;
    city: string | null;
  };
}

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id);
      loadEvent(id);
    });
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error('Evento non trovato');
      const data = await response.json();
      setEvent(data.event || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento evento');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setCreating(true);
      setError(null);

      const response = await fetch('/api/tickets/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId,
          userId: session?.user?.id,
          type: 'LIST',
          price: 0,
          currency: 'EUR',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore creazione ticket');
      }

      setTicket(data.data || data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore conferma prenotazione');
    } finally {
      setCreating(false);
    }
  };

  const downloadQR = () => {
    if (!ticket?.qrData) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${ticket.qrData}`;
    link.download = `ticket-${ticket.code}.png`;
    link.click();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-red-500">
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Torna indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ticket) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-500">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Prenotazione Confermata!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">{event?.title}</p>
              <p className="text-muted-foreground">
                {new Date(event?.dateStart || '').toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg border-2 border-dashed">
              <div className="flex flex-col items-center gap-4">
                <QrCode className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Il tuo Biglietto</p>
                {ticket.qrData && (
                  <Image
                    src={`data:image/png;base64,${ticket.qrData}`}
                    alt="QR Code Ticket"
                    width={250}
                    height={250}
                    className="rounded-lg"
                  />
                )}
                <Badge variant="outline" className="font-mono">
                  {ticket.code}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="text-center">
                Mostra questo QR code all'ingresso per effettuare il check-in
              </p>
              <p className="text-center">
                Il biglietto è stato inviato anche via email
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={downloadQR} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Scarica QR
              </Button>
              <Button onClick={() => router.push('/dashboard/tickets')} className="flex-1">
                Vai ai miei biglietti
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Conferma Prenotazione</h1>

      <Card>
        <CardHeader>
          {event?.coverUrl && (
            <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
              <Image
                src={event.coverUrl}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardTitle>{event?.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Details */}
          <div className="space-y-3">
            {event?.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(event?.dateStart || '').toLocaleString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {event?.venue && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.venue.name}
                  {event.venue.city && ` - ${event.venue.city}`}
                </span>
              </div>
            )}

            {event?.minAge && (
              <Badge variant="secondary">+{event.minAge} anni</Badge>
            )}

            {event?.dressCode && (
              <Badge variant="outline">Dress code: {event.dressCode}</Badge>
            )}
          </div>

          {/* Price */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Totale</span>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <Euro className="h-6 w-6" />
                <span>0,00</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Ingresso gratuito</p>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmBooking}
            disabled={creating}
            className="w-full"
            size="lg"
          >
            {creating ? 'Creazione in corso...' : 'Conferma Partecipazione'}
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
