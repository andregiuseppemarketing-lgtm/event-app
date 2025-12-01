# 📊 RESOCONTO TECNICO COMPLETO - PANICO APP

**Data:** 27 Novembre 2025  
**Sviluppatore:** Andrea Granata  
**Stack:** Next.js 15 + TypeScript + Prisma + PostgreSQL + NextAuth v4

---

## 🎯 OBIETTIVO PROGETTO

Piattaforma social nightlife multi-ruolo dove 1 User = N Roles (User + PR + Artist + Venue Manager + Org Owner simultaneamente).

**Design System:** Stripe-inspired dark mode con gradients, glassmorphism, spacing perfetto.

---

## ✅ LAVORO COMPLETATO FINO AD OGGI

### **1. ARCHITETTURA DATABASE (Prisma + PostgreSQL)**

#### **Schema Models Implementati:**
```prisma
- User (base account con multi-role)
  ├─ UserProfile (pubblico: city, provincia, gender, instagram)
  ├─ UserConsent (GDPR: terms, privacy, marketing)
  ├─ OnboardingProgress (tracker step registrazione)
  ├─ UserPhone (telefono + OTP verification)
  ├─ PRProfile (referralCode, stats)
  ├─ ArtistProfile (DJ/vocalist/producer)
  └─ OrganizationProfile (promoter/brand)

- Event (status, dateStart, minAge, venueId)
- Ticket (code 8-char, QR, status tracking)
- ListEntry (guest list con status PENDING/CONFIRMED/REJECTED/CHECKED_IN)
- Club/Venue (separati, Club owns multiple Venues)
```

#### **Age Verification System:**
- Campi: `birthDate`, `age` (calcolato), `ageVerified`, `identityVerified`
- Business Rules (`lib/age-verification.ts`):
  - Registrazione: 18+ obbligatorio
  - Join event list: 18+ + identity verified + event age range check
  - Purchase ticket: 18+ + identity verified
  - Diventare PR: 18+ + identity verified
  - Create venue: 21+ + identity verified
  - Create organization: 18+ + identity verified

---

### **2. SISTEMA AUTENTICAZIONE PROPRIETARIO**

#### **Rimozione OAuth (Completata):**
- ❌ Rimosso Google, Facebook, Instagram OAuth
- ✅ Sistema 100% credentials-based (email + password)
- ✅ NextAuth v4 con JWT strategy (no database sessions)

#### **Onboarding 2-Step:**

**Step 1: Email + Password**
- File: `app/auth/register/page.tsx`
- API: `POST /api/auth/register`
- Validazione: `RegisterStepOneSchema` (Zod)
- Input: `email`, `password`, `termsAccepted`, `privacyAccepted`
- Output: 
  - Crea `User` (minimal: email + passwordHash)
  - Crea `UserConsent` (timestamp consensi)
  - Crea `OnboardingProgress` (currentStep=2, step1Completed=true)
  - Auto-login con `signIn('credentials')`
  - Redirect: `/onboarding/step-2`

**Step 2: Profilo Completo**
- File: `app/onboarding/step-2/page.tsx`
- API: `PATCH /api/onboarding/profile`
- Validazione: `RegisterStepTwoSchema` (Zod)
- Input: 
  - `firstName`, `lastName`, `birthDate` (con validazione 18+)
  - `provincia` (107 province italiane da `lib/province-italiane.ts`)
  - `city`, `gender`, `instagramHandle`, `marketingOptIn`
- Output:
  - Update `User` (nome, cognome, birthDate, age, ageVerified=true)
  - Update/Create `UserProfile` (city, provincia, gender, instagram)
  - Update `UserConsent` (marketingOptIn)
  - Update `OnboardingProgress` (currentStep=3, step2Completed=true, onboardingComplete=true)
  - Redirect: `/dashboard` ✅ **ONBOARDING COMPLETO**

**Step 3: Phone Verification (Post-Login)**
- File: `app/onboarding/step-3/page.tsx` (creato ma NON usato in flow principale)
- API: 
  - `POST /api/phone/send-otp` (genera OTP 6 cifre)
  - `POST /api/phone/verify-otp` (valida OTP)
- **NOTA:** Step 3 spostato post-login come feature opzionale (banner dashboard)

---

### **3. PAGINA PROFILO UTENTE (APPENA COMPLETATA)**

#### **Route:** `/user/profilo`
**File:** `app/user/profilo/page.tsx` (357 righe)

**Design Stripe-Style Mobile-First:**

**Header Sticky:**
- Campanella notifiche (sinistra, 7x7)
- Logo "EVENT" centrato assoluto (text-2xl, gradiente)
- Hamburger menu (destra, 3 linee 7/9/7)

**Sezione Profilo:**
1. **Foto 3:4 ratio** (24x32, border gradiente 4px, stella button 7x7 bottom-right)
2. **Nome + Cognome** (22px, gradiente primary→accent, Edit icon inline)
3. **Username** (14px, ChevronDown icon, mt-1 spacing da nome)

**Stats Row (4 elementi):**
- **Box Eventi:** 150x26px, gradient purple→cyan, icon 15x15, gap-1.5, px-2.5
  - Testo: "42 presenze eventi" (17px numero, 8.5px labels)
- **Follower:** Text-only, 17.5px numeri, 11.25px label
- **Seguiti:** Text-only, 17.5px numeri, 11.25px label
- **Box Info:** 150x26px, gradient cyan→purple, icon 15x15, gap-1.5, px-2.5
  - Testo: "INFO" (17px)

**Bio Section:**
- Ruoli con handle clickabili (leading-none, space-y-0, Instagram-style)
- Testo bio (12px, mt-1, leading-tight)
- Esempi:
  ```
  Founder @Sudcafè / @Sudinthecity
  Founder @PanicoGroup
  PR @FonzieEventi
  DJ @FonzieMusic
  ```

**Bottom Navigation (Fixed):**
- 4 icone: Profilo (gradient), Eventi (eye), Search, QR Scanner
- Icone 7x7, padding 3, gap centered

**Ottimizzazioni Effettuate (Iterative):**
- ✅ Header elements enlarged (+25%)
- ✅ Mobile optimization (-33% tutti elementi)
- ✅ Header re-enlarged selettivamente
- ✅ Spacing bio minimizzato (Instagram-style)
- ✅ Follower/Seguiti increased (+25%)
- ✅ Nome/Username spacing ottimizzato (da -mt-4 a mt-1)
- ✅ Box Eventi compattato (gap ridotto, icon 15x15)
- ✅ Box uniformati (entrambi gap-1.5, px-2.5)

**Layout Hierarchy:**
```
Container: max-w-2xl, px-4, py-6 (NO space-y-4 per controllo granulare)
  ├─ Foto: mb-4
  ├─ Nome: (default spacing)
  ├─ Username: mt-1
  ├─ Stats Row: mt-4
  └─ Bio: mt-6
```

---

### **4. PERFORMANCE & OTTIMIZZAZIONI**

#### **Bundle Optimization:**
```js
// next.config.mjs
optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'recharts']
```

#### **Query Optimization (`lib/query-config.ts`):**
- Preset `userSelect`, `eventSelect`, `ticketSelect` (solo campi necessari)
- `getPaginationOptions(page, pageSize)` helper
- React Query: 5min stale time, 10min garbage collection

#### **Performance Monitoring (`lib/performance-monitor.ts`):**
- Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
- Alerts: TTFB > 1s, memory > 100MB, render > 50ms

#### **Caching:**
- Static assets: `max-age=31536000, immutable`
- API routes: `no-store, max-age=0`
- Image optimization: AVIF/WebP formats

---

### **5. FILE STRUTTURA CODEBASE**

#### **Core Logic:**
```
lib/
├─ auth.ts              (NextAuth config, JWT strategy, role management)
├─ age-verification.ts  (18+/21+ verification helpers)
├─ api.ts               (API helpers: requireAuth, createApiResponse, audit logging)
├─ prisma.ts            (Singleton Prisma client)
├─ validations.ts       (Zod schemas: RegisterStepOne/Two, OTP, etc.)
├─ query-config.ts      (Prisma selects, React Query keys)
├─ province-italiane.ts (107 province italiane con sigla)
└─ ticket-code-generator.ts (QR generation)
```

#### **API Routes:**
```
app/api/
├─ auth/
│  └─ register/route.ts         (POST - Step 1)
├─ onboarding/
│  └─ profile/route.ts          (PATCH - Step 2)
├─ phone/
│  ├─ send-otp/route.ts         (POST - Invia OTP)
│  └─ verify-otp/route.ts       (POST - Valida OTP)
└─ [...altri endpoints eventi, ticket, lista]
```

#### **Pages:**
```
app/
├─ page.tsx                     (Homepage - DA IMPLEMENTARE)
├─ auth/
│  ├─ login/page.tsx            (✅ Login credentials)
│  └─ register/page.tsx         (✅ Step 1 registrazione)
├─ onboarding/
│  ├─ step-2/page.tsx           (✅ Profilo completo)
│  └─ step-3/page.tsx           (✅ Phone verification - opzionale)
├─ user/
│  └─ profilo/page.tsx          (✅ Pagina profilo mobile-first)
├─ dashboard/
│  └─ [varie sezioni]           (Dashboard - DA MIGLIORARE)
└─ [...altri]
```

#### **Middleware:**
```typescript
// middleware.ts
- Auth protection con withAuth
- Onboarding check (redirect se non completo)
- Age verification checks
- Protected routes: /dashboard/*, /eventi/*, /lista/*
```

---

### **6. DESIGN SYSTEM (Tailwind + Custom CSS)**

#### **Color Palette:**
```css
--primary: 199 89% 48%        /* #06B6D4 Cyan */
--accent: 271 81% 56%         /* #A855F7 Purple */
--background: #09090B         /* Zinc-950 */
--foreground: #FAFAFA         /* Zinc-50 */
--border: rgba(255,255,255,0.1)
```

#### **Gradient Pattern:**
```tsx
// Primary gradient (cyan → purple)
className="bg-gradient-to-r from-primary to-accent"

// Reverse (purple → cyan)
className="bg-gradient-to-r from-accent to-primary"

// Text gradient
className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
```

#### **Card Pattern (Glassmorphism):**
```tsx
<div className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 shadow-xl shadow-black/20">
  {/* content */}
</div>
```

#### **Spacing Guidelines:**
- Gap standard: `gap-4`, `gap-6`
- Padding cards: `p-6`, `px-4 py-3`
- Margin top sections: `mt-4`, `mt-6`
- Borders: `rounded-lg`, `rounded-xl`

---

### **7. GDPR COMPLIANCE**

**Files:**
- `lib/gdpr-consent.ts` (consent tracking)
- `lib/gdpr-export.ts` (data export JSON)
- `lib/gdpr-deletion.ts` (soft delete 30-day grace)

**Models:**
- `UserConsent` (terms, privacy, marketing timestamps)
- `AuditLog` (log sensitive actions)

---

### **8. DEPLOYMENT & CI/CD**

**Platform:** Vercel
**Database:** Neon PostgreSQL

**Deploy Workflow:**
```bash
git add -A
git commit -m "message"
git push origin main
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_JwgJU0aXmdJ5YNQTKBmTZvBSAmMa/AO2LkqKaXI"
```

**Environment Variables (.env):**
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 🚧 LAVORO DA COMPLETARE

### **PRIORITÀ ALTA (Flusso Utente Lineare):**

#### **A. Homepage Landing Page** 🏠
**File da creare:** `app/page.tsx`

**Obiettivo:** Landing hero che guida verso registrazione

**Elementi necessari:**
- Hero section con gradiente animato
- CTA principale: "Registrati Gratis" → `/auth/register`
- CTA secondario: "Accedi" → `/auth/login`
- Sezione features (3-4 cards):
  - 🎉 Eventi esclusivi
  - 👤 Sistema PR referral
  - 🎟️ Ticketing integrato
  - 📊 Analytics real-time
- Footer con link Privacy Policy, Terms, Cookie Policy

**Design Reference:** Stripe-style hero con gradienti animati, glassmorphism cards

---

#### **B. Smart Redirect Post-Login** 🔄
**File da modificare:** `middleware.ts`

**Logica da implementare:**
```typescript
// Dopo login, check onboarding status
if (session && !session.user.onboardingComplete) {
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: session.user.id }
  });
  
  if (!progress?.step2Completed) {
    return NextResponse.redirect('/onboarding/step-2');
  }
  
  // Se step2 completo ma flag non settato → fix e redirect dashboard
  if (progress?.step2Completed && !session.user.onboardingComplete) {
    await updateSessionOnboardingFlag(session.user.id);
    return NextResponse.redirect('/dashboard');
  }
}

// Se onboarding completo → dashboard
if (isProtectedRoute && session) {
  return NextResponse.redirect('/dashboard');
}
```

---

#### **C. Dashboard Welcome State** 👋
**File da modificare:** `app/dashboard/page.tsx`

**Features da aggiungere:**
1. **Banner "Benvenuto {firstName}"** (first login flag)
2. **Phone Verification Prompt** (se `user.phone === null`):
   ```tsx
   <Alert variant="warning">
     📱 Verifica il tuo numero di telefono per sbloccare tutte le funzionalità
     <Button onClick={() => openPhoneModal()}>Verifica ora</Button>
   </Alert>
   ```
3. **Quick Actions Cards:**
   - 🎉 Trova eventi vicino a te
   - 👤 Diventa PR e guadagna
   - ✏️ Completa il tuo profilo

---

#### **D. Protected Routes Enhancement** 🔒
**File:** `middleware.ts`

**Routes da proteggere con logica specifica:**
```typescript
const protectedRoutes = {
  '/dashboard/*': { 
    auth: true, 
    onboarding: true 
  },
  '/eventi/*': { 
    auth: true, 
    onboarding: false  // Can browse even if onboarding incomplete
  },
  '/lista/*': { 
    auth: true, 
    role: 'PR',  // Only PRs can manage lists
    onboarding: true 
  },
  '/user/profilo': { 
    auth: true, 
    onboarding: true 
  },
  '/venues/*': {
    auth: true,
    role: 'ORGANIZER',
    age: 21  // Must be 21+ and identity verified
  }
}
```

---

### **PRIORITÀ MEDIA:**

#### **E. Phone Verification Modal (Dashboard)**
- Componente: `components/phone-verification-modal.tsx`
- Trigger: Banner in dashboard se `user.phone === null`
- Flow: Input phone → Send OTP → Verify OTP → Success toast
- API: Riusa `/api/phone/send-otp` e `/api/phone/verify-otp` esistenti

#### **F. Profile Completion Percentage**
- Helper: `lib/profile-completion.ts`
- Calcolo: (campi compilati / campi totali) × 100
- Display: Progress bar in `/user/profilo` header
- Incentivo: "Completa il profilo al 100% per sbloccare badge"

#### **G. Social Features (Fase 5 - Pianificata)**
- Follower/Following system (già struttura DB)
- Feed contenuti (post, stories)
- Badge verified users

---

### **PRIORITÀ BASSA:**

#### **H. Multi-Role Permission System (Fase 5)**
- `PageCollaborator` models (Venue, Organization, Event)
- RBAC helpers (OWNER, CO_OWNER, COLLABORATOR levels)
- Role switcher UI (dropdown header con ruoli attivi)

#### **I. Public Profile Pages**
- `/venue/[id]` - Pagina pubblica club
- `/organization/[id]` - Pagina brand/promoter
- `/artist/[id]` - Pagina DJ/artist
- `/profile/[username]` - Profilo pubblico user
- SEO optimization (metadata, OG tags)

---

## 📋 SCHEMA ESECUZIONE LAVORI PROPOSTO

### **SPRINT 1: Flusso Utente Base (3-5 giorni)**
**Obiettivo:** User può registrarsi, completare onboarding, vedere dashboard funzionale

**Tasks:**
1. ✅ **Homepage Landing** (1 giorno)
   - Creare `app/page.tsx` con hero + CTA
   - Sezione features (3 cards)
   - Footer con link legali

2. ✅ **Smart Redirect** (0.5 giorni)
   - Migliorare logica `middleware.ts`
   - Test flow: register → step2 → dashboard
   - Edge cases: onboarding interrotto, flag inconsistenti

3. ✅ **Dashboard Welcome** (1 giorno)
   - Banner benvenuto first-time users
   - Phone verification prompt
   - Quick actions cards

4. ✅ **Protected Routes** (0.5 giorni)
   - Definire route protection config
   - Implementare role-based checks
   - Age verification checks

5. ✅ **Testing E2E** (1 giorno)
   - Test registrazione completa
   - Test login → dashboard redirect
   - Test onboarding interruption/resume

---

### **SPRINT 2: User Experience Polish (2-3 giorni)**
**Obiettivo:** UX smooth, feedback visivi, profile completion

**Tasks:**
1. ✅ **Phone Modal** (1 giorno)
   - Componente modal phone verification
   - Integrazione API OTP esistenti
   - Success/error states

2. ✅ **Profile Completion** (1 giorno)
   - Helper calcolo percentuale
   - Progress bar in `/user/profilo`
   - Tooltip campi mancanti

3. ✅ **Loading States** (0.5 giorni)
   - Skeleton screens onboarding
   - Loading spinners API calls
   - Optimistic updates

4. ✅ **Error Handling** (0.5 giorni)
   - Toast notifications uniformi
   - Error boundaries
   - Retry logic API failures

---

### **SPRINT 3: Features Avanzate (5-7 giorni)**
**Obiettivo:** Eventi, ticketing, liste ospiti

**Tasks:**
1. ⏳ **Eventi Browse/Detail** (2 giorni)
   - Lista eventi con filtri (città, data, tipo)
   - Pagina dettaglio evento
   - Join lista ospiti flow

2. ⏳ **Ticketing System** (2 giorni)
   - Purchase ticket flow
   - QR code generation
   - Ticket wallet (my tickets)

3. ⏳ **PR Dashboard** (2 giorni)
   - Referral link generation
   - Stats tracking (invitati, check-in)
   - Commission dashboard

---

### **SPRINT 4: Admin & Analytics (3-5 giorni)**
**Obiettivo:** Strumenti organizzatori, analytics, check-in

**Tasks:**
1. ⏳ **Check-in Dashboard** (2 giorni)
   - QR scanner integration
   - Real-time check-in stats
   - Guest list management

2. ⏳ **Event Analytics** (2 giorni)
   - Grafici presenze (gender, age, time)
   - PR performance comparison
   - Export CSV reports

3. ⏳ **Venue/Organization Management** (1 giorno)
   - CRUD venues
   - Organization profiles
   - Collaborator invites

---

## 🔧 STACK TECNICO DETTAGLIATO

### **Frontend:**
- **Framework:** Next.js 15.1.0 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x + Custom CSS variables
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** lucide-react
- **Forms:** react-hook-form + Zod validation
- **State Management:** React Query (TanStack Query)
- **Auth:** NextAuth v4 (JWT strategy)

### **Backend:**
- **Runtime:** Node.js (Vercel serverless)
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL (Neon)
- **Validation:** Zod
- **Password Hashing:** bcryptjs (12 rounds)
- **QR Codes:** qrcode library

### **DevOps:**
- **Hosting:** Vercel (production)
- **Database:** Neon PostgreSQL (cloud)
- **Git:** GitHub (andregiuseppemarketing-lgtm/EventIQ)
- **CI/CD:** Vercel auto-deploy + manual webhook trigger
- **Monitoring:** Performance Monitor (`lib/performance-monitor.ts`)

### **Testing:**
- **E2E:** Playwright (configurato in `playwright.config.ts`)
- **Unit:** Vitest (configurato in `vitest.config.ts`)

---

## 📊 METRICHE PROGETTO ATTUALI

**Righe di Codice:** ~15,000+ (stimato)

**File Chiave:**
- Database Schema: `prisma/schema.prisma` (~800 righe)
- Pagine: ~20 route pages
- API Endpoints: ~30 routes
- Componenti UI: ~50 components
- Helpers/Utils: ~15 files

**Database:**
- Models: 25+ tabelle
- Relazioni: ~40 foreign keys
- Indexes: Ottimizzati su foreign keys, status, dates, codes

**Performance Target:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- TTFB < 600ms

---

## 🎨 DESIGN PRINCIPLES

1. **Mobile-First:** Tutte le UI partono da design mobile (375px)
2. **Dark Mode Only:** No light mode (brand identity)
3. **Gradients Everywhere:** Primary/Accent gradient come signature
4. **Glassmorphism:** Card semi-transparent con blur backdrop
5. **Perfect Spacing:** Sistema 4px base (gap-1/2/3/4/6)
6. **Minimal Line Height:** leading-tight/none per compattezza (Instagram-style)
7. **Hover States:** Scale, shadow glow, opacity transitions
8. **Accessibility:** Min 44px tap targets, ARIA labels

---

## 📝 NOTE TECNICHE IMPORTANTI

### **NextAuth v4 (NON v5):**
- ❌ Non usare `auth()` da next-auth (API v5)
- ✅ Usare `getServerSession(authConfig)` (API v4)
- JWT strategy, no database sessions
- Session include: `user.id`, `user.role`, `user.age`, `user.identityVerified`

### **Prisma Best Practices:**
- Sempre usare `select` presets da `lib/query-config.ts`
- Transaction per operazioni multi-model
- Indexes su: foreign keys, status fields, date fields, unique codes

### **Performance:**
- Lazy load componenti pesanti (QR scanner, charts)
- Image optimization: next/image con AVIF/WebP
- Bundle analysis: `optimizePackageImports` in next.config

### **Security:**
- Password min 8 chars, 1 uppercase, 1 lowercase, 1 numero
- OTP 6 cifre, expiry 10 minuti, max 5 tentativi
- JWT secret in env, rotation recommended ogni 90 giorni
- GDPR compliance: soft delete 30 giorni, data export JSON

---

## 🚀 COMANDI SVILUPPO

```bash
# Development
npm run dev              # Dev server Turbopack (port 3000)

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Create migration (prod)
npm run db:seed          # Seed demo data

# Build & Deploy
npm run build            # Production build
npm run lint             # ESLint check
npm run typecheck        # TypeScript validation

# Testing
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests

# Deploy
git push origin main
curl -X POST "https://api.vercel.com/v1/integrations/deploy/..."
```

---

## 📚 DOCUMENTAZIONE RIFERIMENTO

**File Markdown Esistenti:**
- `AUTH_PROPRIETARY_COMPLETED.md` - Sistema auth proprietario
- `ONBOARDING_2_STEP_PLAN.md` - Piano onboarding semplificato
- `PHASE1_COMPLETED.md` - Fase 1 database extension
- `PERFORMANCE_OPTIMIZATIONS.md` - Ottimizzazioni bundle/query
- `PERFORMANCE_MONITORING.md` - Setup monitoring Core Web Vitals
- `ROLES_AND_PERMISSIONS.md` - Sistema multi-ruolo
- `GDPR_*` - GDPR compliance docs

---

## ✅ CHECKLIST COMPLETAMENTO FASI

### **Fase 1: Foundation** ✅
- [x] Database schema multi-role
- [x] Age verification system
- [x] Auth proprietario (no OAuth)
- [x] Onboarding 2-step
- [x] Performance optimization
- [x] GDPR compliance

### **Fase 2: User Journey** 🚧 IN CORSO
- [ ] Homepage landing page
- [ ] Smart redirect post-login
- [ ] Dashboard welcome state
- [ ] Protected routes enhancement
- [x] Pagina profilo mobile-first ✅

### **Fase 3: Core Features** ⏳
- [ ] Eventi browse/detail
- [ ] Ticketing system
- [ ] Guest list management
- [ ] PR dashboard

### **Fase 4: Advanced** ⏳
- [ ] Check-in system
- [ ] Analytics dashboard
- [ ] Venue/Organization management

### **Fase 5: Social** ⏳
- [ ] Follow system
- [ ] Feed contenuti
- [ ] Public profiles
- [ ] Multi-role switcher

---

## 🎯 PROSSIMI STEP IMMEDIATI

**Priorità 1:** Homepage Landing Page (`app/page.tsx`)
**Priorità 2:** Smart Redirect (`middleware.ts`)
**Priorità 3:** Dashboard Welcome (`app/dashboard/page.tsx`)

**Tempo stimato:** 3-5 giorni per completare Sprint 1

---

**Fine Resoconto Tecnico**  
**Ultimo aggiornamento:** 27 Novembre 2025  
**Versione:** 1.0
