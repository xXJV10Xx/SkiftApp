# 🛠️ Utvecklingsguide för Skiftappen

## 📋 Snabbstart

### Steg 1: Installera beroenden
```bash
npm install
```

### Steg 2: Konfigurera miljövariabler
Kontrollera att `.env`-filen finns med korrekt Supabase-konfiguration:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Steg 3: Starta utvecklingsservern
```bash
npm run dev
# eller
npm start
```

## 🐛 Vanliga problem och lösningar

### Problem 1: Lucide-ikoner fungerar inte
**Symptom**: `Unable to resolve path to module 'lucide-react'`

**Lösning**: 
- Använd `lucide-react-native` istället för `lucide-react`
- Exempel: `import { Calendar } from 'lucide-react-native';`

### Problem 2: Supabase-anslutning misslyckas
**Symptom**: `Missing Supabase environment variables`

**Lösning**:
1. Kontrollera att `.env`-filen finns i projektets rot
2. Verifiera att miljövariablerna är korrekta
3. Starta om utvecklingsservern efter ändringar

### Problem 3: useEffect dependencies-varningar
**Symptom**: `React Hook useEffect has missing dependencies`

**Lösning**:
- Använd `useCallback` för funktioner som används i useEffect
- Inkludera alla dependencies i dependency-arrayen
- Exempel:
```typescript
const myFunction = useCallback(() => {
  // funktion
}, [dependency1, dependency2]);

useEffect(() => {
  myFunction();
}, [myFunction]);
```

### Problem 4: Oanvända variabler
**Symptom**: `'variable' is defined but never used`

**Lösning**:
- Ta bort oanvända imports och variabler
- Eller använd variabeln för proper error handling:
```typescript
try {
  // kod
} catch (error) {
  console.error('Error:', error);
  // hantera felet
}
```

## 🧪 Kvalitetskontroll

### Kör linting
```bash
npm run lint
```

### Vanliga linting-problem som fixats:
- ✅ Korrigerade lucide-react imports
- ✅ Fixade useEffect dependencies
- ✅ Förbättrade error handling
- ✅ Tog bort oanvända variabler
- ✅ Lade till miljövariabel-validering

## 🚀 Deployment

### Lokalt
Appen körs automatiskt på `http://localhost:8081` när utvecklingsservern startas.

### Produktionsdistribution
Se `DEPLOYMENT_GUIDE.md` för detaljerade instruktioner.

## 📝 Kodkvalitet

Nuvarande status:
- **0 kritiska fel** (från 8)
- **21 varningar** (från 31)
- **Totalt: 21 problem** (från 39)

### Förbättringar gjorda:
1. Fixade alla kritiska import-fel
2. Lade till proper miljövariabel-hantering
3. Förbättrade useEffect dependencies
4. Implementerade bättre error handling
5. Tog bort oanvända kod

## 🔧 Utvecklingsverktyg

### Tillgängliga scripts:
- `npm start` - Starta Expo development server
- `npm run dev` - Alias för start
- `npm run lint` - Kör ESLint
- `npm run android` - Kör på Android
- `npm run ios` - Kör på iOS
- `npm run web` - Kör i webbläsare

## 📞 Support

Om du stöter på problem:
1. Kontrollera denna guide först
2. Kör `npm run lint` för att identifiera kodproblem
3. Kontrollera att alla miljövariabler är korrekt konfigurerade
4. Starta om utvecklingsservern