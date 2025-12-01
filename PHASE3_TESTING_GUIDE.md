# Phase 3 - Testing Guide

## Overview
Testing delle funzionalità di sicurezza e amministrazione implementate nella Phase 3:
- ✅ Protected Documents
- ✅ Rate Limiting
- ✅ Analytics Dashboard
- ✅ Batch Approval
- ✅ Auto-deletion Job

---

## Prerequisites

### 1. Crea utenti di test
```bash
# Admin user (già creato)
# Email: admin@panico.app
# Password: admin123

# User normale per test rate limiting
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: hashedPassword,
        role: 'USER',
        birthDate: new Date('2000-01-01'),
        ageVerified: true,
        ageConsent: true,
        userProfile: {
          create: {
            bio: 'Test user per rate limiting',
            isPublic: true
          }
        }
      }
    });
    
    console.log('✅ Test user creato!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  User già esistente');
    } else {
      console.error('❌ Errore:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
EOF
```

### 2. Verifica server in esecuzione
```bash
# Controlla che Next.js sia attivo
curl -I http://localhost:3000

# Se non risponde, avvia:
npm run dev
```

---

## Test 1: Protected Documents 🔒

### Obiettivo
Verificare che i documenti caricati siano accessibili solo tramite API protetta.

### Steps

#### 1.1 Login come admin
1. Vai su `http://localhost:3000/auth/signin`
2. Login: `admin@panico.app` / `admin123`
3. Vai su `http://localhost:3000/dashboard/verifica-identita`

#### 1.2 Verifica URL protetti
1. Apri DevTools (F12) → Network tab
2. Clicca su una verifica pending
3. Nel dialog, controlla che le immagini carichino da:
   - ✅ `/api/identity/document/[filename]`
   - ❌ NON `/uploads/identity/[filename]` (vecchio sistema)

#### 1.3 Test permessi
```bash
# Testa accesso diretto al file (deve fallire)
curl -I http://localhost:3000/uploads/identity/some-file.jpg
# Expected: 404 Not Found

# Testa API senza auth (deve fallire)
curl -I http://localhost:3000/api/identity/document/some-file.jpg
# Expected: 401 Unauthorized

# Testa con sessione valida (solo via browser logged in)
# Expected: 200 OK con immagine
```

#### 1.4 Verifica headers sicurezza
In DevTools → Network → Clicca su richiesta documento:
```
Cache-Control: private, max-age=3600
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Type: image/jpeg (o image/png)
```

**✅ Success Criteria:**
- Documenti non accessibili direttamente
- Serve API richiede autenticazione
- Solo owner/admin/security possono vedere
- Headers sicurezza presenti

---

## Test 2: Rate Limiting ⏱️

### Obiettivo
Verificare che l'upload sia limitato a 3/hour e 10/day.

### Steps

#### 2.1 Login come test user
1. Logout da admin
2. Login: `test@example.com` / `test123`
3. Vai su `http://localhost:3000/dashboard`

#### 2.2 Test limite orario (3/hour)
1. Vai al form verifica identità
2. Carica documento 3 volte (usa immagini diverse)
3. Al 4° tentativo dovresti vedere:
   ```
   ⚠️ Limite upload raggiunto
   Hai raggiunto il limite di 3 upload all'ora.
   Potrai caricare nuovi documenti tra: [HH:MM]
   ```

#### 2.3 Verifica headers rate limit
In DevTools → Network → Upload request:
```
X-RateLimit-Limit-Hourly: 3
X-RateLimit-Remaining-Hourly: 0
X-RateLimit-Reset-Hourly: [timestamp]
X-RateLimit-Limit-Daily: 10
X-RateLimit-Remaining-Daily: 7
```

#### 2.4 Test reset manuale (admin)
```bash
# Script per resettare rate limit
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { rateLimiter } = require('./lib/rate-limiter');

// Trova userId del test user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetLimits() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });
  
  if (user) {
    rateLimiter.resetIdentityUploadLimit(user.id);
    console.log('✅ Rate limits resettati per test@example.com');
  }
  
  await prisma.$disconnect();
}

resetLimits();
EOF
```

**✅ Success Criteria:**
- 4° upload bloccato con 429
- Alert UI mostra tempo reset
- Headers corretti
- Reset manuale funziona

---

## Test 3: Analytics Dashboard 📊

### Obiettivo
Verificare grafici e statistiche nella dashboard admin.

### Steps

#### 3.1 Crea dati di test
```bash
# Script per creare verifications di test
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@panico.app' }
  });
  
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });
  
  if (!testUser) {
    console.log('❌ Test user non trovato');
    return;
  }
  
  // Crea 5 verifications PENDING
  for (let i = 0; i < 5; i++) {
    await prisma.identityVerification.create({
      data: {
        userId: testUser.id,
        documentType: ['ID_CARD', 'PASSPORT', 'DRIVER_LICENSE'][i % 3],
        status: 'PENDING',
        frontImageUrl: '/uploads/test-front.jpg',
        backImageUrl: '/uploads/test-back.jpg'
      }
    });
  }
  
  // Crea 3 APPROVED
  for (let i = 0; i < 3; i++) {
    await prisma.identityVerification.create({
      data: {
        userId: testUser.id,
        documentType: 'ID_CARD',
        status: 'APPROVED',
        frontImageUrl: '/uploads/test-front.jpg',
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        frontImageUrl: '/uploads/test-front.jpg'
      }
    });
  }
  
  // Crea 2 REJECTED
  for (let i = 0; i < 2; i++) {
    await prisma.identityVerification.create({
      data: {
        userId: testUser.id,
        documentType: 'PASSPORT',
        status: 'REJECTED',
        frontImageUrl: '/uploads/test-front.jpg',
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        rejectionReason: i === 0 ? 'Documento sfocato' : 'Documento scaduto'
      }
    });
  }
  
  console.log('✅ Dati di test creati:');
  console.log('  - 5 PENDING');
  console.log('  - 3 APPROVED');
  console.log('  - 2 REJECTED');
  
  await prisma.$disconnect();
}

createTestData();
EOF
```

#### 3.2 Verifica Analytics
1. Login come admin
2. Vai su `http://localhost:3000/dashboard/verifica-identita`
3. Scroll alla sezione **Analytics**

#### 3.3 Controlla KPI Cards
- **Tasso di Approvazione**: ~60% (3 approved / 5 total)
- **Tempo Medio Revisione**: valore in ore
- **Totale Approvati**: 3
- **Totale Rifiutati**: 2

#### 3.4 Controlla Grafici
1. **Monthly Trend** (LineChart):
   - Linea blu: Approvati
   - Linea rossa: Rifiutati
   - Asse X: ultimi 6 mesi

2. **Status Distribution** (PieChart):
   - Verde: Approved
   - Giallo: Pending
   - Rosso: Rejected
   - Grigio: Expired

3. **Daily Activity** (BarChart):
   - Ultimi 7 giorni
   - Stacked bars (approved + rejected)

4. **Top Rejection Reasons**:
   - Progress bars con percentuali
   - "Documento sfocato" e "Documento scaduto"

#### 3.5 Test API direttamente
```bash
curl -s http://localhost:3000/api/identity/analytics \
  -H "Cookie: next-auth.session-token=..." | jq

# Expected output:
{
  "overall": {
    "total": 10,
    "pending": 5,
    "approved": 3,
    "rejected": 2,
    "expired": 0,
    "approvalRate": 60,
    "avgReviewTimeHours": 2.5
  },
  "monthly": [...],
  "daily": [...],
  "topRejectionReasons": [...]
}
```

**✅ Success Criteria:**
- KPI cards mostrano valori corretti
- 4 grafici renderizzano senza errori
- Dati consistenti con database
- Responsive su mobile

---

## Test 4: Batch Approval ✔️

### Obiettivo
Testare approvazione multipla (max 10).

### Steps

#### 4.1 Verifica UI Batch
1. Login come admin
2. Vai su `http://localhost:3000/dashboard/verifica-identita`
3. Scroll alla sezione **Richieste in Attesa**

#### 4.2 Test Selezione
1. Clicca checkbox su 3 verifications
2. Verifica che appaia bottone:
   ```
   ✓ Approva Selezionati (3)
   ```
3. Clicca "Select All" → tutte selezionate
4. Clicca "Deselect All" → tutte deselezionate

#### 4.3 Test Approvazione Batch
1. Seleziona 2-3 verifications
2. Clicca "Approva Selezionati"
3. Dialog di conferma mostra:
   - Lista utenti (nome + email)
   - Numero totale
   - Bottoni: Annulla / Conferma

4. Clicca "Conferma Approvazione"
5. Loading state → Success toast
6. Lista si aggiorna (verifications scompaiono)

#### 4.4 Verifica Email Inviate
```bash
# Controlla console del server (terminal npm run dev)
# Dovresti vedere:
✅ Batch approval completato:
  - Approvati: 3
  - Falliti: 0
  - Email inviate: 3
```

#### 4.5 Test Limite Max 10
```bash
# Script per creare 15 verifications pending
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function create15Pending() {
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });
  
  for (let i = 0; i < 15; i++) {
    await prisma.identityVerification.create({
      data: {
        userId: testUser.id,
        documentType: 'ID_CARD',
        status: 'PENDING',
        frontImageUrl: '/uploads/test-front.jpg'
      }
    });
  }
  
  console.log('✅ 15 pending verifications create');
  await prisma.$disconnect();
}

create15Pending();
EOF
```

1. Refresh dashboard
2. "Select All" (seleziona tutte le 15)
3. Clicca "Approva Selezionati"
4. Dovrebbe mostrare errore:
   ```
   ⚠️ Puoi approvare massimo 10 verifiche alla volta
   ```

#### 4.6 Verifica Audit Logs
```bash
# Controlla che ogni approvazione sia loggata
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'IDENTITY_APPROVED'
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });
  
  console.log('📋 Ultimi 10 audit logs:');
  logs.forEach(log => {
    console.log(`${new Date(log.createdAt).toLocaleString()} - ${log.user.name}: ${log.action}`);
  });
  
  await prisma.$disconnect();
}

checkAuditLogs();
EOF
```

**✅ Success Criteria:**
- Checkbox selection funziona
- Select all/deselect all ok
- Batch approve max 10
- Dialog conferma mostra lista
- Email inviate per ogni approvazione
- Audit logs creati
- UI refresh automatico

---

## Test 5: Cleanup Job 🗑️

### Obiettivo
Testare auto-deletion documenti >90 giorni.

### Steps

#### 5.1 Crea verifications scadute
```bash
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createExpiredVerifications() {
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@panico.app' }
  });
  
  // Verifica approvata 100 giorni fa (da eliminare)
  const old1 = await prisma.identityVerification.create({
    data: {
      userId: testUser.id,
      documentType: 'ID_CARD',
      status: 'APPROVED',
      frontImageUrl: '/uploads/old1-front.jpg',
      backImageUrl: '/uploads/old1-back.jpg',
      reviewedBy: admin.id,
      reviewedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
    }
  });
  
  // Verifica approvata 86 giorni fa (warning)
  const old2 = await prisma.identityVerification.create({
    data: {
      userId: testUser.id,
      documentType: 'PASSPORT',
      status: 'APPROVED',
      frontImageUrl: '/uploads/old2-front.jpg',
      reviewedBy: admin.id,
      reviewedAt: new Date(Date.now() - 86 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 86 * 24 * 60 * 60 * 1000)
    }
  });
  
  console.log('✅ Verifications scadute create:');
  console.log(`  - ${old1.id} (100 giorni fa - DA ELIMINARE)`);
  console.log(`  - ${old2.id} (86 giorni fa - WARNING)`);
  
  await prisma.$disconnect();
}

createExpiredVerifications();
EOF
```

#### 5.2 Esegui Cleanup Manualmente
```bash
cd "/Users/andreagranata/Desktop/APP/PANICO APP"
node scripts/cleanup-expired-documents.ts
```

Expected output:
```
🧹 Inizio cleanup documenti scaduti...

📧 Invio warning per verifica xxx (6 giorni rimanenti)
✅ Warning inviato a test@example.com

🗑️  Eliminazione verifica yyy (scaduta da 10 giorni)
✅ File eliminato: /uploads/old1-front.jpg
✅ File eliminato: /uploads/old1-back.jpg
✅ Verifica marcata come EXPIRED

📊 Cleanup completato:
  - Warnings inviati: 1
  - Documenti eliminati: 1
  - Errori: 0
```

#### 5.3 Verifica Email Warning
Controlla console server (se RESEND_API_KEY configurato):
```
📧 Email inviata a test@example.com:
   Subject: I tuoi documenti verranno eliminati tra 6 giorni
   Template: warning-gradient
```

#### 5.4 Verifica Database
```bash
cd "/Users/andreagranata/Desktop/APP/PANICO APP" && node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExpired() {
  const expired = await prisma.identityVerification.findMany({
    where: { status: 'EXPIRED' },
    select: {
      id: true,
      user: { select: { email: true } },
      deletionScheduledFor: true,
      deletedAt: true
    }
  });
  
  console.log('📋 Verifications EXPIRED:');
  expired.forEach(v => {
    console.log(`  - User: ${v.user.email}`);
    console.log(`    Scheduled: ${v.deletionScheduledFor?.toLocaleDateString()}`);
    console.log(`    Deleted: ${v.deletedAt?.toLocaleDateString() || 'N/A'}`);
  });
  
  await prisma.$disconnect();
}

checkExpired();
EOF
```

#### 5.5 Test API Cleanup (Admin)
```bash
# Login come admin, poi:
curl -X POST http://localhost:3000/api/identity/cleanup \
  -H "Cookie: next-auth.session-token=..." | jq

# Expected:
{
  "success": true,
  "warned": 1,
  "deleted": 1,
  "errors": []
}
```

#### 5.6 Setup Cron Job (Production)
```bash
# Aggiungi a crontab (solo produzione):
crontab -e

# Aggiungi:
0 2 * * * cd /path/to/app && node scripts/cleanup-expired-documents.ts >> /var/log/cleanup.log 2>&1
```

**✅ Success Criteria:**
- Script identifica verifications >90 giorni
- Warning email inviati 7 giorni prima
- File eliminati da filesystem
- Status aggiornato a EXPIRED
- API cleanup funziona
- Cron job configurabile

---

## Test Completo E2E 🎯

### Scenario Completo
1. **User registra** → Upload documento
2. **Rate limit** → Blocca dopo 3 upload
3. **Admin approva batch** → Seleziona 3, conferma
4. **Analytics** → Verifica grafici aggiornati
5. **Cleanup** → Dopo 90 giorni, documenti eliminati

### Script Test Completo
```bash
cd "/Users/andreagranata/Desktop/APP/PANICO APP"

# 1. Reset database test
npm run db:reset

# 2. Seed dati
npm run db:seed

# 3. Crea test data
node scripts/create-test-verifications.js

# 4. Avvia server
npm run dev

# 5. Apri browser
open http://localhost:3000/dashboard/verifica-identita
```

---

## Checklist Finale ✅

Prima di considerare Phase 3 completa:

- [ ] Protected documents accessibili solo con permessi
- [ ] Rate limiting blocca dopo 3/hour e 10/day
- [ ] Headers X-RateLimit-* corretti
- [ ] Analytics dashboard mostra 4 grafici
- [ ] KPI cards con valori accurati
- [ ] Batch approval max 10 funziona
- [ ] Confirmation dialog mostra lista
- [ ] Email inviate per ogni approvazione
- [ ] Audit logs creati
- [ ] Cleanup job elimina >90 giorni
- [ ] Warning email 7 giorni prima
- [ ] API /api/identity/cleanup funziona
- [ ] UI responsive su mobile
- [ ] Nessun errore TypeScript
- [ ] Nessun errore console browser

---

## Troubleshooting 🔧

### Problema: Documenti non caricano
```bash
# Verifica permessi file
ls -la uploads/identity/

# Verifica sessione
# DevTools → Application → Cookies → next-auth.session-token
```

### Problema: Rate limit non funziona
```bash
# Verifica in-memory store
node -e "
const { rateLimiter } = require('./lib/rate-limiter');
console.log(rateLimiter);
"
```

### Problema: Grafici non renderizzano
```bash
# Verifica Recharts installato
npm list recharts

# Se mancante:
npm install recharts
```

### Problema: Email non inviate
```bash
# Verifica RESEND_API_KEY
echo $RESEND_API_KEY

# Test Resend
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

---

## Metriche di Successo 📈

**Performance:**
- Document API response: <100ms
- Analytics API: <500ms
- Batch approval (5 items): <2s

**Sicurezza:**
- 0 documenti accessibili senza auth
- 100% rate limit enforcement
- Tutti audit logs registrati

**UX:**
- Batch selection: <3 click
- Analytics loading: <1s
- Email delivery: <5s

---

## Next Steps dopo Testing 🚀

Una volta completati tutti i test:

1. **Documentazione:**
   - Crea PHASE3_COMPLETED.md
   - Aggiorna README.md
   - Documenta API endpoints

2. **Production Deployment:**
   - Setup Redis per rate limiting (se multi-instance)
   - Configura RESEND_API_KEY
   - Setup cron job cleanup
   - Monitoring alerts

3. **Phase 4 (se pianificata):**
   - Multi-role permission system
   - PageCollaborator models
   - RBAC helpers

---

**Data Testing:** 21 novembre 2025  
**Tester:** Admin  
**Environment:** Development (localhost:3000)
