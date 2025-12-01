# 📱 SISTEMA MESSAGGISTICA - TELEGRAM + WHATSAPP

Sistema unificato per notifiche via Telegram e WhatsApp (Meta API).

## ✅ STATO IMPLEMENTAZIONE

| Feature | Telegram | WhatsApp |
|---------|----------|----------|
| **Infrastruttura** | ✅ Completa | ✅ Preparata |
| **Invio messaggi** | ✅ Attivo | 🔄 Da attivare |
| **Invio media (QR, PDF)** | ✅ Attivo | 🔄 Da attivare |
| **Webhook** | ✅ Attivo | 🔄 Da configurare |
| **UI Collegamento** | ✅ Attivo | ✅ Preparata |
| **Costo** | ♾️ GRATIS | €0 (1k msg/mese) |

---

## 🤖 SETUP TELEGRAM BOT (5 minuti)

### **Step 1: Crea Bot con BotFather**

1. Apri Telegram e cerca `@BotFather`
2. Invia `/newbot`
3. Scegli nome: `PANICO Events Bot`
4. Scegli username: `panico_events_bot` (deve finire con _bot)
5. **Copia il BOT_TOKEN** ricevuto (es: `7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)

### **Step 2: Configura Environment Variables**

Aggiungi in `.env`:
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN="7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="panico_events_bot"
```

Aggiungi anche in **Vercel Environment Variables** (Dashboard):
```
TELEGRAM_BOT_TOKEN=7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=panico_events_bot
```

### **Step 3: Configura Webhook (Produzione)**

Dopo deploy su Vercel, configura webhook:

```bash
curl -X POST \
  "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.vercel.app/api/telegram/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Verifica webhook attivo:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### **Step 4: Test Locale (Sviluppo)**

Per testare in locale, usa **polling mode** invece di webhook.

Modifica temporaneamente `lib/messaging.ts`:
```typescript
// SOLO PER SVILUPPO LOCALE
telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: true, // ⚠️ CAMBIARE A false IN PRODUZIONE
});
```

Poi lancia il server:
```bash
npm run dev
```

Il bot risponderà automaticamente ai messaggi.

---

## 📲 SETUP WHATSAPP META API (Futuro - 45 minuti)

### **Prerequisiti**
- Account Facebook Business Manager
- Numero telefono dedicato (non può essere già su WhatsApp personale)
- Verifica business (1-2 giorni)

### **Step 1: Meta Business Setup**

1. Vai su [Meta Business Suite](https://business.facebook.com)
2. Crea App → Tipo: Business
3. Aggiungi prodotto: **WhatsApp**
4. Segui wizard configurazione

### **Step 2: Ottieni Credenziali**

Dopo setup:
- **ACCESS_TOKEN**: Settings → WhatsApp → Temporary Access Token
- **PHONE_NUMBER_ID**: WhatsApp → Getting Started → Phone Number ID

### **Step 3: Configura Environment**

Aggiungi in `.env`:
```bash
# WhatsApp Meta API
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
```

### **Step 4: Attiva Codice WhatsApp**

Decommentare in `lib/messaging.ts` la funzione `sendWhatsAppMessage()`:
```typescript
async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<MessageResult> {
  if (!WHATSAPP_ENABLED) {
    return {
      success: false,
      provider: 'whatsapp',
      error: 'WhatsApp non configurato',
    };
  }

  const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json();
    return {
      success: true,
      provider: 'whatsapp',
      messageId: data.messages[0].id,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'whatsapp',
      error: error.message,
    };
  }
}
```

---

## 🚀 UTILIZZO NEL CODICE

### **Invia Messaggio Semplice**

```typescript
import { sendMessage } from '@/lib/messaging';

// Auto-detect provider (Telegram se è chat ID numerico)
await sendMessage({
  to: guest.telegramChatId!, // '123456789'
  message: '🎉 Biglietto confermato!',
});

// Specifica provider esplicitamente
await sendMessage({
  to: guest.whatsappPhone!, // '+393401234567'
  message: '🎉 Biglietto confermato!',
  provider: 'whatsapp',
});
```

### **Invia QR Code Biglietto**

```typescript
import { sendPhoto } from '@/lib/messaging';
import QRCode from 'qrcode';

// Genera QR code
const qrCodeBuffer = await QRCode.toBuffer(ticket.qrData);

// Invia su Telegram
await sendPhoto({
  to: guest.telegramChatId!,
  media: qrCodeBuffer,
  caption: `🎟️ Biglietto: ${ticket.code}`,
});
```

### **Invia PDF Documento**

```typescript
import { sendDocument } from '@/lib/messaging';

await sendDocument({
  to: guest.telegramChatId!,
  media: pdfBuffer,
  filename: `biglietto_${ticket.code}.pdf`,
  caption: '📄 Biglietto allegato',
});
```

### **Usa Template Predefiniti**

```typescript
import { sendMessage, MessageTemplates } from '@/lib/messaging';

await sendMessage({
  to: guest.telegramChatId!,
  message: MessageTemplates.ticketConfirmed(
    event.title,
    formatDate(event.dateStart),
    ticket.code
  ),
});
```

---

## 🎨 INTEGRAZIONE UI

### **Pagina Guest/Cliente**

```typescript
import { MessagingConnect } from '@/components/messaging-connect';

export default function GuestProfilePage({ guest }) {
  return (
    <div>
      <h1>{guest.firstName} {guest.lastName}</h1>
      
      <MessagingConnect 
        guestId={guest.id}
        telegramChatId={guest.telegramChatId}
        whatsappPhone={guest.whatsappPhone}
      />
    </div>
  );
}
```

### **Solo Telegram**

```typescript
import { TelegramConnect } from '@/components/messaging-connect';

<TelegramConnect 
  guestId={guest.id}
  telegramChatId={guest.telegramChatId}
/>
```

---

## 🔧 COMANDI TELEGRAM BOT

| Comando | Funzione |
|---------|----------|
| `/start guest_XXXXX` | Collega account Telegram |
| `/help` | Mostra comandi disponibili |
| `/mybiglietti` | Lista biglietti attivi |

---

## 📊 MONITORING

### **Check Webhook Telegram**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### **Check Messaggi Ricevuti**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

### **Test Invio Messaggio**
```bash
curl -X POST "https://your-app.vercel.app/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": {"id": 123456789},
      "text": "/help"
    }
  }'
```

---

## 🎯 PROSSIMI PASSI

### **Telegram (Attivo Ora)** ✅
1. [x] Creare bot con @BotFather
2. [x] Configurare TELEGRAM_BOT_TOKEN
3. [x] Configurare webhook su Vercel
4. [x] Testare collegamento account
5. [x] Testare invio biglietto

### **WhatsApp (Quando Pronto)** 🔄
1. [ ] Creare account Meta Business
2. [ ] Configurare WhatsApp Business API
3. [ ] Ottenere ACCESS_TOKEN
4. [ ] Decommentare codice WhatsApp in `lib/messaging.ts`
5. [ ] Testare invio messaggi

---

## 💰 COSTI

### **Telegram**
- ✅ **GRATIS ILLIMITATO**
- Nessun costo per messaggio
- Nessun limite giornaliero/mensile

### **WhatsApp Meta API**
- ✅ **1,000 conversazioni GRATIS/mese**
- Conversazione servizio (conferme): GRATIS
- Conversazione marketing: ~€0.03-0.08 cad
- Dopo 1,000 conversazioni: pay-per-use

---

## 🆘 TROUBLESHOOTING

### **Telegram bot non risponde**

1. Verifica token corretto: `getMe` API
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```

2. Verifica webhook configurato
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

3. Check logs Vercel Dashboard

### **Guest non riceve messaggi**

1. Verifica `telegramChatId` salvato nel database
2. Check bot non bloccato dall'utente
3. Verifica logs in Vercel

### **Errore "Bot token is invalid"**

- Token copiato male (spazi, caratteri mancanti)
- Token revocato da @BotFather
- Genera nuovo token: `/token` in @BotFather

---

## 📚 RIFERIMENTI

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
