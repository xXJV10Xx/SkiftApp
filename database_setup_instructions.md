# Supabase Database Setup Instructions

## Översikt
Detta dokument beskriver hur du sätter upp hela databasstrukturen för Skiftschema-appen i Supabase.

## Steg-för-steg installation

### 1. Öppna Supabase Dashboard
- Gå till [supabase.com](https://supabase.com)
- Logga in på ditt konto
- Välj ditt projekt

### 2. Kör SQL-skriptet
- Gå till "SQL Editor" i sidomenyn
- Öppna filen `setup_database.sql`
- Kopiera hela innehållet
- Klistra in i SQL Editor
- Klicka "Run" för att köra skriptet

### 3. Verifiera installation
Efter att skriptet körts ska du se följande tabeller i "Table Editor":
- ✅ companies
- ✅ departments  
- ✅ teams
- ✅ shifts
- ✅ users
- ✅ subscriptions
- ✅ groups
- ✅ group_members
- ✅ messages
- ✅ notifications

## Databasstruktur

### Hierarki
```
Companies (Företag)
└── Departments (Avdelningar/Orter)
    └── Teams (Skiftlag)
        └── Shifts (Skiftscheman)
```

### Användarhantering
- **users**: Autentiserade användare kopplade till företag/avdelning/lag
- **subscriptions**: Premium-betalningar per användare
- **notifications**: Push-notiser

### Chat-funktionalitet
- **groups**: Gruppchattar per företag/avdelning
- **group_members**: Medlemskap i grupper
- **messages**: Meddelanden i grupper

## Säkerhet (RLS)
Alla tabeller har Row Level Security (RLS) aktiverat med grundläggande policies:
- Användare kan bara se data från sitt eget företag
- Användare kan bara läsa/skriva sina egna meddelanden
- Användare kan bara se grupper de är medlemmar i

## Nästa steg
När databasen är uppsatt kan vi gå vidare med:
1. 🔄 Scraping av data från skiftschema.se
2. 💳 Betalningsintegration (Stripe/Klarna)
3. 🎨 UI-utveckling för alla funktioner