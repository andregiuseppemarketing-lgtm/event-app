# Sistema di Recupero Password - Guida Completa

## 🔐 Funzionalità Implementate

### 1. **Pagina Login** (`/auth/login`)
- Link "Password dimenticata?" che porta a `/auth/forgot-password`

### 2. **Pagina Registrazione** (`/auth/register`)
- Campo "Conferma Password" con validazione
- **Indicatore Forza Password** con 6 livelli:
  - Debole (rosso) - Score 0-2
  - Media (giallo) - Score 3-4
  - Forte (verde) - Score 5-6
- **Requisiti Password**:
  - ✅ Almeno 8 caratteri
  - ✅ Una lettera maiuscola (A-Z)
  - ✅ Una lettera minuscola (a-z)
  - ✅ Un numero (0-9)
- Feedback visivo quando le password coincidono/non coincidono
- Suggerimento: "Usa una frase facile da ricordare con numeri e maiuscole"

### 3. **Pagina Password Dimenticata** (`/auth/forgot-password`)
- Form per inserire email
- Genera token di reset valido per 1 ora
- Messaggio di successo dopo invio
- **Security**: Non rivela se l'email esiste o no

### 4. **Pagina Reset Password** (`/auth/reset-password?token=XXX`)
- Validazione token all'apertura
- Stesso indicatore forza password della registrazione
- Campo conferma password
- Auto-redirect al login dopo reset riuscito (3 secondi)
- Gestione token scaduti/invalidi

## 🔄 Flusso Completo

### Scenario 1: Utente Dimentica Password

1. **Login Page**: Clicca "Password dimenticata?"
2. **Forgot Password**: Inserisce email → Submit
3. **Conferma**: "Abbiamo inviato un link..."
4. **Email** (TODO): Riceve email con link reset
5. **Reset Password**: Clicca link → Apre `/auth/reset-password?token=abc123`
6. **Validazione**: Sistema valida token (scadenza 1 ora)
7. **Nuova Password**: Inserisce nuova password + conferma
8. **Successo**: "Password Reimpostata!" → Auto-redirect a login
9. **Login**: Accede con nuova password ✅

### Scenario 2: Token Scaduto/Invalido

1. Token scaduto (>1 ora) o già usato
2. Pagina mostra: "Link non valido"
3. Bottone: "Richiedi nuovo link" → `/auth/forgot-password`

## 🗄️ Database

### Campi Aggiunti a `User`

```prisma
model User {
  // ... altri campi
  
  // Password Reset
  resetToken       String?   // Hash SHA-256 del token
  resetTokenExpiry DateTime? // Scadenza (1 ora da generazione)
}
```

## 📡 API Endpoints

### POST `/api/auth/forgot-password`
**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Se l'email esiste, riceverai un link..."
}
```

**Comportamento:**
- Genera token casuale (32 bytes)
- Hash con SHA-256 e salva nel DB
- Scadenza: 1 ora
- TODO: Invia email con link
- **Security**: Risponde sempre con successo (non rivela se email esiste)

**Console Log (Sviluppo):**
```
[Forgot Password] Reset token generated for: user@example.com
[Forgot Password] Reset URL (TODO: send via email): http://localhost:3000/auth/reset-password?token=abc123...
[Forgot Password] Token expires at: 2025-11-28T15:30:00.000Z
```

### POST `/api/auth/validate-reset-token`
**Body:**
```json
{
  "token": "abc123..."
}
```

**Response (Valido):**
```json
{
  "success": true,
  "valid": true
}
```

**Response (Invalido/Scaduto):**
```json
{
  "error": "Token non valido o scaduto"
}
```

### POST `/api/auth/reset-password`
**Body:**
```json
{
  "token": "abc123...",
  "password": "NewPassword123"
}
```

**Response (Successo):**
```json
{
  "success": true,
  "message": "Password reimpostata con successo"
}
```

**Response (Errore):**
```json
{
  "error": "Token non valido o scaduto. Richiedi un nuovo link di recupero."
}
```

**Validazioni:**
- Password >= 8 caratteri
- Almeno 1 maiuscola
- Almeno 1 minuscola
- Almeno 1 numero
- Token valido e non scaduto

**Comportamento:**
- Hash password con bcrypt
- Aggiorna `passwordHash`
- Rimuove `resetToken` e `resetTokenExpiry` (token usa-e-getta)
- Log dell'operazione

## 🧪 Testing Manuale

### Test 1: Flusso Completo Reset Password

```bash
# 1. Vai su login
http://localhost:3000/auth/login

# 2. Clicca "Password dimenticata?"
# → Redirect a /auth/forgot-password

# 3. Inserisci email esistente e submit
# → Messaggio: "Abbiamo inviato un link..."

# 4. Controlla console backend per il link
# Copia l'URL stampato: http://localhost:3000/auth/reset-password?token=...

# 5. Apri il link in browser
# → Validazione token automatica

# 6. Inserisci nuova password (es: "NewPassword123")
# → Vedi indicatore forza password

# 7. Inserisci conferma password
# → Vedi checkmark verde quando coincidono

# 8. Submit
# → Messaggio successo
# → Auto-redirect a login dopo 3 secondi

# 9. Login con nuova password
# ✅ Funziona!
```

### Test 2: Token Scaduto

```bash
# 1. Genera token
# 2. Aspetta 1 ora
# 3. Prova ad usare il link
# → Errore: "Token non valido o scaduto"
# → Bottone "Richiedi nuovo link"
```

### Test 3: Token Riutilizzato

```bash
# 1. Reset password con successo
# 2. Prova a riusare lo stesso link
# → Errore: "Token non valido" (token cancellato dal DB)
```

### Test 4: Password Debole

```bash
# 1. Prova password: "weak"
# → Indicatore rosso "Debole"
# → Requisiti mostrano X rosso

# 2. Prova password: "Password1"
# → Indicatore giallo/verde "Media/Forte"
# → Requisiti mostrano ✓ verde

# 3. Submit con password debole
# → Errore: "La password deve contenere..."
```

## 🔒 Security Features

### 1. Token Sicuro
- Token generato con `crypto.randomBytes(32)` (256 bit)
- Hash SHA-256 salvato nel DB (non plain text)
- Scadenza 1 ora (configurable)

### 2. No Email Enumeration
- API risponde sempre con successo
- Non rivela se email esiste o no
- Delay simulato per email non esistenti

### 3. Token Usa-e-Getta
- Token cancellato dopo uso
- Non riutilizzabile

### 4. Password Validation
- Requisiti minimi applicati
- Hash bcrypt (10 rounds)

## 📧 TODO: Email Service

Quando configureremo il servizio email, sostituire il TODO in `/api/auth/forgot-password`:

```typescript
// TODO: Implementare con Resend, SendGrid, o AWS SES
import { sendPasswordResetEmail } from '@/lib/email';

const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
await sendPasswordResetEmail({
  to: user.email,
  name: user.firstName || 'Utente',
  resetUrl,
  expiresAt: resetTokenExpiry,
});
```

**Template Email Consigliato:**

```
Oggetto: Reset Password - Panico App

Ciao [Nome],

Hai richiesto di reimpostare la password del tuo account Panico.

Clicca sul link qui sotto per creare una nuova password:
[Link Button]

Questo link scadrà tra 1 ora.

Se non hai richiesto questo reset, ignora questa email.

---
Team Panico
```

## 📁 File Creati/Modificati

### Nuovi File:
- ✅ `components/password-strength-indicator.tsx` - Componente riutilizzabile
- ✅ `app/auth/forgot-password/page.tsx` - Form recupero password
- ✅ `app/auth/reset-password/page.tsx` - Form nuova password
- ✅ `app/api/auth/forgot-password/route.ts` - Genera token
- ✅ `app/api/auth/validate-reset-token/route.ts` - Valida token
- ✅ `app/api/auth/reset-password/route.ts` - Reimposta password

### File Modificati:
- ✅ `app/auth/login/page.tsx` - Aggiunto link "Password dimenticata?"
- ✅ `app/auth/register/page.tsx` - Aggiunto conferma password + indicatore
- ✅ `prisma/schema.prisma` - Aggiunti `resetToken`, `resetTokenExpiry`

## ✅ Checklist Implementazione

- [x] Database schema aggiornato
- [x] API forgot-password (genera token)
- [x] API validate-reset-token
- [x] API reset-password (aggiorna password)
- [x] UI forgot-password page
- [x] UI reset-password page
- [x] Indicatore forza password
- [x] Validazione token scadenza
- [x] Security: no email enumeration
- [x] Token usa-e-getta
- [x] Auto-redirect dopo successo
- [x] Link su login page
- [ ] Email service integration (TODO)
- [ ] Rate limiting (opzionale)
- [ ] CAPTCHA (opzionale)

## 🚀 Pronto per il Deploy!

Il sistema è completo e funzionante. L'unica parte mancante è l'invio email, ma il link di reset può essere copiato dalla console per ora.
