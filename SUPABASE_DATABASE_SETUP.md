# Supabase Databasstruktur för Skiftschema

## 📋 Steg 1: Skapa tabellen `shifts` i Supabase

Kör följande SQL i Supabase SQL Editor:

```sql
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  company text not null,
  location text,
  team text not null,
  date date not null,
  shift_type text not null, -- F, E, N, L
  shift_time text not null, -- t.ex. "06:00-14:00"
  scraped_at timestamp default now()
);
```

## 🔑 Steg 2: Konfigurera GitHub Secrets

I ditt GitHub repository, gå till Settings → Secrets and Variables → Actions och lägg till:

- `SUPABASE_URL`: Din Supabase project URL (hittas i Project Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY`: Din service role key (hittas i Project Settings → API)

## 📊 Databasstruktur förklaring

### Tabellen `shifts`
- **id**: Unik identifierare (UUID)
- **company**: Företagsnamn (t.ex. "SSAB", "Ovako")  
- **location**: Plats/avdelning (t.ex. "ssab_ox_3skift")
- **team**: Lagnamn (t.ex. "Lag A", "Lag B")
- **date**: Datum för skiftet (YYYY-MM-DD)
- **shift_type**: Skifttyp (F=Dag, E=Kväll, N=Natt, L=Ledig)
- **shift_time**: Skifttider (t.ex. "06:00-14:00")
- **scraped_at**: När datan skrapades

### Skifttyper
- **F** (Förmiddag): 06:00-14:00
- **E** (Eftermiddag): 14:00-22:00  
- **N** (Natt): 22:00-06:00
- **L** (Ledig): -

## 🚀 Kör scraping

### Manuellt (GitHub Actions)
1. Gå till Actions tab i GitHub
2. Välj "Scrape and Upload Shifts"
3. Klicka "Run workflow"

### Automatiskt
Scriptet körs automatiskt varje dag kl 02:00 UTC.

## 🔍 Verifiera data

Kontrollera att data har importerats korrekt:

```sql
SELECT company, team, date, shift_type, shift_time 
FROM shifts 
ORDER BY company, team, date 
LIMIT 10;
```

## 📱 Nästa steg: Frontend

När databasen är uppsatt och scraping fungerar, fortsätt med frontend-utvecklingen för att visa skiftscheman i appen.