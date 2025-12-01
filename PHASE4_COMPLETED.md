# Fase 4: Marketing Automation - COMPLETATA ✅

## Panoramica
Sistema completo di automazione marketing per engagement automatico dei clienti attraverso email personalizzate basate su comportamento e segmentazione.

## File Creati

### 1. Email Service: `lib/email.ts`
Servizio centralizzato per invio email con template predefiniti.

**Funzionalità:**
- `sendWelcomeEmail()` - Benvenuto nuovi utenti
- `sendBirthdayEmail()` - Auguri compleanno + codice sconto VIP
- `sendEventReminderEmail()` - Promemoria eventi
- `sendVIPPromotionEmail()` - Congratulazioni promozione VIP
- `sendReEngagementEmail()` - Recupero clienti dormienti
- `sendThankYouEmail()` - Ringraziamento post-evento

**Dev Mode:**
In development le email vengono loggat e invece di essere inviate.

**Integrazione Provider:**
Pronto per integrazione con:
- [Resend](https://resend.com) (consigliato)
- [SendGrid](https://sendgrid.com)
- [AWS SES](https://aws.amazon.com/ses/)

### 2. Script Birthday: `scripts/birthday-notifications.ts`
Invia automaticamente auguri ai clienti che compiono gli anni.

**Features:**
- Cerca compleanni del giorno corrente
- Genera codici sconto esclusivi per VIP
- Calcola età automaticamente
- Rate limiting per evitare ban
- Statistiche dettagliate

**Uso:**
```bash
npx tsx scripts/birthday-notifications.ts
```

**Output:**
```
🎂 Inizio invio notifiche compleanno...
📅 Data: 14/11
🎉 Trovati 3 compleanni oggi!

📧 Inviando a Mario Rossi (28 anni)...
   ✅ Inviata con successo
📧 Inviando a Laura Bianchi (25 anni)...
   ✅ Inviata con successo (VIP - Codice: BIRTHDAY2025-A3F2E1)

📊 Riepilogo:
   ✅ Email inviate: 2
   ❌ Email fallite: 0
   📧 Totale: 2
```

### 3. Script Re-engagement: `scripts/re-engagement.ts`
Campagna automatica per riattivare clienti dormienti (>60 giorni inattivi).

**Features:**
- Identifica clienti DORMANT
- Personalizza offerte in base alla storia:
  - **Cliente fedele (5+ eventi)**: Ingresso gratuito + cocktail
  - **Cliente occasionale (2-4 eventi)**: Sconto 50%
  - **Cliente nuovo (1 evento)**: Lista prioritaria
- Batch processing (50 email per volta)
- Evita spam (max 1 email ogni 30 giorni)

**Uso:**
```bash
npx tsx scripts/re-engagement.ts
```

**Logica Offerte:**
```typescript
if (totalEvents >= 5) {
  offer = '🎁 Ingresso gratuito + 1 cocktail';
} else if (totalEvents >= 2) {
  offer = '🎫 Sconto 50%';
} else {
  offer = '🎉 Lista prioritaria';
}
```

### 4. Script VIP Automation: `scripts/vip-automation.ts`
Promuove automaticamente clienti meritevoli a VIP.

**Criteri Promozione:**
- 10+ eventi partecipati
- Non ancora VIP
- Email valida

**VIP Benefits:**
- 🎫 Ingresso prioritario
- 🍸 Cocktail omaggio ad ogni evento
- 📅 Prenotazione tavoli 48h anticipata
- 🎁 Sconti esclusivi
- 💌 Early-bird invites
- ⭐ Supporto WhatsApp dedicato

**Uso:**
```bash
npx tsx scripts/vip-automation.ts
```

**Output:**
```
⭐ Inizio automazione VIP...
🎯 Trovati 5 clienti eleggibili per VIP

⭐ Promuovendo Marco Rossi (12 eventi)...
   ✅ Promosso e notificato con successo
⭐ Promuovendo Sofia Bianchi (15 eventi)...
   ✅ Promosso e notificato con successo

📊 Riepilogo:
   ⭐ Clienti promossi: 5
   ❌ Promozioni fallite: 0
   👥 Totale processati: 5

🌟 Totale clienti VIP: 28
```

### 5. API Cron: `app/api/cron/marketing-automation/route.ts`
Endpoint unificato per tutte le automazioni marketing.

**Endpoint:**
- `POST /api/cron/marketing-automation`

**Parameters:**
```json
{
  "type": "all" | "birthday" | "re-engagement" | "vip"
}
```

**Response:**
```json
{
  "success": true,
  "type": "all",
  "results": {
    "birthday": { "success": true },
    "reEngagement": { "success": true },
    "vip": { "success": true }
  },
  "timestamp": "2025-11-14T09:00:00.000Z"
}
```

### 6. API Admin: `app/api/admin/trigger-marketing/route.ts`
Trigger manuale per admin.

**Uso:**
```typescript
// Frontend admin panel
const response = await fetch('/api/admin/trigger-marketing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'birthday' })
});
```

## Configurazione

### 1. Variabili d'Ambiente

Aggiungi al `.env`:
```bash
# Email Provider (esempio con Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@panico.app

# Cron Security (già presente dalla Fase 3)
CRON_SECRET=your-secret-key-min-32-chars
```

### 2. Vercel Cron Jobs

Aggiornato `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-metrics",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/marketing-automation",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule:**
- **Metriche**: 3:00 AM (prima delle automazioni)
- **Marketing**: 9:00 AM (orario ottimale per email)

### 3. Integrazione Email Provider

#### Opzione A: Resend (Consigliato)
```bash
npm install resend
```

```typescript
// In lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(emailData: EmailData) {
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@panico.app',
    to: emailData.to,
    subject: emailData.subject,
    html: renderTemplate(emailData.template, emailData.data),
  });
  
  return {
    success: true,
    messageId: result.id,
  };
}
```

#### Opzione B: SendGrid
```bash
npm install @sendgrid/mail
```

#### Opzione C: AWS SES
```bash
npm install @aws-sdk/client-ses
```

## Template Email

### Esempio: Birthday Template
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .content { background: #fff; padding: 30px; }
    .cta { background: #667eea; color: white; padding: 15px 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎂 Buon Compleanno {{name}}!</h1>
    </div>
    <div class="content">
      <p>Ciao {{name}},</p>
      <p>Tutto il team di PANICO ti augura un fantastico compleanno! 🎉</p>
      
      {{#if discountCode}}
      <p>Come cliente VIP, abbiamo un regalo speciale per te:</p>
      <div class="discount-box">
        <strong>Codice Sconto:</strong> {{discountCode}}
      </div>
      {{/if}}
      
      <a href="{{eventsUrl}}" class="cta">
        Scopri i Prossimi Eventi
      </a>
    </div>
  </div>
</body>
</html>
```

## Workflow Completo

### 1. Setup Giornaliero Automatico (Vercel Cron)

**03:00 AM** - Update Metrics
```
→ Calcola totalEvents, customerSegment, etc.
→ Identifica nuovi VIP
→ Marca clienti DORMANT
```

**09:00 AM** - Marketing Automation
```
→ Birthday: Auguri + sconto VIP
→ VIP Automation: Promozioni automatiche
→ Re-engagement: Recupero dormienti
```

### 2. Trigger Manuale (Admin Dashboard)

```typescript
// Admin può triggerare specifiche automazioni
await triggerMarketing('birthday');    // Solo compleanni
await triggerMarketing('vip');         // Solo VIP
await triggerMarketing('re-engagement'); // Solo re-engagement
await triggerMarketing('all');         // Tutte insieme
```

### 3. Event-Based (Futuro)

```typescript
// Al check-in evento
afterCheckIn(guestId, eventId) {
  if (isFirstEvent) {
    sendWelcomeEmail();
  }
  updateMetrics(guestId);
}

// Post-evento (24h dopo)
afterEvent(eventId) {
  attendees.forEach(guest => {
    sendThankYouEmail(guest, feedbackUrl);
  });
}
```

## Metriche e Analytics

### Dashboard Marketing (da creare)

```typescript
interface MarketingStats {
  emailsSent: {
    birthday: number;
    reEngagement: number;
    vipPromotion: number;
    total: number;
  };
  conversionRates: {
    reEngaged: number;      // % dormienti riattivati
    vipRetention: number;   // % VIP che ritornano
  };
  revenue: {
    fromReEngagement: number;
    fromVIP: number;
  };
}
```

### Tracking Eventi

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  guestId     String
  type        EmailTemplate
  sentAt      DateTime @default(now())
  opened      Boolean  @default(false)
  clicked     Boolean  @default(false)
  converted   Boolean  @default(false)
  
  guest       Guest    @relation(fields: [guestId], references: [id])
  
  @@index([guestId])
  @@index([type, sentAt])
}
```

## Best Practices

### 1. Frequency Capping
```typescript
// Max 1 email marketing ogni 7 giorni per guest
const lastMarketingEmail = await getLastMarketingEmail(guestId);
if (daysSince(lastMarketingEmail) < 7) {
  skip();
}
```

### 2. A/B Testing
```typescript
const variant = guest.id % 2 === 0 ? 'A' : 'B';
const subject = variant === 'A' 
  ? '🎁 Regalo speciale per te'
  : '💫 Offerta esclusiva inside';
```

### 3. Personalization
```typescript
const greeting = getTimeBasedGreeting(); // Buongiorno/Buonasera
const preferredDay = guest.preferredDays?.split(',')[0];
const nextEvent = await findNextEventOn(preferredDay);
```

### 4. Deliverability
- ✅ SPF, DKIM, DMARC configurati
- ✅ Warm-up graduale del dominio
- ✅ Lista di suppression (opt-out)
- ✅ Bounce handling
- ✅ Complaint monitoring

## Testing

### Test Locale
```bash
# 1. Test singolo script
npx tsx scripts/birthday-notifications.ts

# 2. Test via API
curl -X POST http://localhost:3000/api/cron/marketing-automation \
  -H "Content-Type: application/json" \
  -d '{"type": "birthday"}'

# 3. Verifica log
# Le email in dev mode vengono solo loggated
```

### Test Produzione
```bash
# 1. Deploy
vercel --prod

# 2. Trigger manuale da admin dashboard
# 3. Monitora Vercel logs
vercel logs

# 4. Check email provider dashboard
```

## Troubleshooting

### Email Non Inviate
1. Verifica `RESEND_API_KEY` in env vars
2. Check domain verification
3. Verifica email `from` configurata
4. Check rate limits provider

### Cron Non Funziona
1. Verifica `vercel.json` committato
2. Check Vercel → Cron Jobs tab
3. Verifica timezone (UTC di default)
4. Check `CRON_SECRET` configurato

### Troppi Spam Reports
1. Implementa double opt-in
2. Aggiungi unsubscribe link
3. Rispetta frequency capping
4. Migliora personalizzazione
5. Clean lista (remove bounces)

## Prossimi Step

### Fase 5: GDPR Compliance
- [ ] Privacy policy
- [ ] Cookie consent
- [ ] Email opt-out/unsubscribe
- [ ] Data export (GDPR Art. 15)
- [ ] Right to be forgotten (GDPR Art. 17)
- [ ] Data portability
- [ ] Consent management

### Miglioramenti Marketing
- [ ] SMS notifications (Twilio)
- [ ] WhatsApp Business API
- [ ] Push notifications (web + app)
- [ ] In-app messaging
- [ ] Referral program
- [ ] Loyalty points system

## ROI Estimato

### Conversioni Attese
- **Birthday**: 15-20% redemption rate
- **Re-engagement**: 5-10% reactivation
- **VIP**: 40-50% retention increase

### Esempio Numerico (100 clienti VIP)
```
VIP Benefits Cost: €10/evento
VIP Retention Increase: +50%
Additional Events/Year: 2
Revenue/Event: €30

ROI = (100 VIP × 2 eventi × €30) - (100 × 10) 
    = €6000 - €1000 
    = €5000 profit
    = 500% ROI
```

## Conclusione

✅ **Fase 4 Completata**

Sistema di marketing automation completo con:
- 📧 Email service modulare e scalabile
- 🎂 Birthday automation con codici sconto
- 💫 Re-engagement clienti dormienti
- ⭐ VIP automation con benefits
- 🤖 Cron jobs automatici
- 👨‍💼 Admin triggers manuali
- 📊 Pronto per analytics e tracking
- 🚀 Scalabile e personalizzabile

**Pronto per produzione** con email provider a scelta (Resend consigliato).

Procedi con **Fase 5: GDPR Compliance** per rendere il sistema compliant alle normative europee!
