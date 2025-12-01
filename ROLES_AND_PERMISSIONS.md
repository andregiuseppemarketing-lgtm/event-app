# Sistema di Ruoli e Permessi

## Ruoli Utente Implementati

### 1. USER (Utente Base)
**Descrizione**: Cliente normale che partecipa agli eventi.

**Permessi**:
- ✅ Visualizzare eventi pubblici
- ✅ Accedere ai propri biglietti
- ✅ Vedere le proprie prenotazioni
- ✅ Lasciare feedback sugli eventi
- ❌ Non può creare eventi
- ❌ Non può gestire liste

**Accesso Dashboard**: Dashboard personale base

---

### 2. PR (Promoter/PR)
**Descrizione**: Responsabile della promozione e gestione delle liste ingressi.

**Permessi**:
- ✅ Tutto ciò che può fare USER
- ✅ Creare e gestire proprie liste ospiti
- ✅ Aggiungere persone alle liste
- ✅ Visualizzare statistiche delle proprie liste
- ✅ Generare link di invito personalizzati
- ❌ Non può creare eventi
- ❌ Non può vedere liste di altri PR

**Accesso Dashboard**: Dashboard PR con statistiche performance

**Schema Database**:
```prisma
model PRProfile {
  userId        String
  bio           String?
  instagramUrl  String?
  performance   Json? // Metriche performance
}
```

---

### 3. DJ
**Descrizione**: Disc jockey che si esibisce agli eventi.

**Permessi**:
- ✅ Tutto ciò che può fare USER
- ✅ Visualizzare lineup e set assegnati
- ✅ Vedere eventi in cui è stato ingaggiato
- ✅ Accedere a statistiche delle proprie performance
- ❌ Non può creare eventi
- ❌ Non può gestire liste

**Accesso Dashboard**: Dashboard DJ con calendario esibizioni

**Note**: Implementazione futura includerà:
- Modello `DJProfile` per bio e generi musicali
- Sistema di booking e pagamenti
- Calendario set/esibizioni

---

### 4. STAFF
**Descrizione**: Personale che lavora agli eventi (addetti check-in, sicurezza, etc).

**Permessi**:
- ✅ Tutto ciò che può fare USER
- ✅ Effettuare check-in dei biglietti
- ✅ Scansionare QR code
- ✅ Visualizzare liste ingressi
- ✅ Gestire code e accessi
- ❌ Non può creare o modificare eventi
- ❌ Accesso limitato agli eventi assegnati

**Accesso Dashboard**: Dashboard operativa con scanner QR

---

### 5. ORGANIZER
**Descrizione**: Organizzatore di eventi con controllo completo sui propri eventi.

**Permessi**:
- ✅ Tutto ciò che può fare STAFF
- ✅ Creare nuovi eventi
- ✅ Gestire i propri eventi (pubblicare, annullare, eliminare)
- ✅ Vedere analytics e statistiche dettagliate
- ✅ Gestire venue e location
- ✅ Assegnare staff e PR agli eventi
- ✅ Accedere a funzionalità marketing
- ❌ Non può modificare eventi di altri organizer
- ❌ Non ha accesso admin globale

**Accesso Dashboard**: Dashboard completa con analytics e gestione eventi

---

### 6. ADMIN
**Descrizione**: Amministratore di sistema con accesso completo.

**Permessi**:
- ✅ **ACCESSO TOTALE** a tutte le funzionalità
- ✅ Gestire tutti gli eventi di tutti gli organizer
- ✅ Modificare ruoli utenti
- ✅ Accedere a tutti i dati e analytics
- ✅ Configurare impostazioni di sistema
- ✅ Gestire club e venue
- ✅ Vedere audit log di tutte le azioni

**Accesso Dashboard**: Dashboard amministrativa completa

---

## Entità Club

### Club (Discoteca/Pub/Lido)
**Descrizione**: Entità che rappresenta un locale/venue che ospita eventi.

**Schema Database**:
```prisma
model Club {
  id          String    @id @default(cuid())
  name        String    // Nome del club
  type        ClubType  // DISCOTECA, PUB, LIDO, ALTRO
  description String?   // Descrizione
  logo        String?   // Logo/immagine
  website     String?   // Sito web
  ownerId     String    // Proprietario (User)
  owner       User      @relation("ClubOwner")
  venues      Venue[]   // Locali/sedi
  createdAt   DateTime
  updatedAt   DateTime
}

enum ClubType {
  DISCOTECA
  PUB
  LIDO
  ALTRO
}
```

**Relazioni**:
- Un Club ha un `owner` (User, tipicamente ORGANIZER o ADMIN)
- Un Club può avere multiple `venues` (location fisiche)
- Una Venue appartiene a un Club (opzionale)

**Esempio di Utilizzo**:
```typescript
// Creare un club
const club = await prisma.club.create({
  data: {
    name: "Paradise Nightclub",
    type: "DISCOTECA",
    description: "La migliore discoteca di Catania",
    website: "https://paradise-club.it",
    ownerId: userId, // User con ruolo ORGANIZER
    venues: {
      create: [
        {
          name: "Paradise Main Hall",
          address: "Via Roma 123",
          city: "Catania",
          capacity: 1000
        }
      ]
    }
  }
});
```

---

## Matrice Permessi

| Funzionalità | USER | PR | DJ | STAFF | ORGANIZER | ADMIN |
|-------------|------|----|----|-------|-----------|-------|
| Vedere eventi pubblici | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prenotare biglietti | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Creare liste ospiti | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Check-in biglietti | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Creare eventi | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire propri eventi | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestire tutti eventi | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Vedere analytics | ❌ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ |
| Gestire utenti | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Creare club | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Marketing automation | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

⚠️ = Accesso limitato ai propri dati

---

## Implementazione nei Componenti

### Controllo Permessi nel Codice

```typescript
// Dashboard check
{['ORGANIZER', 'ADMIN'].includes(userRole) && (
  <Button href="/eventi/nuovo">Nuovo Evento</Button>
)}

// Check-in access
{['STAFF', 'ORGANIZER', 'ADMIN'].includes(userRole) && (
  <Button href="/checkin">Verifica Ingressi</Button>
)}

// PR dashboard
{userRole === 'PR' && (
  <PRDashboard />
)}

// DJ calendar
{userRole === 'DJ' && (
  <DJCalendar />
)}
```

### API Protection

```typescript
// Solo ADMIN e ORGANIZER possono creare eventi
const { error, user } = await requireAuth(['ADMIN', 'ORGANIZER']);
if (error) return error;

// Check ownership per ORGANIZER (non ADMIN)
if (user.role === 'ORGANIZER' && event.createdByUserId !== user.id) {
  return ApiErrors.forbidden();
}
```

---

## Prossimi Passi (Future Implementation)

### Per DJ:
- [ ] Creare `DJProfile` model con bio, generi, social
- [ ] Sistema di booking DJ per eventi
- [ ] Calendario esibizioni e set list
- [ ] Statistiche performance DJ

### Per Club:
- [ ] Interfaccia gestione club
- [ ] Dashboard club con metriche aggregate
- [ ] Gestione staff per club
- [ ] Sistema di affiliazione venue-club

### Per PR:
- [ ] Sistema di commissioni e pagamenti
- [ ] Tracking conversioni link invito
- [ ] Leaderboard PR performance
- [ ] Sistema di rewards

---

## Come Assegnare Ruoli

### Tramite Database Diretto
```sql
-- Promuovere utente a ORGANIZER
UPDATE users SET role = 'ORGANIZER' WHERE email = 'user@example.com';

-- Creare DJ
UPDATE users SET role = 'DJ' WHERE email = 'dj@example.com';
```

### Tramite Admin UI (Da Implementare)
- Pannello admin per gestione utenti
- Interfaccia per cambio ruoli
- Log di tutte le modifiche permessi

---

**Data Implementazione**: Novembre 2025  
**Status**: ✅ Schema DB implementato, UI parziale  
**Prossimo Milestone**: Dashboard specifiche per DJ e interfaccia gestione Club
