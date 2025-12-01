# Event App / EventIQ – Prompt Master

## 🔹 Contesto

Agisci come Lead Architect & AI Engineer incaricato di sviluppare l’app Event App / EventIQ, una piattaforma social per nightlife ed eventi basata su Next.js 15, TypeScript, Prisma, NextAuth e PostgreSQL.
L’app è già funzionante con onboarding 3-step e middleware Edge-safe; ora si evolve in un social completo.

### 🎯 Obiettivo finale

Trasformare l’app in una piattaforma social nightlife completa con:

- profili pubblici `/u/[username]`
- sistema di follow
- feed attività
- messaggistica e collaborazioni
- monetizzazione PR / badge / leaderboard
- moderazione e privacy
- UX mobile ottimizzata

## 🗓️ Roadmap tecnica

### 🧩 Milestone 0 – Stabilizzazione base (2 giorni)

Goal: rifinire middleware + onboarding helpers

- Refactor middleware per route-protection 3-step (Edge safe)
- Audit onboarding helpers
- Test unit (Vitest) + e2e (Playwright: register → step 3)

**Deliverable:** `middleware.ts`, `lib/onboarding-helpers.ts`, test spec.

### 🧩 Milestone 1 – Profili pubblici & API (5 giorni)

- Estendere `UserProfile` (bio, links, stats)
- API: `GET /api/user/profile` (privata), `GET /api/public/user/[username]` (pubblica)
- UI `/u/[username]`
- Test Zod, integration API, e2e public/private

### 🧩 Milestone 2 – Follow System (6 giorni)

- Prisma models `UserFollow`, `PageFollow`
- API: `POST/DELETE /api/social/follow`, `GET followers/following`
- UI `FollowButton` + count
- Test integration + rate-limit

### 🧩 Milestone 3 – Feed & Notifications (7 giorni)

- Model `Activity` / `FeedItem`
- API `GET /api/feed`, `GET /api/notifications`
- UI `FeedPage` + toast alerts
- Test feed update dopo follow

### 🧩 Milestone 4 – Messaging & Collaboration (7 giorni)

- Models `Conversation`, `Message`, `ConversationParticipant`
- API send/receive + UI chat component
- WebSocket stub + polling fallback
- E2E message flow tests

### 🧩 Milestone 5 – Monetizzazione & Gamification (6 giorni)

- Models `Wallet`, `Transaction`, `Referral`, `Badge`
- API wallet / referral / badge
- UI wallet dashboard + badge strip
- Test commission calc + audit log

### 🧩 Milestone 6 – Moderazione & Identity v2 (5 giorni)

- Models `Report`, `ModerationAction`, `BlockedUser`
- API report / block / admin
- UI privacy settings + report modals
- Security tests (auth bypass, ACL)

### 🧩 Milestone 7 – Mobile UX & Growth (5 giorni)

- Responsive polish + gesture nav
- Invite flow (PR referral SMS/WhatsApp)
- Push notifications (web + mobile)
- QA cross-device + Lighthouse > 90

## 🧪 Testing Policy

- Vitest unit per API schema
- Playwright e2e nightly
- Performance monitor (TTFB, LCP)
- Security rate-limit e auth checks

## ⚙️ Vincoli architetturali

- ❌ Nessuna query Prisma nel middleware (Edge safe)
- ✅ Usare `query-config.ts` per select standard
- ✅ Mantenere pattern file e routing esistente

## 📦 Deliverable finale

- Codice build-clean (`npm run lint && npm run build`)
- Test passanti (`npm run test:e2e`)
- Deploy Vercel stabile (hook `curl`)

## 🔧 Modalità Esecuzione

Copilot / GPT-5.1-Codex deve:

- leggere questo documento come contesto principale;
- generare codice milestone per milestone;
- evitare modifiche breaking;
- mantenere compatibilità Next.js 15.

## ▶️ Comandi operativi consigliati

```
# Esegui una milestone specifica
/run milestone 0
/run milestone 1
# …ecc.

# Test
npm run test
npm run test:e2e

# Deploy
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_XXXX"
```

## ✅ Procedura d’uso

1. Apri `docs/PROMPT_MASTER_EVENT_APP.md` in VS Code.
2. Avvia Copilot Chat → scrivi: “Leggi il file `PROMPT_MASTER_EVENT_APP.md` e inizia da Milestone 0.”
3. Controlla i file generati, poi passa a Milestone 1.
4. Dopo ogni milestone → esegui `npm run test:e2e`.

## ⚙️ Appendice – Milestone Runner (opzionale)

1. Crea il file `scripts/milestone-runner.js`:

	 ```bash
	 #!/usr/bin/env node
	 import { execSync } from "child_process";

	 const milestone = process.argv[2];
	 if (!milestone) {
	 	 console.error("❌ Devi specificare una milestone. Esempio: npm run milestone 1");
	 	 process.exit(1);
	 }

	 console.log(`🚀 Avvio Milestone ${milestone}...`);
	 try {
	 	 execSync(`gh copilot chat --prompt "Esegui Milestone ${milestone} seguendo PROMPT_MASTER_EVENT_APP.md"`, { stdio: "inherit" });
	 } catch (e) {
	 	 console.error("❌ Errore durante l'esecuzione della milestone:", e.message);
	 }
	 ```

2. Aggiungi allo `scripts` del `package.json`:

	 ```json
	 "milestone": "node scripts/milestone-runner.js"
	 ```

3. Lancia da terminale:

	 ```bash
	 npm run milestone 1
	 ```

💡 Questo legge il prompt master e avvia automaticamente la milestone richiesta tramite Copilot.

### Integrazione CI/CD (facoltativa)

- GitHub Actions: aggiungi un job che esegue `npm run milestone <n>` su branch dedicati o PR di feature; ricorda di configurare `gh auth login` con PAT e abilitare Copilot Chat in CI.
- Vercel Deploy Preview: puoi collegare Preview Hooks che lanciano `npm run milestone <n>` prima del build per generare automaticamente i deliverable della milestone.
