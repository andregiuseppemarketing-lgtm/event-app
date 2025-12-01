# Sistema di Autenticazione Proprietario - Completato ✅

## 🎯 Obiettivo Raggiunto
Sistema di autenticazione proprietario email+password con onboarding multi-step (3 passaggi), completamente indipendente da OAuth (Google, Facebook, Instagram rimossi).

---

## 📋 Cosa è Stato Implementato

### **1. API Routes (Backend)**

#### `/api/auth/register` (Step 1) ✅
- **Metodo:** POST
- **Validazione:** `RegisterStepOneSchema`
- **Input:** `email`, `password`, `termsAccepted`, `privacyAccepted`
- **Logica:**
  - Hash password (bcrypt, 12 rounds)
  - Controllo email duplicata
  - Creazione `User` (minima: solo email + password)
  - Creazione `UserConsent` (timestamp consensi)
  - Creazione `OnboardingProgress` (currentStep=2, step1Completed=true)
- **Output:** `{ userId, email, nextStep: 2 }`

#### `/api/onboarding/profile` (Step 2) ✅
- **Metodo:** PATCH
- **Validazione:** `RegisterStepTwoSchema`
- **Auth:** `authRequired()` middleware
- **Input:** `firstName`, `lastName`, `birthDate`, `city`, `gender`, `instagramHandle`, `marketingOptIn`
- **Logica:**
  - Calcolo età da birthDate
  - Verifica 18+ (age verification)
  - Update `User` (firstName, lastName, birthDate, age, ageVerified=true)
  - Update/Create `UserProfile` (city, gender, instagramHandle)
  - Update `UserConsent` (marketingOptIn se fornito)
  - Update `OnboardingProgress` (currentStep=3, step2Completed=true)
- **Output:** `{ userId, firstName, lastName, nextStep: 3 }`

#### `/api/phone/send-otp` (Step 3a) ✅
- **Metodo:** POST
- **Validazione:** `SendOTPSchema`
- **Auth:** `authRequired()` middleware
- **Input:** `phoneNumber` (formato internazionale)
- **Logica:**
  - Controllo phone duplicato (altro utente verificato)
  - Generazione OTP 6 cifre random
  - Scadenza: 5 minuti (300 secondi)
  - Create/Update `UserPhone` (otpCode, otpExpiresAt, otpAttempts=0)
  - **MOCK:** Log OTP su console (no SMS real)
- **Output:** `{ phoneNumber, expiresIn: 300, otpCode }` (otpCode solo in development)

#### `/api/phone/verify-otp` (Step 3b) ✅
- **Metodo:** POST
- **Validazione:** `VerifyOTPSchema`
- **Auth:** `authRequired()` middleware
- **Input:** `phoneNumber`, `otpCode` (6 cifre)
- **Logica:**
  - Find `UserPhone` by userId + phoneNumber
  - Rate limiting: max 5 tentativi (otpAttempts)
  - Check scadenza OTP (otpExpiresAt)
  - Verifica OTP (constant-time comparison)
  - On success: phoneVerified=true, phoneVerifiedAt=now, clear OTP
  - Update `OnboardingProgress` (step3Completed=true, onboardingComplete=true, completedAt=now)
  - Update `User.phone` (backward compatibility)
- **Output:** `{ userId, onboardingComplete: true }`

---

### **2. Pagine UI (Frontend)**

#### `/auth/register` (Step 1) ✅ MODIFICATA
- **Modifiche:**
  - Rimossi OAuth buttons (Google, Facebook, Instagram)
  - Rimossa logica `handleOAuthSignIn`
  - Semplificato body API: solo `email`, `password`, `termsAccepted`, `privacyAccepted`
  - **Redirect:** Dopo registrazione → auto-login → `/onboarding/step-2`
- **Form:** Email, Password, Checkbox Terms/Privacy
- **Submit:** Chiama `/api/auth/register` → auto-login con `signIn('credentials')` → redirect step 2

#### `/onboarding/step-2` ✅ NUOVA
- **Progress:** Step 2 di 3 (progress bar visiva)
- **Form:** 
  - firstName, lastName (required)
  - birthDate (required, BirthDatePicker component)
  - city (optional)
  - gender (select: M/F/NB/UNK, default UNK)
  - instagramHandle (optional, input con prefisso "@")
  - marketingOptIn (checkbox)
- **Submit:** PATCH `/api/onboarding/profile` → redirect `/onboarding/step-3`
- **Auth:** Protected (redirect a login se unauthenticated)
- **UI:** Stripe-style dark mode, card con border-white/10, gradient buttons

#### `/onboarding/step-3` ✅ NUOVA
- **Progress:** Step 3 di 3 (progress bar completamente blu)
- **Form (2 fasi):**
  1. **Phone Input:** Input telefono (formato internazionale) → Invia OTP
  2. **OTP Verification:** Input 6 cifre (font-mono, text-center) → Verifica codice
- **Features:**
  - Countdown timer: mostra tempo rimanente (es. "4:32")
  - Tentativi rimasti: display "3/5 tentativi rimasti"
  - **Development Mode:** Mostra OTP in card gialla (🧪 DEVELOPMENT MODE) per testing
  - Pulsante "Invia nuovo codice" per resend
  - Disabilita submit se OTP scaduto o < 6 cifre
- **Submit:** POST `/api/phone/verify-otp` → redirect `/dashboard`
- **UI:** Mock info box (💡 "Il codice OTP viene mostrato nei log del server")

---

### **3. Middleware Protection** ✅

#### `middleware.ts` - Onboarding Check
- **Logica:**
  - Query `OnboardingProgress` per userId autenticato
  - Se `onboardingComplete === false`:
    - Redirect a `/onboarding/step-{currentStep}`
    - Previene accesso a dashboard/eventi/PR fino a completamento
  - Skip check per: public pages, `/auth/*`, `/onboarding/*`, `/clubs/[id]`
- **Errori:** Graceful handling (continue su Prisma errors)
- **Performance:** Async database query in middleware edge (potenziale bottleneck)

---

### **4. Database Schema (Prisma)** ✅

#### New Models:
```prisma
model UserPhone {
  userId          String    @unique
  phoneNumber     String    @unique
  phoneVerified   Boolean   @default(false)
  phoneVerifiedAt DateTime?
  otpCode         String?
  otpExpiresAt    DateTime?
  otpAttempts     Int       @default(0)
}

model UserConsent {
  userId              String    @unique
  termsAccepted       Boolean   @default(false)
  termsAcceptedAt     DateTime?
  privacyAccepted     Boolean   @default(false)
  privacyAcceptedAt   DateTime?
  marketingOptIn      Boolean   @default(false)
  marketingOptInAt    DateTime?
  newsletterOptIn     Boolean   @default(false)
  newsletterOptInAt   DateTime?
}

model OnboardingProgress {
  userId            String   @unique
  currentStep       Int      @default(1)
  step1Completed    Boolean  @default(false)
  step2Completed    Boolean  @default(false)
  step3Completed    Boolean  @default(false)
  onboardingComplete Boolean  @default(false)
  completedAt       DateTime?
}
```

#### User Relations:
```prisma
model User {
  // ... existing fields
  phoneVerification  UserPhone?
  consents           UserConsent?
  onboardingProgress OnboardingProgress?
}
```

---

### **5. Validations (Zod)** ✅

#### `lib/validations.ts`:
- `RegisterStepOneSchema`: email, password (8+ chars, uppercase, lowercase, numero), termsAccepted, privacyAccepted
- `RegisterStepTwoSchema`: firstName, lastName, birthDate (datetime string), city, gender (enum), instagramHandle, marketingOptIn
- `SendOTPSchema`: phoneNumber (regex `/^\+?[1-9]\d{1,14}$/`, formato internazionale)
- `VerifyOTPSchema`: phoneNumber, otpCode (6 cifre, regex `/^\d{6}$/`)

---

### **6. Files Modified/Created**

#### Modified:
- `app/auth/register/page.tsx` (semplificato per step 1, redirect step 2)
- `app/api/auth/register/route.ts` (refactored da single-step a step 1 only)
- `middleware.ts` (added onboarding check + redirect logic)
- `lib/auth.ts` (removed OAuth providers - fatto in sessione precedente)
- `app/auth/login/page.tsx` (removed OAuth buttons - fatto in sessione precedente)

#### Created:
- `app/api/onboarding/profile/route.ts` (step 2 API)
- `app/api/phone/send-otp/route.ts` (step 3a API)
- `app/api/phone/verify-otp/route.ts` (step 3b API)
- `app/onboarding/step-2/page.tsx` (profile form UI)
- `app/onboarding/step-3/page.tsx` (phone verification UI)

#### Deleted (previous session):
- `INSTAGRAM_OAUTH_SETUP.md`
- `OAUTH_CONFIGURATION.md`
- `OAUTH_SETUP.md`

---

## 🔄 User Flow Completo

```
1. USER → /auth/register
   ↓ Input: email, password, terms checkbox
   ↓ POST /api/auth/register
   ↓ Created: User, UserConsent, OnboardingProgress (step1Completed)
   ↓ Auto-login con signIn('credentials')
   ↓
2. REDIRECT → /onboarding/step-2
   ↓ Input: firstName, lastName, birthDate, city, gender, instagram, marketingOptIn
   ↓ PATCH /api/onboarding/profile
   ↓ Updated: User (profile), UserProfile, UserConsent, OnboardingProgress (step2Completed)
   ↓
3. REDIRECT → /onboarding/step-3
   ↓ Input: phoneNumber
   ↓ POST /api/phone/send-otp
   ↓ Generated: 6-digit OTP (logged to console)
   ↓ Created: UserPhone with otpCode + expiry
   ↓
4. USER → Input OTP (6 cifre)
   ↓ POST /api/phone/verify-otp
   ↓ Verified: OTP match + not expired + attempts < 5
   ↓ Updated: UserPhone (phoneVerified=true), OnboardingProgress (onboardingComplete=true)
   ↓
5. REDIRECT → /dashboard
   ✅ Onboarding completato!
```

---

## 🚀 Deploy Status

### Commits:
- `5569810` - feat: API proprietarie autenticazione multi-step
- `81494f2` - feat: UI multi-step onboarding (step 2 e 3)
- `3ea1069` - feat: middleware onboarding protection

### Vercel Deploys:
- Job `ejuq7KbxZaiFSb5T5Ndq` - API routes
- Job `W1TG6adJMcCnAm8n3vKs` - UI pages
- Job `EgVUUUfwkfpENq7QFMS3` - Middleware (LATEST)

**⚠️ IMPORTANTE:** Prima di testare in produzione, devi eseguire la migrazione database:

```bash
npx prisma migrate dev --name add_onboarding_tables
```

Questo creerà le tabelle `UserPhone`, `UserConsent`, `OnboardingProgress` nel database.

---

## 🧪 Testing (Development)

### Test Registrazione Completa:

1. **Apri:** `http://localhost:3000/auth/register`
2. **Input:** 
   - Email: `test@example.com`
   - Password: `Test1234` (8+ chars, uppercase, lowercase, numero)
   - Checkbox: Accetta Terms & Privacy
3. **Submit** → Auto-login → Redirect a `/onboarding/step-2`

4. **Step 2:**
   - Nome: `Mario`
   - Cognome: `Rossi`
   - Data nascita: `01/01/1995` (18+ required)
   - Città: `Milano`
   - Genere: `Maschile`
   - Instagram: `mariorossi`
   - Marketing: ✅ Checked
5. **Submit** → Redirect a `/onboarding/step-3`

6. **Step 3:**
   - Telefono: `+39 123 456 7890`
   - **Clicca "Invia codice OTP"**
   - **Guarda i log del server** → Vedrai:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     📱 OTP MOCK - DEVELOPMENT ONLY
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Phone: +39 123 456 7890
     OTP Code: 123456
     Expires: 24/11/2025 17:30:00
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```
   - **Copia il codice OTP dai log** (o dalla card gialla in UI development mode)
   - Input: `123456`
   - **Clicca "Verifica codice"**
7. **Redirect** → `/dashboard` ✅

### Verifiche Database (Prisma Studio):
```bash
npx prisma studio
```
- Check `User` → birthDate, age, ageVerified=true
- Check `UserPhone` → phoneVerified=true, phoneVerifiedAt timestamp
- Check `UserConsent` → termsAcceptedAt, privacyAcceptedAt timestamps
- Check `OnboardingProgress` → onboardingComplete=true, completedAt timestamp

---

## 📝 Note Tecniche

### Age Verification (18+)
- **Step 2:** Calcolo età da birthDate con `calculateAge()`
- **Validation:** Reject se age < 18
- **Set:** `User.ageVerified = true` dopo step 2 (self-declared)
- **Future:** Identity verification con documento (Phase 2)

### OTP Mock Implementation
- **Development:** OTP logged to console + mostrato in UI
- **Production (TODO):** Integrare provider SMS (Twilio, AWS SNS, etc.)
- **Security:** 
  - 5 minuti expiry
  - Max 5 tentativi
  - Constant-time comparison
  - OTP cleared dopo verifica

### Middleware Edge Function Concern
- **Issue:** Middleware chiama Prisma (database query) in edge runtime
- **Risk:** Performance bottleneck su high traffic
- **Alternative (TODO):** 
  - Cache onboarding status in JWT session
  - Use Redis/KV for onboarding state
  - Client-side check + server-side verify

### Backward Compatibility
- `User.name` = `${firstName} ${lastName}` (legacy field)
- `User.phone` = phoneNumber (synced dopo verify)
- `User.displayName` = firstName (default)

---

## ✅ Checklist Completamento

- [x] OAuth completamente rimosso (Google, Facebook, Instagram)
- [x] API `/api/auth/register` (step 1 - email+password)
- [x] API `/api/onboarding/profile` (step 2 - profilo)
- [x] API `/api/phone/send-otp` (step 3a - invio OTP)
- [x] API `/api/phone/verify-otp` (step 3b - verifica OTP)
- [x] UI `/onboarding/step-2` (form profilo)
- [x] UI `/onboarding/step-3` (phone + OTP verification)
- [x] Middleware onboarding protection
- [x] Database schema (UserPhone, UserConsent, OnboardingProgress)
- [x] Zod validations (4 nuovi schemas)
- [x] JWT middleware (`authRequired`)
- [x] Age verification (18+ check in step 2)
- [x] Rate limiting OTP (5 tentativi max)
- [x] OTP expiry (5 minuti)
- [x] Mock OTP log to console
- [x] Stripe-style dark mode UI
- [x] Progress bar visiva (3 step)
- [x] Toast notifications (error handling)
- [x] Auto-login post registrazione
- [x] Git commit (3 commits)
- [x] Vercel deploy (3 deploys)

---

## 🔮 Next Steps (Future)

### Phase 2: Identity Verification
- [ ] Upload documento (ID card, passport, patente)
- [ ] Manual review workflow (admin dashboard)
- [ ] Badge system (verified users)
- [ ] Set `User.identityVerified = true` dopo approval

### Phase 3: SMS Provider Integration
- [ ] Integrare Twilio/AWS SNS per invio OTP reale
- [ ] Rimuovere mock log to console
- [ ] Testare delivery rate e latency

### Phase 4: Middleware Optimization
- [ ] Cache onboarding status in JWT session
- [ ] Remove database query from middleware edge
- [ ] Add Redis/KV for session state

### Phase 5: Advanced Security
- [ ] Password reset via email
- [ ] Account recovery (forgot password)
- [ ] 2FA support (TOTP authenticator)
- [ ] Session management (active devices)

---

## 📞 Support

- **Errori TypeScript** sui nuovi model Prisma: Normale - risolti dopo `npx prisma generate` + build
- **Middleware performance:** Monitorare con Vercel Analytics (query latency)
- **OTP non arriva:** Check console logs (development mode)
- **Age verification fail:** Verifica birthDate format (ISO 8601 datetime string)

**Fine implementazione autenticazione proprietaria multi-step!** 🎉
