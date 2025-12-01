# Onboarding Semplificato - Piano Implementazione ✅

## ✅ Completato

### Onboarding 2-Step (Registrazione)
**Step 1: Email + Password**
- Form: email, password, checkbox termini
- API: `/api/auth/register`
- Redirect: `/onboarding/step-2`

**Step 2: Profilo Completo**
- Form: firstName, lastName, birthDate, **provincia**, city, gender, instagram, marketingOptIn
- API: `/api/onboarding/profile`
- Redirect: `/dashboard` ✅ **ONBOARDING COMPLETE**

### Database Changes
- ✅ `UserProfile.provincia` (String, sigla 2 caratteri: MI, RM, NA, etc.)
- ✅ File `lib/province-italiane.ts` con 107 province italiane
- ✅ `OnboardingProgress`: auto-complete step3 dopo step2

---

## 📋 TODO - Features Post-Login

### 1. Banner Richiesta Telefono (Post-Login)
**Quando:** Utente loggato senza telefono verificato
**Dove:** Banner persistente top/bottom dashboard
**Funzionalità:**
- Check: `User.phone === null || UserPhone.phoneVerified === false`
- Banner dismissable (con cookie/localStorage per non ripetere)
- CTA: "Verifica il tuo numero" → apre modal
- Modal: input telefono + invio OTP + verifica (stesso flow step-3 rimosso)

**API da usare (già esistenti):**
- `POST /api/phone/send-otp` ✅
- `POST /api/phone/verify-otp` ✅

**File da creare:**
- `components/phone-verification-banner.tsx`
- `components/phone-verification-modal.tsx`

---

### 2. Geolocalizzazione Browser (Post-Login)
**Quando:** Utente loggato senza geolocalizzazione salvata
**Dove:** Prompt one-time dopo primo accesso dashboard
**Funzionalità:**
- Check: `UserProfile.latitude === null || UserProfile.longitude === null`
- Browser API: `navigator.geolocation.getCurrentPosition()`
- Salva: lat, lng, accuracy in `UserProfile`
- Usa per: suggerimenti eventi vicini, filtro distanza

**Database Schema (da aggiungere):**
```prisma
model UserProfile {
  // ... existing fields
  latitude  Float?
  longitude Float?
  locationAccuracy Int? // meters
  locationUpdatedAt DateTime?
}
```

**File da creare:**
- `components/geolocation-prompt.tsx`
- `app/api/user/update-location/route.ts`

**Logica Eventi Vicini:**
```typescript
// Haversine formula per distanza
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  // ... calcolo distanza
  return distance; // km
}

// Query eventi entro raggio
const nearbyEvents = await prisma.event.findMany({
  where: {
    // Filter by city first (performance)
    venue: { city: userCity }
  }
}).filter(event => {
  const distance = getDistance(
    userLat, userLng, 
    event.venue.latitude, event.venue.longitude
  );
  return distance <= 50; // 50km radius
});
```

---

### 3. Verifica Identità (Documento)
**Quando:** Utente vuole diventare PR / Organizer / creare venue
**Dove:** Pagina dedicata `/verifica-identita` (già esistente!)
**Funzionalità:** ✅ **GIÀ IMPLEMENTATA**
- Upload documento (fronte + retro)
- Campo note opzionale
- Status: PENDING → APPROVED/REJECTED
- Admin review dashboard

**File esistenti:**
- `components/identity-verification-upload.tsx` ✅
- `components/identity-verification-status-checker.tsx` ✅
- `app/api/identity-verification/upload/route.ts` ✅
- Database: `IdentityVerification` model ✅

**Business Rules (lib/age-verification.ts):**
- Become PR: 18+ + identity verified ✅
- Create venue: 21+ + identity verified ✅
- Create organization: 18+ + identity verified ✅

**Next Actions:**
1. Creare link chiaro in dashboard: "Verifica Identità" button
2. Mostrare badge "Verified" su profilo dopo approval
3. Email notification dopo approval/rejection

---

### 4. Dashboard Layout Updates
**Aggiunte necessarie:**

**components/dashboard-layout.tsx:**
```tsx
import { PhoneVerificationBanner } from '@/components/phone-verification-banner';
import { GeolocationPrompt } from '@/components/geolocation-prompt';

export function DashboardLayout({ children }) {
  const { data: session } = useSession();
  
  return (
    <div>
      <PhoneVerificationBanner />
      <GeolocationPrompt />
      {children}
    </div>
  );
}
```

---

## 🔄 User Flow Completo (Nuovo)

```
1. REGISTRAZIONE
   ├─ /auth/register (Step 1)
   │  ├─ Email + Password + Terms
   │  └─ POST /api/auth/register → auto-login
   │
   ├─ /onboarding/step-2 (Step 2)
   │  ├─ Nome, Cognome, BirthDate
   │  ├─ Provincia + Città
   │  ├─ Gender, Instagram, Marketing
   │  └─ PATCH /api/onboarding/profile
   │     └─ onboardingComplete = true
   │
   └─ REDIRECT /dashboard ✅

2. POST-LOGIN (DASHBOARD)
   ├─ Banner: "Verifica il tuo telefono" (se phone = null)
   │  └─ Modal OTP → POST /api/phone/send-otp + verify
   │
   ├─ Prompt: "Abilita geolocalizzazione" (one-time)
   │  └─ Browser API → POST /api/user/update-location
   │
   └─ Button: "Verifica Identità" (per PR/Organizer)
      └─ /verifica-identita → upload documento

3. FUNZIONALITÀ SBLOCCATE
   ├─ Eventi vicini (geolocalizzazione)
   ├─ Notifiche SMS (telefono verificato)
   └─ PR/Organizer features (identity verified)
```

---

## 📊 Priorità Implementazione

### HIGH Priority (Settimana 1)
1. ✅ Onboarding 2-step (FATTO)
2. **Phone Verification Banner** (post-login)
   - `PhoneVerificationBanner.tsx`
   - `PhoneVerificationModal.tsx`
3. **Geolocation Prompt** (post-login)
   - `GeolocationPrompt.tsx`
   - Schema: UserProfile + lat/lng
   - API: `/api/user/update-location`

### MEDIUM Priority (Settimana 2)
4. **Dashboard Identity Verification Link**
   - Button prominente in dashboard
   - Badge "Verified" su profilo
5. **Eventi Vicini Algorithm**
   - Haversine distance calculation
   - Filter eventi entro 50km
   - Sort by distance

### LOW Priority (Backlog)
6. Email notifications (identity verification)
7. SMS notifications (telefono verificato)
8. Push notifications (browser)

---

## 🧪 Testing Checklist

### Registrazione Flow
- [ ] Step 1: email+password → auto-login → redirect step-2
- [ ] Step 2: form provincia dropdown (107 province)
- [ ] Step 2: submit → onboardingComplete=true → redirect /dashboard
- [ ] Database: UserProfile.provincia salvato correttamente

### Post-Login Features
- [ ] Banner telefono: mostra solo se phone=null
- [ ] Banner dismissable: cookie "phone_banner_dismissed"
- [ ] Modal OTP: send + verify + success → hide banner
- [ ] Geolocation: prompt browser → save lat/lng
- [ ] Eventi vicini: calcolo distanza corretto

### Identity Verification
- [ ] Upload documento: fronte + retro
- [ ] Admin dashboard: review PENDING
- [ ] Approval: set User.identityVerified=true
- [ ] Badge "Verified" visibile su profilo

---

## 📝 Code Snippets

### PhoneVerificationBanner Component
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import Cookies from 'js-cookie';

export function PhoneVerificationBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = Cookies.get('phone_banner_dismissed');
    setDismissed(!!isDismissed);
  }, []);

  if (!session?.user || session.user.phone || dismissed) return null;

  const handleDismiss = () => {
    Cookies.set('phone_banner_dismissed', 'true', { expires: 7 }); // 7 giorni
    setDismissed(true);
  };

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <p className="text-sm">
        📱 <strong>Verifica il tuo numero di telefono</strong> per ricevere notifiche e recuperare l'account
      </p>
      <div className="flex items-center gap-3">
        <button className="text-sm font-semibold hover:underline">
          Verifica ora
        </button>
        <button onClick={handleDismiss}>
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

### Geolocation API
```typescript
// app/api/user/update-location/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { latitude, longitude, accuracy } = await req.json();

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      latitude,
      longitude,
      locationAccuracy: accuracy,
      locationUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
```

---

## ✅ Summary

**Onboarding: 2-step completato** ✅
- Step 1: Email + Password
- Step 2: Profilo + **Provincia** + Città
- Redirect: Dashboard (no step 3)

**Next: 3 Features Post-Login**
1. Banner telefono (dismissable)
2. Geolocalizzazione (one-time prompt)
3. Verifica identità (link dashboard)

**Deploy:** Job `cN2nUEtbBu9koyGlYsZ5` ✅
