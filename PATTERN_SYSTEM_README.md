# Skiftapp Mönsteranalys System

Detta system beräknar mönster för alla scheman i din Supabase-databas med 5 års historisk data och 5 års projicerad data framåt från dagens datum.

## Funktioner

### 🔄 Automatisk Uppdatering
- Beräknar mönster automatiskt varje timme
- Cachar data för snabb åtkomst
- Uppdaterar alltid från dagens datum (5 år bakåt → 5 år framåt)

### 📊 Analyserade Scheman
- **Profiler** (`profiles`) - Användarregistreringar
- **Företag** (`companies`) - Företagsregistreringar  
- **Team** (`teams`) - Team-skapande
- **Teammedlemmar** (`team_members`) - Anslutningar till team
- **Chattmeddelanden** (`chat_messages`) - Kommunikation
- **Online Status** (`online_status`) - Användaraktivitet

### 📈 Beräknade Trender
- **Tillväxt** - Procentuell förändring över tid
- **Säsongsvariation** - Månadsvisa mönster
- **Volatilitet** - Variation i aktivitet

## Filer och Struktur

### `lib/patternCalculator.ts`
Huvudklass för mönsterberäkning:
```typescript
// Exempel användning
import { patternCalculator } from './lib/patternCalculator';

// Beräkna alla mönster
const patterns = await patternCalculator.calculateAllPatterns();

// Hämta dagens aktivitet
const today = await patternCalculator.getTodayPatterns();
```

### `hooks/usePatterns.ts`
React Hook för användning i komponenter:
```typescript
import { usePatterns } from './hooks/usePatterns';

const { patterns, todayPatterns, loading, error } = usePatterns();
```

### `components/PatternDashboard.tsx`
UI-komponent som visar mönsterdata:
```typescript
import { PatternDashboard } from './components/PatternDashboard';

// Visa alla mönster
<PatternDashboard />

// Visa specifikt schema
<PatternDashboard selectedSchema="profiles" />
```

### `services/patternService.ts`
Service för caching och automatisk uppdatering:
```typescript
import { patternService } from './services/patternService';

// Starta automatisk uppdatering
patternService.startAutoUpdate();

// Hämta cachade mönster
const patterns = await patternService.getCachedPatterns();
```

## Användning i Appen

### 1. Importera Hook
```typescript
import { usePatterns } from '../hooks/usePatterns';

function MyComponent() {
  const { patterns, todayPatterns, loading } = usePatterns();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <View>
      <Text>Dagens aktivitet: {todayPatterns.profiles}</Text>
    </View>
  );
}
```

### 2. Använd Dashboard Komponent
```typescript
import { PatternDashboard } from '../components/PatternDashboard';

function AnalyticsScreen() {
  return (
    <PatternDashboard selectedSchema="chat_messages" />
  );
}
```

### 3. Starta Service
```typescript
import { patternService } from '../services/patternService';

// I App.tsx eller liknande
useEffect(() => {
  patternService.startAutoUpdate();
  
  return () => {
    patternService.stopAutoUpdate();
  };
}, []);
```

## Data Struktur

### PatternData
```typescript
interface PatternData {
  date: string;        // YYYY-MM-DD format
  value: number;       // Antal aktiviteter den dagen
  category: string;    // 'activity' eller 'projected'
  schema: string;      // Schema namn
}
```

### PatternResult
```typescript
interface PatternResult {
  historical: PatternData[];  // 5 år bakåt
  projected: PatternData[];   // 5 år framåt
  trends: {
    growth: number;           // Procentuell tillväxt
    seasonality: number;      // Säsongsvariation
    volatility: number;       // Standardavvikelse
  };
}
```

## Caching System

- **Cache nyckel**: `skiftapp_patterns_cache`
- **Giltighetstid**: 1 timme
- **Automatisk uppdatering**: Varje timme
- **Fallback**: Beräknar nya mönster om cache är ogiltig

## Prestanda Optimering

1. **Caching**: Data cachas lokalt för snabb åtkomst
2. **Lazy Loading**: Mönster beräknas endast vid behov
3. **Inkrementell uppdatering**: Endast nya data beräknas
4. **Background updates**: Uppdateringar sker i bakgrunden

## Felhantering

Systemet hanterar följande fel:
- Nätverksfel vid Supabase-anrop
- Cache-korruption
- Otillräcklig data för beräkning
- Timeout vid långa beräkningar

## Framtida Förbättringar

- [ ] Mer avancerad säsongsanalys
- [ ] Machine learning för bättre prognoser
- [ ] Real-time uppdateringar
- [ ] Anpassningsbara tidsintervall
- [ ] Export av mönsterdata
- [ ] Grafiska visualiseringar

## Felsökning

### Vanliga Problem

1. **Ingen data visas**
   - Kontrollera Supabase-anslutning
   - Verifiera att tabeller har data
   - Kontrollera cache status

2. **Långsam laddning**
   - Rensa cache: `patternService.clearCache()`
   - Kontrollera nätverksanslutning
   - Verifiera Supabase-prestanda

3. **Felaktiga prognoser**
   - Kontrollera historisk data
   - Verifiera datumformat
   - Kontrollera beräkningslogik

### Debug Kommandon

```typescript
// Kontrollera cache status
const status = await patternService.getCacheStatus();
console.log('Cache status:', status);

// Rensa cache
await patternService.clearCache();

// Tvinga uppdatering
await patternService.updatePatterns();
``` 