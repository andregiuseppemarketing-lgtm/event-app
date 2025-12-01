# Setup Vercel - Event IQ

## Problema Attuale
La dashboard in produzione (https://event-iq-seven.vercel.app/dashboard) non mostra i dati completi.

## Causa Probabile
Le variabili d'ambiente non sono configurate correttamente su Vercel.

## Soluzione: Configurare Variabili d'Ambiente

### 1. Accedi a Vercel Dashboard
- Vai su https://vercel.com
- Seleziona il progetto "event-iq"
- Vai su Settings → Environment Variables

### 2. Aggiungi le Seguenti Variabili

**Database (OBBLIGATORIO)**
```
DATABASE_URL=postgresql://neondb_owner:npg_Gz0lriEMjf6H@ep-raspy-hall-agvms22w-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

POSTGRES_URL=postgresql://neondb_owner:npg_Gz0lriEMjf6H@ep-raspy-hall-agvms22w-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_Gz0lriEMjf6H@ep-raspy-hall-agvms22w-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_Gz0lriEMjf6H@ep-raspy-hall-agvms22w.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**NextAuth (OBBLIGATORIO)**
```
NEXTAUTH_URL=https://event-iq-seven.vercel.app
NEXTAUTH_SECRET=[GENERA UN SECRET CASUALE - vedi sotto]
```

Per generare `NEXTAUTH_SECRET`, esegui in terminale:
```bash
openssl rand -base64 32
```

**Email (OPZIONALE - per notifiche)**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tua-email@gmail.com
EMAIL_PASSWORD=[APP PASSWORD di Gmail]
EMAIL_FROM=noreply@panico.app
```

### 3. Applicare le Variabili

Dopo aver aggiunto le variabili:
1. Seleziona l'ambiente: **Production**, **Preview**, **Development** (consigliato: tutti e tre)
2. Clicca "Save"
3. **IMPORTANTE**: Rideploy l'applicazione
   - Vai su Deployments
   - Seleziona l'ultimo deployment
   - Clicca "... (more)" → "Redeploy"

### 4. Verifica

Dopo il redeploy (circa 2-3 minuti):
1. Vai su https://event-iq-seven.vercel.app/dashboard
2. Login con le tue credenziali
3. Verifica che "QR Emessi" mostri 90
4. Verifica che tutte le statistiche siano visibili

## Modifiche Recenti Applicate

### ✅ Fix Statistiche Dashboard
- Modificato `/app/api/stats/dashboard/route.ts`
- Ora include eventi futuri nel periodo corrente (prima escludeva eventi con data > oggi)

### ✅ Pulsanti "Indietro" Aggiunti
Tutte le pagine principali ora hanno il pulsante "Indietro":
- `/analytics/[eventId]` - Dashboard Analytics Evento
- `/analytics/general` - Dashboard Generale
- `/checkin` - Check-in QR
- `/lista` - Gestione Liste
- `/clienti` - Database Clienti
- `/biglietti` - Biglietti QR (già presente)
- `/marketing/funnel` - Funnel Marketing (già presente)

## Test in Locale

Per testare in locale prima del deploy:
```bash
npm run dev
```

Vai su http://localhost:3000/dashboard e verifica che:
- QR Emessi: 90
- Eventi Totali: 1
- Ingressi Totali: ~36

## Note Importanti

1. **Neon Database**: Il database è condiviso tra locale e produzione (stesso URL)
2. **Dati di Test**: I 90 ticket creati sono già nel database
3. **NEXTAUTH_URL**: Deve essere l'URL esatto di produzione
4. **NEXTAUTH_SECRET**: DEVE essere diverso tra locale e produzione

## Troubleshooting

### Problema: Dashboard vuota dopo deploy
**Soluzione**: Verifica che `DATABASE_URL` sia configurata correttamente

### Problema: "Unauthorized" o redirect continuo
**Soluzione**: Verifica `NEXTAUTH_URL` e `NEXTAUTH_SECRET`

### Problema: Statistiche a 0
**Soluzione**: Il fix è già applicato. Fai redeploy dopo aver configurato le env vars.

---

**Data modifica**: 18 Novembre 2025
**Modifiche applicate da**: GitHub Copilot
