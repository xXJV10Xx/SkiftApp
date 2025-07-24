# SSAB Oxelösund Skiftschema - Export för Implementation

## 🎯 Sammanfattning
Fullständig implementation av SSAB Oxelösund 3-skift system med:
- Korrekt schema för lag 31-35
- 11-dagars cykel (F,F,E,E,N,N,N,L,L,L,L)
- Stöd för 2023-2035 (13 år)
- Alla lag-visning med färgkodning
- Fullständig Supabase integration

## ✅ Verifierat Schema (24 juli 2024)
- **Lag 31**: E - Eftermiddag (14:00-22:00)
- **Lag 32**: F - Förmiddag (06:00-14:00) - sista F, imorgon första E
- **Lag 33**: Ledig
- **Lag 34**: F - Förmiddag (06:00-14:00)
- **Lag 35**: N - Natt (22:00-06:00)

## 📁 Filer att Uppdatera/Skapa

### 1. Supabase Migration
**Fil**: `supabase_migration.sql`
**Status**: Ny fil - Kör i Supabase SQL Editor

### 2. Hooks Update
**Fil**: `hooks/useShifts.ts`
**Status**: Uppdaterad - Nya interfaces och hooks

### 3. ShiftSchedules Update
**Filer**: 
- `data/ShiftSchedules.ts`
- `data/ShiftSchedules.js`
**Status**: Uppdaterade - Nytt startdatum och team-offsets

### 4. Companies Update
**Fil**: `data/companies.ts`
**Status**: Uppdaterad - SSAB Oxelösund tillagt

### 5. Calendar Components
**Filer**:
- `components/ShiftCalendar.tsx` - Uppdaterad
- `components/SupabaseShiftCalendar.tsx` - Ny fil

## 🔧 Kritiska Konfigurationer

### Team Offsets (VIKTIGT!)
```typescript
// I data/ShiftSchedules.ts och .js
const teamOffsets = [5, 3, 0, 2, 8]; // Lag 31, 32, 33, 34, 35
```

### Startdatum (VIKTIGT!)
```typescript
export const START_DATE = new Date('2023-01-01');
```

### Mönster
```typescript
pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L']
cycle: 11
```

## 🚀 Implementation Steg

### Steg 1: Supabase Setup
1. Kör `supabase_migration.sql` i Supabase SQL Editor
2. Verifiera att tabeller skapats: companies, shift_types, teams, shifts
3. Kontrollera att data genererats för 2023-2035

### Steg 2: Frontend Update
1. Uppdatera alla listade filer
2. Installera eventuella nya dependencies
3. Testa att kalendern laddar korrekt

### Steg 3: Verifiering
1. Kontrollera att lag 31 har E idag (24 juli)
2. Kontrollera att lag 32 har F idag
3. Kontrollera att lag 35 har N idag
4. Testa "Alla lag" visning

## 📊 Användning

### Grundläggande Calendar
```tsx
<ShiftCalendar
  company={COMPANIES.SSAB_OXELOSUND}
  team="31"
  shiftTypeId="ssab_oxelosund_3skift"
/>
```

### Supabase Calendar (Rekommenderad)
```tsx
<SupabaseShiftCalendar
  companyId="ssab_oxelosund"
  companyName="SSAB Oxelösund"
  selectedTeam="31"
/>
```

## 🔍 Testfall för Verifiering

### Test 1: Dagens Schema
```javascript
// Förväntat resultat för 24 juli 2024:
// Lag 31: E, Lag 32: F, Lag 33: L, Lag 34: F, Lag 35: N
```

### Test 2: Imorgon (25 juli)
```javascript
// Förväntat resultat:
// Lag 32 ska gå från F till E (första E)
```

### Test 3: Alla Lag Visning
- Ska visa 5 rader per dag (en per lag)
- Olika färger per lag
- Lagförklaring ovanför kalendern

## ⚠️ Viktiga Noteringar

1. **Startdatum måste vara 2023-01-01** för korrekt beräkning
2. **Team-offsets är kritiska** - ändra inte utan omberäkning
3. **Supabase migration genererar 13 års data** - kan ta några minuter
4. **Färgkodning per lag** - varje lag har sin unika färg

## 🎯 Slutresultat
När allt är implementerat ska systemet:
- Visa korrekt schema för alla lag 31-35
- Stödja navigation 2023-2035
- Visa alla lag samtidigt med färgkodning
- Fungera både med lokal data och Supabase
- Ha korrekt schema enligt SSAB Oxelösunds arbetsmönster

## 📞 Support
Om något inte fungerar, kontrollera:
1. Startdatum = 2023-01-01
2. Team-offsets = [5, 3, 0, 2, 8]
3. Supabase migration kördes korrekt
4. Alla filer uppdaterades enligt listan ovan