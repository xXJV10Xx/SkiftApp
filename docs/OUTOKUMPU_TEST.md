# 🧪 Outokumpu Schema Test

## Översikt

`scripts/test-outokumpu.cjs` är ett testscript som verifierar att Outokumpu-företaget och dess skiftscheman sparas korrekt i databasen.

## Vad testas

### 🏢 Företagsdata
- **ID**: `outokumpu`
- **Namn**: Outokumpu
- **Beskrivning**: Rostfritt stål  
- **Plats**: Avesta, Sverige
- **Lag**: A, B, C, D
- **Avdelningar**: Smältverk, Valsning, Glödgning, Kvalitet, Underhåll

### ⚙️ Skifttyper

#### Outokumpu 3-skift
- **Beskrivning**: Kontinuerligt 3-skiftssystem för rostfritt stål
- **Cykel**: 8 dagar
- **Mönster**: M-M-A-A-N-N-L-L
- **Tider**:
  - M (Morgon): 06:00-14:00
  - A (Kväll): 14:00-22:00  
  - N (Natt): 22:00-06:00
  - L (Ledig): -

#### Outokumpu 2-skift
- **Beskrivning**: 2-skiftssystem för underhåll och kvalitet
- **Cykel**: 14 dagar
- **Mönster**: M-M-M-M-M-L-L-A-A-A-A-A-L-L
- **Tider**:
  - M (Morgon): 06:00-14:00
  - A (Kväll): 14:00-22:00
  - L (Ledig): -

#### Outokumpu Dag
- **Beskrivning**: Dagskift för administration och planering
- **Cykel**: 7 dagar
- **Mönster**: D-D-D-D-D-L-L
- **Tider**:
  - D (Dag): 07:00-16:00
  - L (Ledig): -

### 🎨 Lagfärger
- **Lag A**: `#C0392B` (Rostfritt röd)
- **Lag B**: `#2C3E50` (Stål grå)
- **Lag C**: `#E67E22` (Koppar orange)
- **Lag D**: `#27AE60` (Nickel grön)

## Användning

### 1. Visa teststruktur (ingen databas krävs)
```bash
node scripts/test-outokumpu.cjs --dry-run
```

### 2. Skapa testdata och verifiera
```bash
node scripts/test-outokumpu.cjs --create
```

### 3. Bara verifiera befintlig data
```bash
node scripts/test-outokumpu.cjs
```

## Förutsättningar

### För dry-run
- Node.js installerat
- Inga databas-credentials krävs

### För riktiga tester
1. Skapa `.env` fil baserad på `.env.example`
2. Lägg till dina Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Se `SUPABASE_SETUP.md` för mer information

## Testfall

### Test 1: Företagsdata
- ✅ Verifierar att Outokumpu företag finns i `companies` tabellen
- ✅ Kontrollerar att alla fält matchar förväntade värden
- ✅ Validerar företags-ID, namn, beskrivning och plats

### Test 2: Skifttyper
- ✅ Kontrollerar att alla 3 skifttyper finns i `shift_types` tabellen
- ✅ Verifierar skiftnamn, beskrivningar och cykellängder
- ✅ Validerar skiftmönster och arbetstider

### Test 3: Schemagenerering
- ✅ Testar att scheman kan genereras för Outokumpu
- ✅ Kontrollerar scheman för 30 dagar framåt från 2024-01-01
- ✅ Verifierar att schemaposterna innehåller korrekt data

### Test 4: Lagfärger
- ✅ Validerar att alla lag har definierade färger
- ✅ Kontrollerar färgkoder för lag A, B, C, D

## Felhantering

### Vanliga fel och lösningar

#### "Supabase miljövariabler saknas"
- Skapa `.env` fil med korrekt Supabase credentials
- Eller kör `--dry-run` för att bara se teststrukturen

#### "Outokumpu företag finns inte i databasen"
- Kör scriptet med `--create` flaggan för att skapa testdata
- Kontrollera att databasen är korrekt konfigurerad

#### "Skifttyper saknas"
- Kör scriptet med `--create` flaggan
- Verifiera att `shift_types` tabellen existerar i databasen

## Integration

Detta testscript kan integreras i:

- **CI/CD pipelines** för automatisk validering
- **Utvecklingsworkflow** för att verifiera datastrukturer
- **Deployment scripts** för att säkerställa korrekt data

## Relaterade filer

- `data/companies.ts` - Företagsdefinitioner
- `data/ShiftSchedules.ts` - Skifttypsdefinitioner  
- `SUPABASE_SETUP.md` - Databas-konfiguration
- `.env.example` - Exempel på miljövariabler