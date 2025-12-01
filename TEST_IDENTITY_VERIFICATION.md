# 🧪 Guida Test - Sistema Verifica Identità

## 📋 Prerequisiti
✅ Server avviato su http://localhost:3000
✅ Database popolato con utenti di test
✅ Fase 2 implementata completamente

## 🎯 Scenari di Test

### Scenario 1️⃣: Upload Documenti (Utente)

**Credenziali:**
- Email: `test@example.com`
- Password: `test123`
- Stato: NON verificato ❌

**Step:**
1. Vai su http://localhost:3000/auth/login
2. Accedi con le credenziali sopra
3. Vai su http://localhost:3000/verifica-identita
4. Dovresti vedere:
   - ✅ Messaggio "Perché verificare la tua identità?"
   - ✅ Form per upload documenti
   - ✅ Selezione tipo documento (Radio buttons)
   - ✅ Campo numero documento (opzionale)
   - ✅ Upload fronte documento
   - ✅ Upload retro documento (solo se Carta d'Identità)
   - ✅ Upload selfie con documento
   - ✅ Note privacy GDPR

**Test Upload:**
1. Seleziona "Carta d'Identità"
2. Inserisci numero documento (es. "AX1234567")
3. Carica immagine fronte (JPG/PNG/WebP, max 5MB)
4. Carica immagine retro
5. Carica selfie
6. Clicca "Invia Documenti"

**Risultato Atteso:**
- ✅ Toast: "Richiesta inviata"
- ✅ Alert giallo: "La tua richiesta è in fase di revisione"
- ✅ Form nascosto (mostra solo storico)

**Test Validazioni:**
- ❌ Prova a inviare senza documenti → Errore
- ❌ Carica file > 5MB → Errore
- ❌ Carica file PDF → Errore "Formato non valido"
- ❌ ID Card senza retro → Errore

---

### Scenario 2️⃣: Revisione Documenti (Admin)

**Credenziali:**
- Email: `admin@panico.app`
- Password: `admin123`
- Ruolo: ADMIN

**Step:**
1. Logout dall'utente test
2. Login come admin
3. Vai su http://localhost:3000/dashboard/verifica-identita

**Dovresti vedere:**
- ✅ 3 Card con statistiche:
  - In Attesa (giallo)
  - Approvate (verde)
  - Rifiutate (rosso)
- ✅ Sezione "Richieste in Attesa" con la richiesta di test@example.com
- ✅ Dettagli utente:
  - Nome, email, telefono
  - Tipo documento
  - Data richiesta
- ✅ Pulsante "Revisiona Documenti"

**Test Revisione:**
1. Clicca "Revisiona Documenti"
2. Dovresti vedere dialog con:
   - ✅ Info utente (nome, email, telefono, data nascita)
   - ✅ Immagine fronte documento
   - ✅ Immagine retro documento
   - ✅ Selfie con documento
   - ✅ Textarea "Motivo Rifiuto"
   - ✅ Pulsanti "Rifiuta" (rosso) e "Approva" (verde)

**Test Approvazione:**
1. Clicca "Approva"
2. Risultato atteso:
   - ✅ Toast: "Approvato"
   - ✅ Dialog si chiude
   - ✅ Richiesta sparisce da "In Attesa"
   - ✅ Appare in "Revisioni Recenti" con badge verde
   - ✅ Stats: "Approvate" incrementa di 1

**Test Rifiuto:**
1. Crea una nuova richiesta con altro utente (user1@example.com / user123)
2. Revisiona come admin
3. Scrivi motivo: "Documento non leggibile"
4. Clicca "Rifiuta"
5. Risultato atteso:
   - ✅ Toast: "Rifiutato"
   - ✅ Stats: "Rifiutate" incrementa di 1
   - ✅ Appare in revisioni con badge rosso

---

### Scenario 3️⃣: Verifica Stato (Utente)

**Step dopo approvazione:**
1. Logout da admin
2. Login come test@example.com
3. Vai su http://localhost:3000/verifica-identita

**Dovresti vedere:**
- ✅ Alert verde: "La tua identità è stata verificata con successo!"
- ✅ Sezione "Perché verificare" rimane visibile
- ✅ Form upload NASCOSTO
- ✅ Storico richieste con badge "Approvato" (verde)

**Verifica profilo:**
1. Vai su http://localhost:3000/dashboard
2. L'utente ora dovrebbe avere `identityVerified: true`

---

### Scenario 4️⃣: Richiesta Rifiutata (Utente)

**Step con user1:**
1. Logout
2. Login come user1@example.com / user123
3. Vai su http://localhost:3000/verifica-identita

**Dovresti vedere:**
- ✅ Alert rosso: "La tua richiesta è stata rifiutata"
- ✅ Motivo: "Documento non leggibile"
- ✅ Messaggio: "Puoi inviare una nuova richiesta qui sotto"
- ✅ Form upload VISIBILE (può riprovare)
- ✅ Storico con badge "Rifiutato" (rosso)

---

## 🔍 Verifiche Database

```bash
# Controlla verifiche pending
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.identityVerification.findMany({
  where: { status: 'PENDING' }
}).then(data => console.log(data)).finally(() => prisma.\$disconnect());
"

# Controlla utenti verificati
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { identityVerified: true },
  select: { email: true, identityVerified: true, identityVerifiedAt: true }
}).then(data => console.log(data)).finally(() => prisma.\$disconnect());
"
```

---

## 🐛 Troubleshooting

### Problema: "identityVerification non esiste"
**Soluzione:**
```bash
cd "/Users/andreagranata/Desktop/APP/PANICO APP"
rm -rf node_modules/.prisma
npx prisma generate
# Riavvia server
```

### Problema: Immagini non visualizzate
**Causa:** File salvati in `/public/uploads/identity` ma path errato
**Verifica:**
```bash
ls -la public/uploads/identity/
```

### Problema: Form non si resetta dopo invio
**Soluzione:** Ricarica pagina (comportamento atteso: mostra alert pending)

---

## ✅ Checklist Completa

### Upload Utente:
- [ ] Form visibile solo se non verificato e nessuna richiesta pending
- [ ] Validazione file (tipo, dimensione)
- [ ] Preview immagini prima upload
- [ ] Pulsante disabilitato durante upload
- [ ] Toast successo dopo invio
- [ ] Alert "In revisione" dopo invio
- [ ] Storico richieste visibile

### Dashboard Admin:
- [ ] Solo ADMIN può accedere
- [ ] Stats corrette (pending/approved/rejected)
- [ ] Lista richieste pending
- [ ] Dialog review con tutte le immagini
- [ ] Approvazione funziona
- [ ] Rifiuto con motivo funziona
- [ ] Refresh automatico dopo review

### Database:
- [ ] Record IdentityVerification creato con status PENDING
- [ ] Dopo approvazione: status APPROVED, user.identityVerified = true
- [ ] Dopo rifiuto: status REJECTED, rejectionReason salvato
- [ ] AuditLog creato per ogni azione

### API:
- [ ] POST /api/identity/upload → 200 con verificationId
- [ ] POST /api/identity/review → 200 con status aggiornato
- [ ] GET /api/identity/upload → 200 con storico utente

---

## 📸 Screenshot Consigliati

1. Form upload vuoto
2. Form con tutte le immagini caricate
3. Dialog admin con documenti
4. Alert verde dopo approvazione
5. Alert rosso dopo rifiuto
6. Stats dashboard admin

---

## 🚀 Prossimi Step

Dopo aver testato con successo:
1. Task 7: Integrare controlli `identityVerified` nelle azioni critiche
2. Task 8: Email notifications
3. Deploy su Vercel
4. Test produzione

---

**Buon Testing! 🧪**
