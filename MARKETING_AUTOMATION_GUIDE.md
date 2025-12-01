# 🚀 Guida Rapida: Marketing Automation

## 📧 Come Testare le Email

### 1. Test Locale (Senza inviare email reali)
```bash
# Test sistema email
NODE_ENV=development npx tsx scripts/test-email.ts

# Test automazioni con database reale
npx tsx scripts/test-marketing.ts
```

### 2. Test con Email Reali (Resend configurato)
```bash
# 1. Configura le variabili d'ambiente
cp .env .env.local
echo "RESEND_API_KEY=re_your_key_here" >> .env.local
echo "EMAIL_FROM=PANICO <noreply@tuodominio.com>" >> .env.local

# 2. Esegui test con email vera
npx tsx scripts/birthday-notifications.ts
```

---

## 🎯 Come Eseguire le Automazioni

### Da Pannello Admin (Consigliato)
1. Login come ADMIN su https://event-iq-seven.vercel.app
2. Vai su `/dashboard/marketing`
3. Clicca su "Esegui Tutto" o seleziona una specifica automazione
4. Vedi i risultati in tempo reale

### Da Script Locale
```bash
# Notifiche compleanno
npx tsx scripts/birthday-notifications.ts

# Re-engagement clienti dormienti
npx tsx scripts/re-engagement.ts

# Promozione VIP automatica
npx tsx scripts/vip-automation.ts
```

### Via API
```bash
# Trigger tutte le automazioni
curl -X POST https://event-iq-seven.vercel.app/api/admin/trigger-marketing \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"type": "all"}'

# Trigger singola automazione
curl -X POST https://event-iq-seven.vercel.app/api/admin/trigger-marketing \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"type": "birthday"}'
```

---

## ⚙️ Setup Resend (Per Inviare Email Reali)

### Passo 1: Crea Account
1. Vai su https://resend.com
2. Sign up (gratuito per 100 email/giorno, 3000/mese)
3. Verifica la tua email

### Passo 2: Verifica Dominio
1. Dashboard Resend → Domains
2. Add Domain → Inserisci il tuo dominio (es. `panico.app`)
3. Aggiungi i DNS records al tuo provider:
   ```
   TXT _resend.panico.app → "resend-verification-code"
   MX panico.app → feedback-smtp.eu-west-1.amazonses.com
   ```
4. Attendi verifica (max 24h, di solito pochi minuti)

### Passo 3: Genera API Key
1. Dashboard Resend → API Keys
2. Create API Key
3. Copia la key (inizia con `re_`)

### Passo 4: Configura Vercel
1. Vai su Vercel Dashboard → Tuo progetto
2. Settings → Environment Variables
3. Aggiungi:
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxx
   EMAIL_FROM = PANICO <noreply@panico.app>
   ```
4. Redeploy il progetto

---

## 📅 Cron Jobs Automatici

### Schedule Attuale
| Automazione | Orario | Frequenza |
|-------------|--------|-----------|
| Metriche Clienti | 3:00 AM | Giornaliera |
| Marketing Automation | 9:00 AM | Giornaliera |

### Come Verificare i Cron su Vercel
1. Vercel Dashboard → Tuo progetto
2. Deployments → Seleziona ultimo deployment
3. Functions → Cerca `/api/cron/marketing-automation`
4. Logs → Vedi esecuzioni e risultati

### Come Disabilitare Temporaneamente
Commenta nel `vercel.json`:
```json
{
  "crons": [
    // {
    //   "path": "/api/cron/marketing-automation",
    //   "schedule": "0 9 * * *"
    // }
  ]
}
```

---

## 🎨 Template Email Disponibili

### 1. Birthday (`birthday`)
```typescript
sendBirthdayEmail(
  'email@example.com',
  'Nome Cliente',
  'BIRTHDAY2025-VIP123' // Opzionale, solo per VIP
)
```

### 2. VIP Promotion (`vip-promotion`)
```typescript
sendVIPPromotionEmail(
  'email@example.com',
  'Nome Cliente',
  [
    '🎫 Ingresso prioritario',
    '🍸 Cocktail omaggio',
    // Altri benefits
  ]
)
```

### 3. Re-engagement (`re-engagement`)
```typescript
sendReEngagementEmail(
  'email@example.com',
  'Nome Cliente',
  '🎁 Ingresso gratuito + cocktail',
  lastEventDate // Opzionale
)
```

### 4. Welcome (`welcome`)
```typescript
sendWelcomeEmail(
  'email@example.com',
  'Nome Cliente'
)
```

---

## 📊 Come Vedere le Statistiche

### Nel Pannello Admin
1. `/dashboard/marketing`
2. Dopo ogni esecuzione vedi:
   - Email inviate
   - Email fallite
   - Errori specifici

### Nei Log di Vercel
1. Vercel Dashboard → Logs
2. Filter: `[Marketing]` o `[Email]`
3. Vedi dettagli di ogni invio

### Con Resend Dashboard
1. Dashboard Resend → Emails
2. Vedi tutte le email inviate
3. Metriche: delivered, opened, clicked, bounced

---

## 🔧 Troubleshooting

### Email non inviate
```bash
# Verifica configurazione
echo $RESEND_API_KEY
echo $EMAIL_FROM

# Test connessione Resend
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "PANICO <noreply@tuodominio.com>",
    "to": "tua-email@test.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Clienti non ricevono email
1. Verifica dominio verificato su Resend
2. Controlla spam folder
3. Verifica email valida in database:
   ```sql
   SELECT email FROM guests WHERE email IS NOT NULL LIMIT 10;
   ```

### Cron non si esegue
1. Verifica `vercel.json` committed
2. Check Vercel Dashboard → Cron Jobs
3. Verifica `CRON_SECRET` nelle env vars
4. Logs: cerca errori 401 (auth failed)

---

## 💡 Best Practices

### Prima di Lanciare in Produzione
- [ ] Test con 5-10 email reali
- [ ] Verifica rendering su Gmail, Outlook, Apple Mail
- [ ] Controlla spam score (mail-tester.com)
- [ ] Configura DMARC/SPF/DKIM sul dominio
- [ ] Aggiungi link unsubscribe (required by law)

### Durante l'Uso
- ✅ Monitora bounce rate (keep < 5%)
- ✅ Non inviare più di 100 email/giorno inizialmente
- ✅ Rispetta CAN-SPAM Act e GDPR
- ✅ Pulisci email invalide dal database

### Crescita Graduale
1. **Settimana 1**: 50 email/giorno
2. **Settimana 2**: 100 email/giorno
3. **Settimana 3**: 200 email/giorno
4. **Mese 2**: Considera upgrade Resend

---

## 📞 Supporto

### Documentazione
- Resend Docs: https://resend.com/docs
- Script: `scripts/birthday-notifications.ts` (commenti dettagliati)
- Templates: `lib/email.ts` (funzione `renderEmailTemplate`)

### Log Files
- Vercel: Dashboard → Logs
- Locale: `console.log` output

---

**Ultima modifica**: 19/11/2025  
**Versione**: 1.0  
**Status**: ✅ Production Ready
