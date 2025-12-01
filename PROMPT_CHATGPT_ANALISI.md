# 🤖 PROMPT OTTIMIZZATO PER CHATGPT - ANALISI PANICO APP

---

## 📋 ISTRUZIONI PER L'USO

**Copia e incolla questo prompt completo su ChatGPT insieme al file `RESOCONTO_TECNICO_COMPLETO.md`**

---

## 🎯 PROMPT

Ciao! Sono uno sviluppatore che sta lavorando su **PANICO APP**, una piattaforma social nightlife multi-ruolo costruita con Next.js 15, TypeScript, Prisma e PostgreSQL.

Ho preparato un **resoconto tecnico dettagliato** (allegato sotto) che documenta tutto il lavoro completato fino ad oggi e le funzionalità ancora da implementare.

### **Ho bisogno del tuo aiuto per:**

1. **📊 ANALISI ARCHITETTURA**
   - Valuta la solidità dell'architettura database (Prisma schema multi-role)
   - Identifica potenziali colli di bottiglia o problemi di scalabilità
   - Suggerisci miglioramenti strutturali se necessario
   - Controlla se ci sono anti-pattern o best practice violate

2. **🗺️ PIANO ESECUZIONE DETTAGLIATO**
   - Analizza lo "Schema Esecuzione Lavori" (4 Sprint) nel resoconto
   - Crea un piano **giorno per giorno** per completare lo **Sprint 1** (Flusso Utente Base)
   - Per ogni task, specifica:
     - Tempo stimato (ore)
     - File da creare/modificare
     - Dipendenze tecniche
     - Rischi potenziali
     - Checklist validazione

3. **⚠️ IDENTIFICAZIONE CRITICITÀ**
   - Individua **blocchi tecnici** che potrebbero rallentare lo sviluppo
   - Segnala **debito tecnico** accumulato
   - Evidenzia **edge cases** non gestiti (onboarding interrotto, sessioni inconsistenti, etc.)
   - Suggerisci **testing prioritario** (unit, integration, E2E)

4. **🚀 OTTIMIZZAZIONI PERFORMANCE**
   - Valuta le ottimizzazioni già implementate (bundle, query, caching)
   - Suggerisci ulteriori miglioramenti per:
     - Core Web Vitals (LCP < 2.5s, FID < 100ms)
     - Database query optimization (N+1 queries, indexes)
     - React rendering (memo, useMemo, lazy loading)

5. **🔐 SECURITY & BEST PRACTICES**
   - Verifica implementazione autenticazione (NextAuth v4, JWT)
   - Controlla age verification e GDPR compliance
   - Suggerisci hardening security (rate limiting, CSRF, XSS)
   - Valuta gestione errori e logging

6. **📱 UX/UI FLOW VALIDATION**
   - Analizza il flusso utente proposto:
     ```
     Homepage → Registrazione (2 step) → Dashboard → Profilo
     ```
   - Suggerisci miglioramenti user journey
   - Identifica punti di frizione (friction points)
   - Proponi A/B test critici

### **OUTPUT RICHIESTO:**

Fornisci un documento strutturato con:

**A. EXECUTIVE SUMMARY** (5 punti chiave)
- Stato attuale progetto (% completamento)
- Punti di forza architettura
- Criticità maggiori da risolvere
- Tempo stimato per MVP funzionale
- Priorità immediate (top 3)

**B. ANALISI TECNICA DETTAGLIATA**
- Architettura: Pro/Contro + Score 1-10
- Performance: Analisi ottimizzazioni + Suggerimenti
- Security: Vulnerabilità potenziali + Fix
- Scalabilità: Bottleneck + Soluzioni

**C. PIANO SPRINT 1 GIORNO-PER-GIORNO**
```
Giorno 1: Homepage Landing Page
├─ Ore 1-2: Setup struttura file + routing
├─ Ore 3-5: Implementazione Hero section
├─ Ore 6-7: Features cards + Footer
└─ Checklist: [ ] Responsive, [ ] Accessibilità, [ ] Performance

Giorno 2: Smart Redirect Middleware
[...continua...]
```

**D. CHECKLIST VALIDAZIONE PRE-DEPLOY**
- [ ] Testing E2E onboarding completo
- [ ] Performance audit (Lighthouse > 90)
- [ ] Security headers configured
- [ ] Error tracking setup (Sentry?)
- [ ] Analytics integration
- [ ] GDPR banner/consent
- [ ] SEO metadata
- [ ] Mobile responsiveness

**E. TECHNICAL DEBT & REFACTORING**
- Lista priorità debito tecnico
- Quick wins (1-2 ore effort, high impact)
- Major refactoring (3+ giorni effort)

**F. RISCHI & MITIGAZIONI**
- Rischi tecnici (con probabilità % e impatto)
- Strategie mitigazione
- Fallback plans

---

### **CONTESTO IMPORTANTE:**

- **Timeline:** Voglio completare lo **Sprint 1** (Flusso Utente Base) nei prossimi **3-5 giorni**
- **Skill level:** Sviluppatore full-stack con buona conoscenza Next.js/React/TypeScript
- **Priorità:** UX fluida > Performance > Features avanzate
- **Vincoli:** Budget limitato, solo sviluppo, no team

---

### **DOMANDE SPECIFICHE:**

1. La struttura onboarding 2-step è ottimale o suggerirai 1-step o 3-step?
2. Il middleware attuale gestisce correttamente tutti gli edge case (sessione scaduta, onboarding parziale)?
3. È meglio implementare phone verification subito o posticipare post-MVP?
4. La pagina profilo mobile-first dovrebbe essere la `/dashboard` principale?
5. Quale sistema di state management consigli oltre React Query? (Zustand? Jotai?)

---

## 📎 ALLEGATO: RESOCONTO TECNICO COMPLETO

[INCOLLA QUI IL CONTENUTO DI `RESOCONTO_TECNICO_COMPLETO.md`]

---

**Grazie per l'analisi dettagliata! 🚀**
