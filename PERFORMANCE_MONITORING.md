# Performance Monitoring System

## 📊 Sistema di Monitoraggio Performance

Implementato sistema completo di tracking performance per garantire che l'app mantenga standard elevati.

### 🎯 Metriche Monitorate

#### Core Web Vitals (Google Standards)
- **LCP** (Largest Contentful Paint): < 2.5s ✅ | < 4s ⚠️ | > 4s ❌
- **FID** (First Input Delay): < 100ms ✅ | < 300ms ⚠️ | > 300ms ❌
- **CLS** (Cumulative Layout Shift): < 0.1 ✅ | < 0.25 ⚠️ | > 0.25 ❌
- **FCP** (First Contentful Paint): < 1.8s ✅ | < 3s ⚠️ | > 3s ❌
- **TTFB** (Time to First Byte): < 800ms ✅ | < 1.8s ⚠️ | > 1.8s ❌
- **INP** (Interaction to Next Paint): < 200ms ✅ | < 500ms ⚠️ | > 500ms ❌

#### Custom Metrics
- **Page Load Time**: tempo totale caricamento pagina
- **API Response Time**: durata chiamate API
- **Memory Usage**: uso memoria JavaScript heap
- **Bundle Size**: dimensione risorse JS caricate
- **Component Render Time**: tempo rendering componenti React

### 🔍 Come Funziona

#### 1. Monitoraggio Automatico
Il sistema si avvia automaticamente al caricamento dell'app e raccoglie metriche ogni 30 secondi.

#### 2. Console Logging
In **development mode**, tutte le metriche vengono loggates in console:
```javascript
[Performance] Dashboard Load: {
  dns: 12ms,
  tcp: 45ms,
  ttfb: 234ms,  // ⚠️ Alert se > 1000ms
  download: 89ms,
  domProcessing: 156ms,
  total: 536ms
}

[Performance] Resources: {
  total: "2.34 MB",
  js: "1.12 MB",
  count: 87
}

[Performance] Memory: {
  used: "45.67 MB",  // ⚠️ Alert se > 100MB
  total: "52.34 MB",
  limit: "2048.00 MB"
}
```

#### 3. Alert Automatici
Il sistema emette **warning** automatici quando:
- TTFB > 1 secondo
- API call > 1 secondo
- Component render > 50ms
- Memory usage > 100MB
- Qualsiasi metrica Core Web Vitals in zona "poor"

#### 4. Analytics Endpoint
In **production**, le metriche vengono inviate a `/api/analytics/performance` usando `sendBeacon` (non blocking).

### 📈 Come Leggere i Dati

#### Development (Console DevTools)
```bash
# Aprire DevTools > Console
# Filtrare per "[Performance]"

✅ [Performance] Dashboard Load: { ttfb: 234ms }  # GOOD
⚠️ [Performance] SLOW TTFB on /eventi: 1234ms    # NEEDS IMPROVEMENT
❌ [Performance] HIGH MEMORY USAGE: 156.78 MB    # POOR
```

#### Production (Vercel Logs)
```bash
# Nel deployment dashboard Vercel > Runtime Logs
# Cercare "[Performance Metric]" o "[POOR PERFORMANCE]"
```

### 🛠️ File Creati

1. **`lib/performance-monitor.ts`**
   - Core del sistema di monitoraggio
   - Funzioni: `reportWebVitals()`, `trackPageLoad()`, `trackAPICall()`, `trackResourceMetrics()`

2. **`components/performance-monitor.tsx`**
   - Componente React che avvia il monitoraggio
   - Montato in `app/layout.tsx`

3. **`app/api/analytics/performance/route.ts`**
   - Endpoint per ricevere metriche da production
   - Log in console + possibilità di salvare in DB

### 🎯 Target Performance

Obiettivi da mantenere:
- ✅ **TTFB**: < 500ms (attualmente ~200-400ms)
- ✅ **LCP**: < 2s (grazie a lazy loading + image optimization)
- ✅ **Memory**: < 80MB (grazie a cache optimization)
- ✅ **Bundle JS**: < 1.5MB (grazie a optimizePackageImports)

### 🚨 Quando Preoccuparsi

**Alert CRITICI** (richiedono azione immediata):
- TTFB > 2 secondi → problema database/API
- Memory > 150MB → memory leak da investigare
- LCP > 4 secondi → problema lazy loading/images
- API call > 3 secondi → query database inefficienti

**Alert MODERATI** (monitorare):
- TTFB 1-2 secondi → possibile ottimizzazione query
- Memory 100-150MB → rivedere cache React Query
- Component render > 100ms → usare React.memo o lazy loading

### 📊 Prossimi Passi

1. **Database Persistence** (opzionale)
   ```sql
   CREATE TABLE PerformanceMetrics (
     id SERIAL PRIMARY KEY,
     metric_name VARCHAR(50),
     value FLOAT,
     rating VARCHAR(20),
     user_agent TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Dashboard Analytics** (futuro)
   - Grafici trend performance nel tempo
   - Confronto metriche per pagina
   - Alert email per performance critiche

3. **Real User Monitoring** (RUM)
   - Integrare con servizi tipo Vercel Analytics, Sentry, o DataDog
   - Tracciare metriche per device/browser/location

### ✅ Vantaggi Implementazione

1. **Visibilità Immediata**: vedi performance in real-time
2. **Alert Proattivi**: problemi identificati prima che impattino utenti
3. **Data-Driven**: decisioni di ottimizzazione basate su dati reali
4. **Zero Impact**: sistema usa `sendBeacon` (non blocca UI)
5. **Production Ready**: funziona sia in dev che in prod

Il sistema è **attivo ora** e monitora automaticamente ogni caricamento pagina! 🚀
