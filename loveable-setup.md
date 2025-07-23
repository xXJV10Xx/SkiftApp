# 🚀 Skiftappen för Loveable

## Översikt
Skiftappen är en team chat-app byggd med React Native/Expo som nu konverteras för att fungera med Loveable.

## Steg för att sätta upp i Loveable:

### 1. Skapa nytt projekt i Loveable
1. Gå till [Loveable.dev](https://loveable.dev)
2. Skapa ett nytt projekt
3. Välj "React + TypeScript" som template

### 2. Kopiera kärnfunktionalitet
Följande komponenter och funktioner behöver porteras:

#### Autentisering (från /context/AuthContext.tsx)
- Supabase-integration
- Google OAuth
- Email/password login

#### Chat-system (från /app/(tabs)/chat/)
- Real-time meddelanden
- Team-baserad chat
- Online status

#### Teman och språk
- Ljust/mörkt tema
- Svenska/engelska språkstöd

### 3. Miljövariabler för Loveable
```env
VITE_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk
```

### 4. Paketberoenden som behövs
```json
{
  "@supabase/supabase-js": "^2.52.0",
  "lucide-react": "^0.525.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### 5. Struktur för webversion
```
src/
├── components/
│   ├── Auth/
│   ├── Chat/
│   ├── Layout/
│   └── UI/
├── contexts/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── LanguageContext.tsx
├── hooks/
├── lib/
│   └── supabase.ts
└── pages/
    ├── login.tsx
    ├── chat.tsx
    └── settings.tsx
```

## ✅ Färdig webversion skapad!

Jag har skapat en komplett webversion av Skiftappen i `web-version/` mappen som är redo för Loveable:

### 📁 Struktur som skapats:
- `package.json` - Dependencies och scripts
- `src/lib/supabase.ts` - Supabase-konfiguration
- `src/contexts/AuthContext.tsx` - Autentiseringshantering
- `src/components/Auth/LoginForm.tsx` - Inloggningsformulär
- `src/components/Chat/ChatComponent.tsx` - Chat-funktionalitet
- `src/App.tsx` - Huvudapplikation
- `src/main.tsx` - React entry point
- `src/index.css` - Tailwind CSS
- `index.html` - HTML-template
- `vite.config.ts` - Vite-konfiguration
- `tailwind.config.js` - Tailwind-konfiguration
- `README.md` - Komplett guide

### 🚀 Nästa steg:
1. **Öppna Loveable.dev** och skapa nytt React + TypeScript projekt
2. **Kopiera alla filer** från `web-version/` mappen
3. **Installera dependencies**: `npm install @supabase/supabase-js lucide-react`
4. **Skapa .env fil** med Supabase-credentials
5. **Kör `npm run dev`** för att starta appen

### ✨ Funktioner som ingår:
- ✅ Komplett autentisering (email/lösenord + Google OAuth)
- ✅ Real-time chat med Supabase
- ✅ Responsiv design med Tailwind CSS
- ✅ Mörkt/ljust tema-stöd
- ✅ Svenska språket
- ✅ TypeScript för typsäkerhet

Din app är nu redo för Loveable! 🎉