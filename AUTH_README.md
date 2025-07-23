# 🔐 Skiftapp Autentiseringssystem

## 📋 Översikt

Skiftapp har ett komplett autentiseringssystem med stöd för:
- **E-post/lösenord** inloggning
- **Google OAuth** inloggning
- **Registrering** av nya användare
- **Lösenordsåterställning**
- **E-postverifiering**
- **Säker session-hantering**

## 🚀 Funktioner

### Inloggningsmetoder
- **E-post/lösenord**: Traditionell inloggning
- **Google OAuth**: Enkel inloggning med Google-konto
- **Automatisk registrering**: Skapa konto direkt från inloggningssidan

### Säkerhet
- **Lösenordskrav**: Minst 8 tecken, stor/liten bokstav, siffra
- **Session-hantering**: Automatisk utloggning efter timeout
- **Kontolåsning**: Lås ut efter för många misslyckade försök
- **E-postverifiering**: Kräv verifiering för nya konton

### Användarupplevelse
- **Responsiv design**: Fungerar på alla skärmstorlekar
- **Loading states**: Visar laddning under autentisering
- **Felhantering**: Tydliga felmeddelanden
- **Validering**: Real-time validering av input

## 📱 Komponenter

### AuthScreen.tsx
Huvudkomponent för autentisering:
```typescript
import { AuthScreen } from './components/AuthScreen';

<AuthScreen onAuthSuccess={handleAuthSuccess} />
```

**Funktioner:**
- Växla mellan inloggning/registrering
- E-post/lösenord validering
- Google OAuth integration
- Lösenordsåterställning
- Responsiv design

### App.tsx
Huvudapp som hanterar autentiseringsstatus:
```typescript
// Kontrollerar om användare är inloggad
const [user, setUser] = useState<any>(null);

// Lyssnar på autentiseringsändringar
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
});
```

## ⚙️ Konfiguration

### Miljövariabler
Skapa en `.env` fil:
```env
EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Google OAuth Setup
1. **Skapa Google Cloud Project**
2. **Aktivera Google+ API**
3. **Skapa OAuth 2.0 credentials**
4. **Lägg till redirect URIs:**
   - `skiftapp://auth/callback`
   - `http://localhost:3000/auth/callback`

### Supabase Auth Setup
1. **Aktivera Auth i Supabase Dashboard**
2. **Konfigurera OAuth providers**
3. **Sätt upp e-post templates**
4. **Konfigurera redirect URLs**

## 🔧 Användning

### 1. Importera AuthScreen
```typescript
import { AuthScreen } from './components/AuthScreen';

function MyApp() {
  const [user, setUser] = useState(null);

  const handleAuthSuccess = () => {
    // Hantera framgångsrik inloggning
    setUser(supabase.auth.getUser());
  };

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return <MainApp />;
}
```

### 2. Hantera Autentiseringsstatus
```typescript
useEffect(() => {
  // Kontrollera befintlig session
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  checkUser();

  // Lyssna på ändringar
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

### 3. Logga ut
```typescript
const handleSignOut = async () => {
  try {
    await supabase.auth.signOut();
    setUser(null);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
```

## 🛡️ Säkerhet

### Lösenordskrav
- Minst 8 tecken
- Stor och liten bokstav
- Minst en siffra
- Valfritt specialtecken

### Session-hantering
- Automatisk refresh av tokens
- Timeout efter 24 timmar
- Säker logout

### Felhantering
- Kontolåsning efter 5 misslyckade försök
- 15 minuters låstid
- Loggning av säkerhetshändelser

## 📊 Felmeddelanden

### Vanliga Fel
- **Ogiltig e-post**: Kontrollera format
- **Fel lösenord**: Kontrollera stavning
- **Konto låst**: Vänta 15 minuter
- **E-post inte verifierad**: Kontrollera inkorg

### Lösningar
1. **Kontrollera nätverksanslutning**
2. **Verifiera e-postadress**
3. **Återställ lösenord**
4. **Kontakta support**

## 🔄 Arbetsflöden

### Registrering
```
1. Ange namn och e-post
2. Skapa lösenord
3. Bekräfta lösenord
4. Klicka "Registrera"
5. Verifiera e-post
6. Automatisk inloggning
```

### Inloggning
```
1. Ange e-post och lösenord
2. Klicka "Logga in"
3. Eller använd Google
4. Komma till huvudapp
```

### Lösenordsåterställning
```
1. Klicka "Glömt lösenord?"
2. Ange e-postadress
3. Klicka "Skicka"
4. Kontrollera e-post
5. Klicka på länk
6. Skapa nytt lösenord
```

## 🎨 Anpassning

### Färger och Stil
Ändra i `AuthScreen.tsx`:
```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#007AFF', // Ändra färg här
  },
  // ... fler stilar
});
```

### Texter
Ändra i `config/auth.ts`:
```typescript
export const AUTH_ERRORS = {
  INVALID_EMAIL: 'Din anpassade text här',
  // ... fler meddelanden
};
```

### Validering
Ändra i `config/auth.ts`:
```typescript
export const AUTH_CONFIG = {
  password: {
    minLength: 10, // Ändra krav här
    requireSpecialChars: true,
  },
};
```

## 🚀 Deployment

### Produktionsmiljö
1. **Uppdatera miljövariabler**
2. **Konfigurera Google OAuth**
3. **Sätt upp Supabase Auth**
4. **Testa alla funktioner**

### Testning
- [ ] E-post registrering
- [ ] E-post inloggning
- [ ] Google OAuth
- [ ] Lösenordsåterställning
- [ ] Logga ut
- [ ] Session timeout
- [ ] Felhantering

## 📞 Support

### Vanliga Problem
1. **Google OAuth fungerar inte**
   - Kontrollera client ID/secret
   - Verifiera redirect URIs

2. **E-postverifiering fungerar inte**
   - Kontrollera Supabase e-post inställningar
   - Verifiera SMTP-konfiguration

3. **Session timeout för tidigt**
   - Justera timeout-inställningar
   - Kontrollera nätverksanslutning

### Debug
```typescript
// Aktivera debug logging
console.log('Auth state:', user);
console.log('Session:', session);
```

---

**Skiftapp Auth** - Säker och användarvänlig autentisering för din app. 