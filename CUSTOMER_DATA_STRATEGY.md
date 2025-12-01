# 📊 Strategia Dati Clienti - Panico App

## ✅ DATI GIÀ DISPONIBILI NEL DATABASE

### 1. Dati Anagrafici (User/Guest/ListEntry)
- ✅ Nome
- ✅ Cognome
- ✅ Email
- ✅ Telefono
- ✅ Genere (Gender: F/M/NB/UNK)
- ❌ Soprannome
- ❌ Data di nascita/Età
- ❌ Città di provenienza
- ❌ Occupazione

### 2. Dati di Contatto
- ✅ Email
- ✅ Telefono
- ❌ Instagram handle
- ❌ Altri social

### 3. Dati Evento
- ✅ Tipo biglietto (TicketType: FREE/LIST/PAID)
- ✅ Orario ingresso (CheckIn.scannedAt)
- ✅ QR code (Ticket.code, qrData)
- ✅ Validità (TicketStatus)
- ✅ Nome PR (tramite PRProfile → Assignment)
- ✅ Evento specifico (Event)
- ❌ Metodo prenotazione (Instagram/WhatsApp/Sito/App)
- ❌ Gate di ingresso (esiste Gate enum ma non tracciato)

### 4. Comportamento Cliente
- ❌ Numero eventi frequentati (serve query aggregata)
- ❌ Frequenza (occasionale/abituale/top fan)
- ❌ Giorni preferiti
- ❌ Orario tipico arrivo
- ❌ Tavolo vs ingresso normale
- ❌ Viene in gruppo o solo
- ❌ Numero persone portate

### 5. Dati di Spesa
- ✅ Prezzo biglietto (Ticket.price)
- ❌ Spesa prevista vs reale
- ❌ Consumazioni
- ❌ Up-selling
- ❌ Pacchetti

### 6. Segmentazione Psicografica
- ❌ Stile musicale preferito
- ❌ Risposta a promozioni
- ❌ Coinvolgimento social

### 7. Marketing/Funnel
- ✅ Link utilizzato (InviteLink con UTM)
- ✅ UTM tracking (utmSource, utmMedium, utmCampaign)
- ❌ Visualizzazioni storia
- ❌ Click link
- ❌ Abbandono funnel
- ❌ Ultima interazione PR

### 8. Dati Logistici
- ✅ Gate ingresso (enum disponibile ma non usato)
- ❌ Mezzo arrivo
- ❌ Tempo attesa
- ❌ Canale ingresso specifico

### 9. Sicurezza
- ✅ Note check-in (CheckIn.notes)
- ❌ Blacklist
- ❌ Segnalazioni comportamento
- ❌ Note sicurezza

### 10. Post-Evento
- ❌ Feedback/rating
- ❌ Segnalazioni
- ❌ Interesse eventi futuri
- ❌ Conversione a premium

---

## 🔧 PIANO DI IMPLEMENTAZIONE

### FASE 1: Estensione Database (PRIORITÀ ALTA)

```prisma
// 1. Estendere model Guest/User con dati anagrafici
model Guest {
  // ... campi esistenti
  nickname          String?
  birthDate         DateTime?
  city              String?
  occupation        String?
  instagram         String?
  // Dati comportamentali aggregati
  totalEvents       Int         @default(0)
  lastEventDate     DateTime?
  customerSegment   String?     // "occasional", "regular", "vip"
  preferredDays     String?     // JSON array
  averageArrival    String?     // "early", "medium", "late"
  prefersTable      Boolean     @default(false)
  groupSize         Int?        // media persone portate
}

// 2. Estendere ListEntry per metodo prenotazione
model ListEntry {
  // ... campi esistenti
  bookingMethod     BookingMethod @default(MANUAL)
  referralSource    String?       // "instagram_dm", "whatsapp", "website"
  groupSize         Int           @default(1)
}

enum BookingMethod {
  INSTAGRAM
  WHATSAPP
  WEBSITE
  APP
  PHONE
  MANUAL
}

// 3. Nuovo model per Consumazioni
model Consumption {
  id                String   @id @default(cuid())
  ticketId          String
  eventId           String
  amount            Float
  category          String   // "drink", "bottle", "table", "food"
  items             Json     // dettaglio ordine
  createdAt         DateTime @default(now())
  
  ticket            Ticket   @relation(fields: [ticketId], references: [id])
  event             Event    @relation(fields: [eventId], references: [id])
}

// 4. Tracking Funnel Marketing
model FunnelTracking {
  id                String   @id @default(cuid())
  sessionId         String
  guestEmail        String?
  guestPhone        String?
  eventId           String
  step              String   // "view", "click", "form_start", "form_complete", "ticket_issued"
  metadata          Json?
  timestamp         DateTime @default(now())
  
  event             Event    @relation(fields: [eventId], references: [id])
}

// 5. Feedback Post-Evento
model EventFeedback {
  id                String   @id @default(cuid())
  eventId           String
  ticketId          String?
  guestId           String?
  rating            Int      // 1-5
  musicRating       Int?
  serviceRating     Int?
  venueRating       Int?
  comment           String?
  wouldReturn       Boolean?
  interests         Json?    // eventi futuri di interesse
  createdAt         DateTime @default(now())
  
  event             Event         @relation(fields: [eventId], references: [id])
  ticket            Ticket?       @relation(fields: [ticketId], references: [id])
  guest             Guest?        @relation(fields: [guestId], references: [id])
}

// 6. Blacklist e Segnalazioni
model SecurityNote {
  id                String   @id @default(cuid())
  guestId           String?
  eventId           String?
  ticketId          String?
  severity          String   // "info", "warning", "danger", "blacklist"
  type              String   // "behavior", "sobriety", "violence", "other"
  description       String
  reportedBy        String
  createdAt         DateTime @default(now())
  
  guest             Guest?   @relation(fields: [guestId], references: [id])
  event             Event?   @relation(fields: [eventId], references: [id])
  ticket            Ticket?  @relation(fields: [ticketId], references: [id])
}

// 7. Preferenze e Segmentazione
model CustomerPreferences {
  id                String   @id @default(cuid())
  guestId           String   @unique
  musicGenres       Json?    // ["house", "techno", "commercial"]
  dressStyle        String?
  drinkPreferences  Json?
  avgSpending       Float?
  responseToPromo   String?  // "high", "medium", "low"
  socialEngagement  String?  // "high", "medium", "low"
  conversionScore   Float?   // 0-100
  
  guest             Guest    @relation(fields: [guestId], references: [id])
}
```

### FASE 2: Punti di Raccolta Dati

#### A. **Registrazione/Prima Interazione**
**Dove:** `/auth/register`, Link invito PR, Form lista
**Dati da raccogliere:**
- Nome, cognome, email, telefono (obbligatori)
- Data di nascita (per controllo età + statistiche)
- Città (optional)
- Instagram handle (optional ma incentivato)
- Come ci hai conosciuto? (dropdown)

#### B. **Check-in Evento**
**Dove:** Scanner QR, App check-in
**Dati da tracciare:**
- Orario preciso ingresso
- Gate utilizzato
- Numero accompagnatori (se previsto)
- Note staff (comportamento, problemi)

#### C. **Durante Evento**
**Dove:** Sistema POS/Ordini (se integrato)
**Dati da raccogliere:**
- Consumazioni (drink, bottiglie, tavoli)
- Preferenze (sempre stessa bevanda?)
- Up-selling (ha accettato upgrade?)

#### D. **Post-Evento** (24-48h dopo)
**Dove:** Email/SMS/WhatsApp automatico
**Dati da raccogliere:**
- Rating 1-5 stelle
- Cosa ti è piaciuto di più?
- Torneresti?
- Interesse per prossimi eventi
- Suggerimenti

#### E. **Tracking Continuo**
**Dove:** Backend automatico
**Dati da calcolare:**
- Numero eventi totali partecipati
- Ultima presenza
- Frequenza (ogni settimana? ogni mese?)
- Giorni preferiti (80% viene il sabato?)
- Orario arrivo medio
- Segmento cliente (VIP, Regular, Occasionale)

### FASE 3: Dashboard di Monitoraggio

#### 📊 **Dashboard Clienti** (`/clienti`)
- Lista completa clienti con filtri avanzati
- Segmentazione (VIP, Regular, Occasionali, Dormienti)
- Ricerca per nome, email, telefono, Instagram
- Export CSV per campagne marketing

#### 📈 **Analytics Cliente Singolo** (`/clienti/[id]`)
- Profilo completo
- Storico eventi partecipati
- Grafico spesa nel tempo
- Preferenze musicali
- Engagement score
- Timeline interazioni

#### 🎯 **Segmentazione Marketing** (`/marketing/segmenti`)
- VIP Spenders (top 10% spesa)
- Habituals (4+ eventi/mese)
- At Risk (non vengono da 30+ giorni)
- New Customers (primo evento < 30 giorni)
- Instagram Influencers (follower > soglia)
- Abandoned Carts (hanno iniziato ma non completato)

#### 📧 **Campaign Manager** (`/marketing/campagne`)
- Crea campagne targetizzate
- Email/SMS/WhatsApp bulk
- Tracking aperture/click
- A/B testing
- ROI per campagna

### FASE 4: Automazioni Marketing

1. **Welcome Flow**
   - Email/SMS benvenuto dopo prima registrazione
   - Sconto 10% sul prossimo evento
   - Follow su Instagram

2. **Post-Event**
   - Feedback request automatico
   - Thank you + foto evento
   - Early bird prossimo evento

3. **Re-Engagement**
   - Se non viene da 30 giorni → email "Ci manchi"
   - Offerta speciale personalizzata
   - Se non apre dopo 3 tentativi → segnare come "dormiente"

4. **VIP Program**
   - Dopo 10 eventi → status VIP
   - Ingresso prioritario
   - Inviti eventi esclusivi
   - Tavolo gratis ogni X presenze

5. **Birthday Club**
   - Ingresso gratis il giorno del compleanno
   - Bottiglia omaggio con gruppo > 5 persone
   - Email 7 giorni prima

### FASE 5: Compliance GDPR

⚠️ **IMPORTANTE**: Tutti questi dati richiedono:
- ✅ Consenso esplicito alla raccolta
- ✅ Privacy Policy chiara
- ✅ Possibilità di esportare dati (GDPR)
- ✅ Possibilità di cancellare account
- ✅ Cookie consent per tracking
- ✅ Opt-out marketing
- ✅ Sicurezza dati (encryption password, backup)

---

## 🎯 PRIORITÀ IMPLEMENTAZIONE

### ⚡ QUICK WINS (1-2 settimane)
1. ✅ Aggiungi Instagram handle a User/Guest
2. ✅ Aggiungi data nascita a Guest
3. ✅ Traccia booking method in ListEntry
4. ✅ Implementa gate tracking in CheckIn
5. ✅ Crea dashboard clienti base con filtri

### 🚀 MEDIO TERMINE (1 mese)
1. Modello Consumption per tracking spesa
2. FunnelTracking per analytics marketing
3. EventFeedback post-evento
4. Calcolo automatico segmento cliente
5. Dashboard analytics cliente singolo

### 🏆 LUNGO TERMINE (2-3 mesi)
1. CustomerPreferences con AI scoring
2. SecurityNote e blacklist
3. Campaign Manager completo
4. Automazioni email/SMS
5. VIP Program con rewards

---

## 📍 DOVE MONITORARE I DATI

| Dato | Dove si raccoglie | Dove si monitora |
|------|------------------|------------------|
| Nome, email, telefono | Registrazione, Lista PR | `/clienti` |
| Instagram | Form registrazione | Profilo cliente |
| Data nascita | Registrazione | Profilo + Birthday dashboard |
| Tipo biglietto | Creazione ticket | Stats evento |
| Orario ingresso | Check-in scan | Analytics evento, Timeline cliente |
| PR di riferimento | Assegnazione lista | Dashboard PR, Commissioni |
| Metodo prenotazione | Link tracking | Funnel analytics |
| Eventi frequentati | Auto-calcolato | Profilo cliente, Segmentazione |
| Frequenza | Auto-calcolato da storico | Dashboard segmenti |
| Spesa | POS/Consumazioni | Analytics cliente, Revenue dashboard |
| Feedback | Form post-evento | Dashboard satisfaction |
| Blacklist | Security notes | Dashboard sicurezza |

---

## 🛠️ PROSSIMI PASSI

1. **Decidi quali dati prioritari** implementare subito
2. **Aggiorna schema Prisma** con nuovi campi/modelli
3. **Crea migration** database
4. **Aggiorna form registrazione** per raccogliere nuovi dati
5. **Implementa dashboard clienti** con ricerca/filtri
6. **Setup GDPR compliance** (privacy policy, consensi)
7. **Test e raccolta feedback** dallo staff

Quale parte vuoi che implementi per prima? 🚀
