# ✅ FASE 1 COMPLETATA - Estensione Database

## 🎯 Modifiche Applicate

### 1. Nuovi Enum
- ✅ `BookingMethod` - Traccia metodo prenotazione (Instagram, WhatsApp, Website, App, Phone, Manual)
- ✅ `CustomerSegment` - Segmentazione clienti (New, Occasional, Regular, VIP, Dormant)

### 2. Model Guest - ESTESO ⭐
**Nuovi campi anagrafici:**
- `nickname` - Soprannome usato nei locali
- `birthDate` - Data di nascita (per birthday club e statistiche età)
- `city` - Città di provenienza
- `occupation` - Occupazione (facoltativo)
- `instagram` - Handle Instagram (fondamentale per remarketing)

**Campi comportamentali (auto-calcolati):**
- `totalEvents` - Numero eventi partecipati (default: 0)
- `lastEventDate` - Data ultimo evento
- `customerSegment` - Segmento cliente (NEW/OCCASIONAL/REGULAR/VIP/DORMANT)
- `preferredDays` - JSON giorni preferiti ["FRI", "SAT"]
- `averageArrivalTime` - Fascia oraria media (early/medium/late)
- `prefersTable` - Preferisce tavolo vs ingresso normale
- `averageGroupSize` - Numero medio persone portate

### 3. Model ListEntry - ESTESO
- `bookingMethod` - Come ha prenotato (INSTAGRAM/WHATSAPP/WEBSITE/APP/PHONE/MANUAL)
- `referralSource` - Dettaglio fonte (es: "instagram_dm", "whatsapp_pr_mario")
- `groupSize` - Numero persone nel gruppo

### 4. Model CheckIn - ESTESO
- `arrivalTime` - Fascia arrivo calcolata (early/medium/late)
- `groupSize` - Numero accompagnatori

### 5. NUOVI MODELLI 🆕

#### `Consumption` - Tracking Spesa
Traccia consumazioni e spesa durante l'evento:
- Collegato a `Ticket` e `Event`
- `amount` - Importo speso
- `category` - drink/bottle/table/food/other
- `items` - JSON dettaglio ordine

**Utilità:** Analytics spesa, identificazione VIP spender, upselling, LTV cliente

#### `FunnelTracking` - Analytics Marketing
Traccia percorso utente dal click alla conversione:
- `sessionId` - Identifica sessione unica
- `step` - view/click/form_start/form_complete/ticket_issued
- `metadata` - Dati campagna (source, utm, ecc.)

**Utilità:** Ottimizzazione funnel, A/B testing, identificazione abbandoni

#### `EventFeedback` - Feedback Post-Evento
Raccolta feedback dopo l'evento:
- Rating complessivo (1-5 stelle)
- Rating specifici: musica, servizio, venue
- Commento testuale
- `wouldReturn` - Tornerebbe?
- `interests` - Eventi futuri di interesse (JSON)

**Utilità:** Miglioramento eventi, identificazione problemi, remarketing

#### `SecurityNote` - Sicurezza e Blacklist
Segnalazioni sicurezza e comportamenti problematici:
- `severity` - info/warning/danger/blacklist
- `type` - behavior/sobriety/violence/fraud/other
- `description` - Dettaglio segnalazione
- `actionTaken` - Azione intrapresa

**Utilità:** Sicurezza locale, blacklist condivisa, prevenzione problemi

#### `CustomerPreferences` - Preferenze e Scoring
Profilazione avanzata cliente:
- `musicGenres` - Generi musicali preferiti (JSON)
- `dressStyle` - Stile abbigliamento
- `drinkPreferences` - Bevande preferite (JSON)
- `avgSpending` - Media spesa per evento
- `responseToPromo` - Risposta a promozioni (high/medium/low)
- `socialEngagement` - Engagement social (high/medium/low)
- `conversionScore` - Score conversione 0-100
- `lifetimeValue` - Valore totale generato

**Utilità:** Segmentazione avanzata, targeting campagne, pricing dinamico

---

## 📊 Database Stats

**Prima:**
- 12 modelli
- ~50 campi totali

**Dopo:**
- 17 modelli (+5)
- ~120 campi totali (+70)
- 3 nuovi enum

---

## 🚀 PROSSIMI STEP - FASE 2

### A. Aggiornare Form Registrazione
**File:** `app/auth/register/page.tsx`

Aggiungere campi:
- Data di nascita (con validazione età minima)
- Città (dropdown o autocomplete)
- Instagram handle (opzionale ma incentivato)
- Checkbox: "Come ci hai conosciuto?" → bookingMethod

### B. Creare API Endpoints

#### 1. `/api/guests` - CRUD Clienti
```typescript
GET    /api/guests              // Lista clienti con filtri
GET    /api/guests/[id]         // Dettaglio singolo cliente
POST   /api/guests              // Crea nuovo cliente
PATCH  /api/guests/[id]         // Aggiorna cliente
DELETE /api/guests/[id]         // Elimina cliente (soft delete)
GET    /api/guests/[id]/stats   // Statistiche cliente
```

#### 2. `/api/feedback` - Gestione Feedback
```typescript
POST   /api/feedback            // Invia feedback post-evento
GET    /api/feedback/event/[id] // Feedback per evento specifico
```

#### 3. `/api/security` - Note Sicurezza
```typescript
POST   /api/security/report     // Crea segnalazione
GET    /api/security/blacklist  // Lista blacklist
GET    /api/security/guest/[id] // Storico segnalazioni cliente
```

#### 4. `/api/analytics/funnel` - Funnel Tracking
```typescript
POST   /api/analytics/funnel    // Traccia step funnel
GET    /api/analytics/funnel/[eventId] // Analytics funnel evento
```

### C. Dashboard Clienti - `/clienti`

**Componenti da creare:**
- `ClientiPage` - Lista clienti con tabella
- `ClientiFilters` - Filtri avanzati (segmento, città, ultima presenza)
- `ClienteDetailModal` - Dettaglio cliente con storico
- `ClienteStats` - Card statistiche cliente
- `ExportButton` - Export CSV per campagne

**Features:**
- ✅ Ricerca per nome/email/telefono/Instagram
- ✅ Filtri: segmento, città, ultima presenza, età, genere
- ✅ Ordinamento: per spesa, per frequenza, per ultima presenza
- ✅ Export CSV selettivo
- ✅ Azioni bulk: invia email/SMS, aggiungi a campagna

### D. Analytics Cliente Singolo - `/clienti/[id]`

**Sezioni:**
- 📊 **Overview**: Stats principali (eventi, spesa totale, ultima presenza)
- 📅 **Timeline**: Storico eventi partecipati
- 💰 **Spesa**: Grafico spesa nel tempo
- 🎵 **Preferenze**: Generi musicali, giorni preferiti, orari
- ⭐ **Feedback**: Tutti i feedback lasciati
- 🔔 **Segnalazioni**: Eventuali security notes
- 📈 **Score**: Conversion score, LTV, segmento

### E. Automazione Calcolo Metriche

**Script:** `scripts/update-customer-metrics.ts`

Calcola automaticamente (eseguire ogni notte):
- `totalEvents` - conta check-in per guest
- `lastEventDate` - max(checkin.scannedAt)
- `customerSegment` - calcola in base a frequenza:
  - NEW: 1 evento, < 30 giorni fa
  - OCCASIONAL: 2-5 eventi, ultimo < 60 giorni
  - REGULAR: 6+ eventi, ultimo < 30 giorni
  - VIP: 10+ eventi, spesa media alta
  - DORMANT: ultimo evento > 60 giorni fa
- `preferredDays` - giorni con più presenze
- `averageArrivalTime` - media orari check-in
- `averageGroupSize` - media groupSize check-in
- `avgSpending` (CustomerPreferences) - media consumptions
- `lifetimeValue` - somma consumptions

---

## 🎨 UI/UX Considerations

### Form Registrazione
- Data di nascita con date picker
- Instagram: placeholder "@username" con validazione
- Città: autocomplete con città italiane principali
- "Come ci hai conosciuto?": dropdown user-friendly
  - "Instagram" → INSTAGRAM
  - "WhatsApp" → WHATSAPP
  - "Sito web" → WEBSITE
  - "App" → APP
  - "Chiamata telefonica" → PHONE
  - "Al locale" → MANUAL

### Dashboard Clienti
- Card segmenti con contatori:
  - 🆕 Nuovi (ultimo mese)
  - 👥 Abituali
  - 💎 VIP
  - 😴 Dormienti (da riattivare)
- Tabella con colonne:
  - Nome | Instagram | Città | Ultimo Evento | Totale Eventi | Spesa Tot | Segmento | Azioni
- Quick actions: 📧 Email | 💬 WhatsApp | 🚫 Blacklist | 📊 Stats

### Dettaglio Cliente
- Header con foto profilo Instagram (se disponibile)
- Badge segmento con colore
- KPI cards: Eventi | Spesa Totale | Media Spesa | Ultimo Evento
- Tab navigation: Timeline | Spesa | Preferenze | Feedback | Sicurezza

---

## 🔐 GDPR Compliance TODO

Prima di raccogliere questi dati:
- [ ] Creare Privacy Policy completa
- [ ] Aggiungere checkbox consenso in registrazione
- [ ] Implementare cookie banner
- [ ] Creare pagina "I tuoi dati" per utenti
- [ ] Implementare "Esporta dati" (GDPR)
- [ ] Implementare "Cancella account"
- [ ] Log audit per accesso dati sensibili
- [ ] Encryption campi sensibili (telefono, email)

---

## 📝 Note Tecniche

### Performance
- Aggiunto index su `customerSegment`, `instagram`, `bookingMethod`
- Query aggregate potranno essere pesanti → considerare cache Redis
- Script notturno per metriche → eseguire in background

### Data Quality
- Validazione Instagram handle: `/^@?[a-zA-Z0-9._]{1,30}$/`
- Data nascita: età minima 16/18 anni (configurabile)
- Telefono: formato internazionale validato
- Email: validazione standard + verifica dominio

### Backward Compatibility
- Tutti i nuovi campi sono opzionali (nullable o con default)
- Database esistente non richiede migrazione dati
- Guest esistenti avranno campi nuovi a `null`

---

## ✅ Checklist Implementazione FASE 2

### Backend APIs
- [ ] GET /api/guests (con filtri e paginazione)
- [ ] GET /api/guests/[id]
- [ ] POST /api/guests
- [ ] PATCH /api/guests/[id]
- [ ] GET /api/guests/[id]/stats
- [ ] POST /api/feedback
- [ ] POST /api/security/report
- [ ] GET /api/security/blacklist
- [ ] POST /api/analytics/funnel

### Frontend Pages
- [ ] /clienti - Dashboard clienti
- [ ] /clienti/[id] - Dettaglio cliente
- [ ] /sicurezza/blacklist - Gestione blacklist
- [ ] /analytics/funnel - Funnel analytics

### Components
- [ ] ClientiTable (con sorting, filtri, pagination)
- [ ] ClienteCard
- [ ] SegmentBadge
- [ ] FeedbackForm
- [ ] SecurityReportModal
- [ ] ExportCSVButton

### Scripts
- [ ] scripts/update-customer-metrics.ts
- [ ] scripts/send-feedback-requests.ts
- [ ] scripts/identify-dormant-customers.ts

### Forms Aggiornati
- [ ] app/auth/register - aggiungi birthDate, city, instagram
- [ ] app/liste/nuovo - aggiungi bookingMethod, groupSize

---

**Database Status:** ✅ PRONTO
**Prossimo Step:** Implementare API `/api/guests` e dashboard `/clienti`

Vuoi che proceda con la FASE 2? 🚀
