# Event App – Social Nightlife Platform

Event App (ex Panico App) è una piattaforma social per la nightlife che combina gestione eventi, ruoli multi-utente e funzionalità social. L’architettura è basata su **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, **NextAuth (JWT)** e **PostgreSQL**, con UI completamente dark-mode realizzata con **TailwindCSS + shadcn/ui**. Il progetto supporta un ecosistema multi-ruolo (utente, PR, artisti, venue manager) e una pipeline AI per lo sviluppo milestone-driven.

## Package.json aggiornato

```json
{
  "name": "event-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run --coverage",
    "test:e2e": "playwright test",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force && npm run db:seed",
    "db:seed": "ts-node prisma/seed.ts",
    "postinstall": "prisma generate",
    "clean": "rm -rf .next node_modules/.cache",
    "vercel-build": "prisma generate && next build",
    "milestone": "node scripts/milestone-runner.js",
    "deploy": "curl -X POST 'https://api.vercel.com/v1/integrations/deploy/prj_XXXX'"
  }
}
```

### Comandi principali

- **type**: `module` abilita gli import ES nativi.
- **dev / build / start**: ciclo Next.js classico (dev server, build, esecuzione prod).
- **lint**: ESLint con config Next per garantire qualità del codice.
- **test / test:e2e**: Vitest (unit+coverage) e Playwright (E2E) integrati.
- **db:push / db:studio / db:reset / db:seed**: suite Prisma per gestire schema, studio, reset seed.
- **postinstall / vercel-build**: generazione Prisma obbligatoria per CI/CD.
- **milestone**: runner AI che produce prompt automatici (vedi sezione dedicata).
- **deploy**: hook Vercel per triggerare una nuova build (sostituire `prj_XXXX`).

## Tabella comandi npm

| Scopo                              | Comando                 |
| ---------------------------------- | ----------------------- |
| Avvio locale con Turbopack         | `npm run dev`           |
| Build produzione + Prisma generate | `npm run build`         |
| Avvio produzione (Next start)      | `npm run start`         |
| Linting ESLint                     | `npm run lint`          |
| Unit test + coverage               | `npm run test`          |
| Playwright E2E suite               | `npm run test:e2e`      |
| Push schema al DB (dev)            | `npm run db:push`       |
| Studio Prisma                      | `npm run db:studio`     |
| Reset DB + seed                    | `npm run db:reset`      |
| Seed manuale                       | `npm run db:seed`       |
| Pulizia cache build                | `npm run clean`         |
| Generazione prompt milestone       | `npm run milestone <n>` |
| Deploy Vercel (hook)               | `npm run deploy`        |

## Milestone Runner

Il file `scripts/milestone-runner.js` (Advanced Milestone Runner v2.0) genera automaticamente un prompt completo per ogni milestone definita in `docs/PROMPT_MASTER_EVENT_APP.md` e lo salva in `prompts/milestone-<n>.txt`.

1. Lanciare `npm run milestone 0` (o qualsiasi numero) per creare il prompt.
2. Copiare il testo generato dal file o dalla console e incollarlo in GPT-5.1-Codex / Claude Sonnet per l’esecuzione assistita.
3. Ogni prompt include estratto del Prompt Master, dettagli milestone, istruzioni su test/lint e output attesi.
4. Il workflow CI (`.github/workflows/milestone-runner.yml`) può generare questi prompt via `workflow_dispatch` e allegarli come artifact.

## Struttura del progetto

```
app/
  api/
  auth/
  biglietti/
  checkin/
  clienti/
  clubs/
  dashboard/
  eventi/
  gdpr/
  lista/
  marketing/
  onboarding/
  org/
  privacy-policy/
  situa/
  test/
  u/
  user/
  venue/
  verifica-identita/
components/
  (UI shared components: identity, messaging, performance, mobile-nav, ecc.)
lib/
  auth.ts
  api.ts
  age-verification.ts
  performance-monitor.ts
  query-config.ts
  prisma.ts
prisma/
  schema.prisma
  seed.ts
scripts/
  milestone-runner.js
public/
  assets, icons, manifest
prompts/
  milestone-*.txt (output automatico)
.github/
  workflows/milestone-runner.yml
  copilot-instructions.md
docs/
  PROMPT_MASTER_EVENT_APP.md
  ... (altri dossier progettuali)
```

> **Nota:** la root contiene numerosi documenti tecnici (PHASE*, REPORT*, GUIDE\*) che descrivono roadmap, testing e funzionalità future del social layer.

## Testing Policy

- **Unit & Integration**: Vitest (`npm run test`) con coverage obbligatorio su API, hook e servizi core (auth, age-check, role management).
- **End-to-End**: Playwright (`npm run test:e2e`) per flussi critici: onboarding tre step, login, gestione eventi, ticketing.
- **Milestone Runner CI**: workflow GitHub Actions `milestone-runner.yml` eseguibile manualmente per generare prompt e allegarli come artifact; può essere esteso per lint/test automatici prima di condividere i deliverable AI.
- **Pre-merge**: `npm run lint` + `npm run test:e2e` consigliati, `npm run build` per validare Next.js/Prisma prima del deploy su Vercel.

## Credits & Licenza

- **Autore / Lead Architect**: Andrea Granata (Fonzie)
- **Licenza**: MIT License (vedere header del `package.json`)
- **Contributi**: aprire issue/PR seguendo le linee guida della roadmap e della pipeline milestone.

Event App – social nightlife platform by Andrea Granata – ottimizzata per AI-driven development e collaborazione multi-tool.
