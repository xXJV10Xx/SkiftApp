# SSAB Skiftschema Databas

Detta är en avancerad implementation av SSAB:s skiftschema-system med stöd för flexibla arbetsmönster och teamtillstånd.

## 📁 Filer

- `ssab_shift_schema.sql` - Databasschema (kör först)
- `ssab_shift_data.sql` - Testdata för SSAB-systemet
- `SSAB_SHIFT_README.md` - Denna fil

## 🗄️ Databasstruktur

### Tabeller

1. **schedules** - Huvudscheman med regler
2. **work_patterns** - Arbetsmönster (standard/kompakt)
3. **teams** - Skiftlag (Lag 1-5)
4. **team_states** - Aktuella tillstånd för varje lag
5. **shift_definitions** - Definition av skiftkoder (F, E, N, L)

### SSAB-specifika Egenskaper

- **Arbetsmönster:**
  - `standard_pattern`: F-F-F-E-E-N-N (2 veckor cykel)
  - `compact_pattern`: F-F-E-E-N-N-N (3 veckor cykel)

- **Skiftkoder:**
  - `F` = Förmiddag (06:00-14:00)
  - `E` = Eftermiddag (14:00-22:00)
  - `N` = Natt (22:00-06:00)
  - `L` = Ledig

- **5 Skiftlag:**
  - Lag 1 (alias: Lag 31)
  - Lag 2 (alias: Lag 32)
  - Lag 3 (alias: Lag 33)
  - Lag 4 (alias: Lag 34)
  - Lag 5 (alias: Lag 35)

## 🚀 Installation

### 1. Kör Schema (först)
```sql
-- Kör innehållet i ssab_shift_schema.sql
-- Detta skapar alla nödvändiga tabeller
```

### 2. Infoga Data
```sql
-- Kör innehållet i ssab_shift_data.sql
-- Detta lägger till SSAB-specifik data
```

### 3. Verifiera Installation
```sql
-- Kontrollera att allt fungerar
SELECT s.name, COUNT(t.id) as team_count 
FROM schedules s 
LEFT JOIN teams t ON s.id = t.schedule_id 
WHERE s.name = 'Anpassat SSAB-skift'
GROUP BY s.name;

-- Ska returnera: "Anpassat SSAB-skift" med 5 lag
```

## 🔍 Exempelfrågor

### Visa alla lag och deras aktuella tillstånd
```sql
SELECT 
    t.name as lag_namn,
    t.alias as lag_alias,
    ts.state_date as datum,
    ts.block_type as block_typ,
    ts.day_in_block as dag_i_block,
    wp.name as arbetsmönster
FROM teams t
JOIN team_states ts ON t.id = ts.team_id
JOIN work_patterns wp ON ts.work_pattern_id = wp.id
ORDER BY t.name;
```

### Visa arbetsmönster och deras sammansättning
```sql
SELECT 
    wp.name as mönster_namn,
    wp.composition as sammansättning,
    wp.n_count as antal_cykler,
    s.name as schema_namn
FROM work_patterns wp
JOIN schedules s ON wp.schedule_id = s.id
WHERE s.name = 'Anpassat SSAB-skift';
```

### Visa skiftdefinitioner
```sql
SELECT 
    sd.shift_code as kod,
    sd.shift_name as namn,
    sd.start_time as start,
    sd.end_time as slut,
    sd.duration_hours as timmar
FROM shift_definitions sd
JOIN schedules s ON sd.schedule_id = s.id
WHERE s.name = 'Anpassat SSAB-skift'
ORDER BY sd.shift_code;
```

## 🔧 Anpassning

### Ändra UUID:er
I produktionsmiljö, ersätt alla `'uuid-for-*'` med riktiga UUID:er:

```sql
-- Exempel med gen_random_uuid()
INSERT INTO schedules (id, name, work_block_length, valid_start_weekdays, default_leave_days, special_leave_days, special_leave_trigger_n_count)
VALUES (gen_random_uuid(), 'Anpassat SSAB-skift', 7, '{1,3,5}', 5, 4, 3);
```

### Lägg till fler lag
```sql
INSERT INTO teams (schedule_id, name, alias) VALUES
((SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), 'Lag 6', 'Lag 36');
```

### Ändra arbetsmönster
```sql
-- Lägg till nytt mönster
INSERT INTO work_patterns (schedule_id, name, composition, n_count) VALUES
((SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), 'helg_pattern', '{"L","L","F","F","E","E","N"}', 1);
```

## 📊 Fördelar med denna struktur

1. **Flexibilitet** - Enkelt att lägga till nya arbetsmönster
2. **Skalbarhet** - Stöder obegränsat antal lag och scheman
3. **Historik** - team_states tabellen kan spåra förändringar över tid
4. **Validering** - Referential integrity säkerställer datakonsistens
5. **Performance** - Indexerade tabeller för snabba queries

## 🔐 Säkerhet

- RLS (Row Level Security) aktiverat på alla tabeller
- Grundläggande policies för autentiserade användare
- Anpassa policies baserat på dina behov

## 🎯 Nästa Steg

1. Implementera business logic för schemaberäkning
2. Skapa API endpoints för CRUD-operationer
3. Lägg till validering för giltiga övergångar
4. Implementera notifikationer för schemaändringar
5. Skapa rapporter och analytics

## 📝 Anteckningar

- Alla tider är i svensk tid (CET/CEST)
- Veckodag 1 = Måndag, 7 = Söndag
- `valid_start_weekdays` avgör vilka dagar nya arbetscykler kan börja
- `n_count` i work_patterns styr hur många gånger mönstret upprepas i cykeln