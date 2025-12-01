# Fase 3: Automazione e Calcolo Metriche - COMPLETATA ✅

## Panoramica
Sistema di calcolo automatico delle metriche comportamentali dei clienti, con script schedulabili e API per trigger manuali.

## File Creati

### 1. Script CLI: `scripts/update-customer-metrics.ts`
Script eseguibile da linea di comando per calcolare tutte le metriche dei clienti.

**Funzionalità:**
- Calcola `totalEvents`: numero totale di eventi partecipati
- Aggiorna `lastEventDate`: data ultimo evento
- Determina `customerSegment`: NEW/OCCASIONAL/REGULAR/VIP/DORMANT
- Calcola `preferredDays`: giorni preferiti della settimana
- Determina `averageArrivalTime`: orario medio di arrivo
- Calcola `averageGroupSize`: dimensione media del gruppo

**Uso:**
```bash
npx tsx scripts/update-customer-metrics.ts
```

**Logica Segmentazione:**
- **NEW**: 0-1 eventi
- **OCCASIONAL**: 2-4 eventi
- **REGULAR**: 5-9 eventi  
- **VIP**: 10+ eventi
- **DORMANT**: Nessun evento negli ultimi 90 giorni

### 2. API Cron: `app/api/cron/update-metrics/route.ts`
Endpoint API per l'aggiornamento automatico schedulato.

**Features:**
- Autenticazione tramite `CRON_SECRET`
- Timeout di 5 minuti (`maxDuration: 300`)
- Ritorna statistiche dettagliate
- Gestione errori granulare

**Endpoint:**
- `POST /api/cron/update-metrics` - Aggiorna tutte le metriche
- `GET /api/cron/update-metrics` - Test (solo in development)

**Esempio risposta:**
```json
{
  "success": true,
  "data": {
    "totalGuests": 150,
    "updated": 148,
    "errors": 2,
    "segments": {
      "NEW": 45,
      "OCCASIONAL": 38,
      "REGULAR": 32,
      "VIP": 28,
      "DORMANT": 5
    },
    "timestamp": "2025-11-14T10:30:00.000Z"
  }
}
```

### 3. Configurazione Vercel: `vercel.json`
File di configurazione per cron job automatici su Vercel.

**Schedule:** Ogni giorno alle 3:00 AM
```json
{
  "crons": [{
    "path": "/api/cron/update-metrics",
    "schedule": "0 3 * * *"
  }]
}
```

### 4. API Admin: `app/api/admin/trigger-metrics/route.ts`
Endpoint per triggerare manualmente l'aggiornamento (solo admin).

**Uso:**
```typescript
// Da frontend admin panel
const response = await fetch('/api/admin/trigger-metrics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Sicurezza:**
- Richiede autenticazione
- Solo ruolo ADMIN

## Modifiche Schema Database

### Modello Guest
Aggiunta relazione `tickets`:
```prisma
model Guest {
  // ... campi esistenti
  tickets Ticket[]  // NUOVO
}
```

### Modello Ticket
Aggiunto campo `guestId` e relazione:
```prisma
model Ticket {
  // ... campi esistenti
  guestId String?   // NUOVO
  guest   Guest? @relation(fields: [guestId], references: [id])
  
  @@index([guestId])  // NUOVO indice
}
```

## Variabili d'Ambiente

Aggiungi al file `.env`:
```bash
# Cron Job Security
CRON_SECRET=your-secret-key-for-cron-jobs-min-32-chars
```

## Setup Completo

### 1. Configurazione Locale
```bash
# 1. Rigenera Prisma Client
npx prisma generate

# 2. Esegui script manualmente
npx tsx scripts/update-customer-metrics.ts

# 3. Oppure via API (development)
curl http://localhost:3000/api/cron/update-metrics
```

### 2. Deploy su Vercel
```bash
# 1. Aggiungi CRON_SECRET nelle environment variables Vercel
vercel env add CRON_SECRET

# 2. Deploy
vercel --prod

# 3. Vercel attiverà automaticamente il cron job
```

### 3. Trigger Manuale (Admin)
1. Login come ADMIN
2. Vai su `/admin` (da creare)
3. Click su "Aggiorna Metriche Clienti"
4. Lo script verrà eseguito immediatamente

## Metriche Calcolate

### 1. Total Events
Conta eventi unici da:
- `ListEntry` dove guest è in lista
- `Ticket` con almeno 1 check-in

### 2. Last Event Date
Data più recente tra:
- Eventi delle liste
- Eventi dei ticket

### 3. Customer Segment
Basato su:
- Numero di eventi totali
- Giorni dall'ultimo evento
- Logica: NEW → OCCASIONAL → REGULAR → VIP
- DORMANT se > 90 giorni inattivo

### 4. Preferred Days
Top 3 giorni con più check-in:
- Analizza tutti i check-in
- Raggruppa per giorno settimana
- Ordina per frequenza
- Formato: "venerdì, sabato, domenica"

### 5. Average Arrival Time
Media orari di check-in:
- Somma ore e minuti di tutti i check-in
- Calcola media
- Formato: "23:45"

### 6. Average Group Size
Media persone per gruppo:
- Da campo `groupSize` nei check-in
- Arrotondato all'intero
- Default: 1

## Performance

### Ottimizzazioni
- Query batch con `include` per ridurre N+1
- Update in transazione (considerare se molti guest)
- Indici su `customerSegment`, `guestId`
- Timeout di 5 minuti per grandi dataset

### Scalabilità
Per > 10.000 clienti, considera:
1. **Batch Processing**: Processare 1000 guest alla volta
2. **Queue System**: Bull/BullMQ per background jobs
3. **Incremental Updates**: Solo guest con nuovi eventi
4. **Caching**: Redis per metriche frequenti

## Monitoring

### Log Format
```
[Metrics] Inizio aggiornamento...
[Metrics] Trovati 150 clienti da processare
[Metrics] ✓ Processati 10/150 clienti...
[Metrics] ✓ Processati 20/150 clienti...
[Metrics] Aggiornamento completato
[Metrics] Distribuzione per segmento: {...}
```

### Error Tracking
- Errori individuali loggati ma non bloccanti
- Array `errors` nella risposta API
- Max 10 errori dettagliati ritornati

## Testing

### Test Manuale
```bash
# 1. Crea alcuni guest con eventi
npm run seed

# 2. Esegui script
npx tsx scripts/update-customer-metrics.ts

# 3. Verifica risultati
sqlite3 prisma/dev.db "SELECT firstName, totalEvents, customerSegment FROM guests;"
```

### Test API
```bash
# Development
curl -X POST http://localhost:3000/api/cron/update-metrics

# Con auth
curl -X POST http://localhost:3000/api/cron/update-metrics \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Prossimi Passi

### Fase 4: Marketing Automation
- [ ] Email automatiche per segmenti
- [ ] Birthday notifications
- [ ] Re-engagement per DORMANT
- [ ] VIP perks automation

### Fase 5: GDPR Compliance
- [ ] Privacy policy
- [ ] Cookie consent
- [ ] Data export
- [ ] Right to be forgotten

## Note Implementative

### Consideration 1: Data Consistency
Lo script ricalcola TUTTE le metriche ogni volta. Per incrementalità:
```typescript
// Solo guest con eventi recenti
const guests = await prisma.guest.findMany({
  where: {
    OR: [
      { lastEventDate: null },
      { lastEventDate: { gte: last7Days } }
    ]
  }
});
```

### Consideration 2: Race Conditions
Se un evento viene creato durante l'esecuzione dello script, potrebbe essere perso. Soluzioni:
1. Lock ottimistico con `version` field
2. Queue system
3. Accettare eventual consistency

### Consideration 3: Historical Data
Lo script non salva storico metriche. Per trend analysis:
1. Creare tabella `MetricsSnapshot`
2. Salvare snapshot giornalieri
3. Permettere analisi temporale

## Troubleshooting

### Script Timeout
Se > 5 minuti:
```typescript
// In route.ts aumenta maxDuration
export const maxDuration = 600; // 10 minuti
```

### Memoria Insufficiente
Se > 100k guests:
```typescript
// Processare in batch
const batchSize = 1000;
for (let i = 0; i < totalGuests; i += batchSize) {
  const batch = await prisma.guest.findMany({
    skip: i,
    take: batchSize,
    // ...
  });
  // Process batch
}
```

### Cron Non Funziona
1. Verifica `vercel.json` committed
2. Check Vercel Dashboard → Cron Jobs
3. Verifica `CRON_SECRET` in env vars
4. Check logs in Vercel

## Conclusione

✅ **Fase 3 Completata**

Sistema robusto e scalabile per il calcolo automatico delle metriche clienti, con:
- Script CLI per esecuzione manuale
- API endpoint per automazione
- Configurazione cron per Vercel
- Trigger admin per on-demand
- Logging e error handling
- Pronto per produzione

Ora puoi procedere con:
- **Fase 4**: Marketing Automation
- **Fase 5**: GDPR Compliance
