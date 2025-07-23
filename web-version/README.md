# 🚀 Skiftappen Web - För Loveable

En modern webversion av Skiftappen team chat-app, optimerad för Loveable-plattformen.

## 🎯 Översikt

Skiftappen Web är en real-time chat-applikation byggd med React, TypeScript och Supabase. Denna version är speciellt anpassad för att fungera med Loveable.dev.

## ✨ Funktioner

- **🔐 Autentisering**: Email/lösenord och Google OAuth
- **💬 Real-time chat**: Direktmeddelanden med Supabase
- **🎨 Modern UI**: Tailwind CSS med mörkt/ljust tema
- **📱 Responsiv design**: Fungerar på alla enheter
- **🌍 Svenskt språk**: Fullt lokaliserat gränssnitt

## 🛠️ Tech Stack

- **React 18** - UI-bibliotek
- **TypeScript** - Typsäkerhet
- **Vite** - Build-verktyg
- **Tailwind CSS** - Styling
- **Supabase** - Backend och databas
- **Lucide React** - Ikoner

## 🚀 Kom igång med Loveable

### 1. Skapa projekt i Loveable
1. Gå till [loveable.dev](https://loveable.dev)
2. Skapa nytt projekt
3. Välj "React + TypeScript" template

### 2. Kopiera filer
Kopiera alla filer från `web-version/` mappen till ditt Loveable-projekt:

```
src/
├── components/
│   ├── Auth/
│   │   └── LoginForm.tsx
│   └── Chat/
│       └── ChatComponent.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── App.tsx
├── main.tsx
└── index.css
```

### 3. Installera dependencies
Kör följande i Loveable-terminalen:

```bash
npm install @supabase/supabase-js lucide-react
```

### 4. Konfigurera miljövariabler
Skapa `.env` fil i projektroten:

```env
VITE_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk
```

### 5. Starta utvecklingsservern
```bash
npm run dev
```

## 📋 Databas Schema

Appen använder följande Supabase-tabeller:

### `employees`
- `id` (UUID, Primary Key)
- `email` (Text)
- `first_name` (Text)
- `last_name` (Text)
- `avatar_url` (Text, nullable)
- `is_active` (Boolean)
- `profile_completed` (Boolean)

### `chat_rooms`
- `id` (UUID, Primary Key)
- `name` (Text)
- `description` (Text, nullable)
- `type` (Text)
- `is_private` (Boolean)
- `created_at` (Timestamp)

### `messages`
- `id` (UUID, Primary Key)
- `chat_room_id` (UUID, Foreign Key)
- `sender_id` (UUID, Foreign Key)
- `content` (Text)
- `created_at` (Timestamp)

## 🎨 UI/UX Funktioner

### Autentisering
- Elegant login/registreringsform
- Google OAuth-integration
- Lösenordsåterställning
- Felhantering på svenska

### Chat-gränssnitt
- Real-time meddelanden
- Chattrumsväljare
- Responsiv design
- Mörkt/ljust tema-stöd

### Komponenter
- **LoginForm**: Komplett autentiseringsformulär
- **ChatComponent**: Real-time chat med rumsstöd
- **AuthContext**: Centraliserad autentiseringshantering

## 🔧 Anpassning

### Teman
Appen stöder automatisk mörk/ljus tema-växling baserat på systempreferenser.

### Språk
Alla texter är på svenska. För att lägga till engelska:
1. Skapa en `i18n` mapp
2. Lägg till översättningsfiler
3. Implementera språkväxling

### Styling
Använd Tailwind CSS-klasser för att anpassa utseendet:
- `bg-blue-600` - Primärfärg
- `text-gray-900 dark:text-white` - Textfärger
- `border-gray-200 dark:border-gray-700` - Kantlinjer

## 🚀 Deployment

### Via Loveable
1. Bygg projektet: `npm run build`
2. Loveable hanterar automatisk deployment
3. Konfigurera domän i Loveable-inställningar

### Manuell deployment
```bash
npm run build
# Deploya 'dist' mappen till din webbserver
```

## 🔐 Säkerhet

- **RLS aktiverat**: Alla Supabase-tabeller har Row Level Security
- **Miljövariabler**: Känslig data lagras säkert
- **Input-validering**: Alla formulär valideras
- **XSS-skydd**: React's inbyggda skydd

## 📱 Responsiv Design

Appen är optimerad för:
- 📱 Mobila enheter (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Stora skärmar (1280px+)

## 🐛 Felsökning

### Vanliga problem

**"Cannot connect to Supabase"**
- Kontrollera miljövariabler
- Verifiera Supabase URL och API-nyckel

**"Real-time not working"**
- Kontrollera Supabase RLS-policies
- Verifiera nätverksanslutning

**"Google OAuth fails"**
- Konfigurera redirect URL i Supabase
- Kontrollera Google OAuth-inställningar

## 📄 Licens

MIT License - Se [LICENSE](LICENSE) fil för detaljer.

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature branch
3. Committa dina ändringar
4. Pusha till branchen
5. Öppna en Pull Request

## 📞 Support

För hjälp med Loveable-integration:
- [Loveable Documentation](https://docs.loveable.dev)
- [Supabase Documentation](https://supabase.com/docs)

---

**Gjord med ❤️ för Loveable-plattformen**