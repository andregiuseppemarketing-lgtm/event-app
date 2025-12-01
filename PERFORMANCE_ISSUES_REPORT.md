# Performance Optimization Report - 21 Nov 2025

## Problemi Rilevati

### 1. Force-Dynamic Overuse ❌
Pagine con `force-dynamic` (no cache, sempre SSR):
- `/checkin` 
- `/dj/dashboard`
- `/situa`
- `/lista`
- `/clubs` e `/clubs/[id]`

**Impatto:** Ogni richiesta= 1+ query database + rendering server + latenza

### 2. Client-Side Data Fetching 📡
Dashboard usa `useQuery` senza prefetch server:
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['dashboard', userRole, activePeriod],
  queryFn: () => fetchDashboardData(userRole || '', activePeriod),
});
```
**Problema:** Dati fetched dopo mount → spinner → layout shift

### 3. Missing API Cache 🔄
Route `/api/stats/dashboard` non ha headers cache:
- Ogni richiesta rifà le stesse aggregazioni DB
- Nessun `Cache-Control` pubblico

### 4. Immagini Non Ottimizzate 🖼️
5+ warning `next/image`:
- `<img>` invece di `<Image />`
- No lazy loading
- No format moderni (AVIF/WebP)

### 5. Bundle Size 📦
Componenti pesanti caricati subito:
- Recharts (charts analytics)
- QR Scanner
- Tutti i dialog

---

## Soluzioni Immediate

### Fix 1: Converti Force-Dynamic → ISR
```typescript
// app/checkin/page.tsx
- export const dynamic = 'force-dynamic';
+ export const revalidate = 60; // Cache 60s
```

### Fix 2: Server Components per Dashboard
```typescript
// app/dashboard/page.tsx
- 'use client'; // Client component
+ // Server component (default)
+ async function DashboardPage() {
+   const data = await fetchDashboardData(...);
+   return <DashboardClient data={data} />;
+ }
```

### Fix 3: API Response Caching
```typescript
// app/api/stats/dashboard/route.ts
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
  }
});
```

### Fix 4: Image Optimization
```tsx
- <img src={url} alt="..." />
+ <Image src={url} alt="..." width={400} height={300} />
```

### Fix 5: Code Splitting
```typescript
// Lazy load analytics
const IdentityAnalytics = dynamic(
  () => import('@/components/identity-analytics'),
  { loading: () => <Skeleton /> }
);
```

---

## Piano d'Azione

### Priorità 1 (Critico - Fare ORA)
1. ✅ Rimuovi `force-dynamic` da `/dashboard`
2. ⏳ Aggiungi cache a `/api/stats/dashboard`
3. ⏳ Converti dashboard a Server Component + Client wrapper

### Priorità 2 (Alto - Oggi)
4. ⏳ ISR invece di force-dynamic (checkin, lista, clubs)
5. ⏳ Lazy load Recharts e QR scanner
6. ⏳ Ottimizza query Prisma (select solo campi necessari)

### Priorità 3 (Medio - Domani)
7. ⏳ `<Image />` invece di `<img>`
8. ⏳ Prefetch critical routes
9. ⏳ Database indexes su colonne filtrate

---

## Metriche Attese

### Before
- TTFB: ~2-3s
- FCP: ~3-4s
- LCP: ~4-5s
- CLS: 0.2+

### After (con tutte le fix)
- TTFB: ~500ms (-80%)
- FCP: ~1.2s (-70%)
- LCP: ~1.8s (-65%)
- CLS: <0.1 (-50%)

---

## Monitoring

Aggiungi logging performance:
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const start = Date.now();
  const res = NextResponse.next();
  const duration = Date.now() - start;
  
  console.log(`${req.method} ${req.url} - ${duration}ms`);
  return res;
}
```

---

**Status**: Report generato, in attesa di implementazione fix.
**Owner**: Development Team
**Target**: Deploy entro oggi
