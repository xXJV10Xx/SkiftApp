# Sentry Setup Guide för Skiftappen

## Installation och Konfiguration

### 1. Skapa ett Sentry-konto och projekt

1. Gå till [sentry.io](https://sentry.io) och skapa ett konto
2. Skapa ett nytt projekt och välj "React Native"
3. Kopiera din DSN (Data Source Name) från projektinställningarna

### 2. Konfigurera DSN

Uppdatera `lib/sentry.ts` och ersätt `YOUR_SENTRY_DSN_HERE` med din riktiga DSN:

```typescript
dsn: 'https://your-dsn@sentry.io/project-id',
```

### 3. Miljövariabler (Rekommenderat)

För säkerhet, lägg till DSN som miljövariabel i `.env`:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

Sedan uppdatera `lib/sentry.ts`:

```typescript
dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
```

## Användning

### Automatisk felrapportering

Sentry är redan konfigurerat att automatiskt fånga:
- JavaScript-fel och undantag
- Unhandled promise rejections
- React Error Boundary-fel

### Manuell felrapportering

```typescript
import { captureException, captureMessage, setUser } from '@/lib/sentry';

// Rapportera ett fel manuellt
try {
  // Din kod här
} catch (error) {
  captureException(error as Error, { 
    extra: 'additional context' 
  });
}

// Skicka ett meddelande
captureMessage('Något viktigt hände', 'info');

// Sätt användarkontext
setUser({
  id: 'user123',
  email: 'user@example.com',
  username: 'johndoe'
});
```

### Breadcrumbs för debugging

```typescript
import { addBreadcrumb } from '@/lib/sentry';

// Lägg till breadcrumbs för att spåra användaraktioner
addBreadcrumb({
  message: 'User clicked button',
  category: 'ui',
  level: 'info',
  data: {
    buttonId: 'submit-form'
  }
});
```

### Tags och kontext

```typescript
import { setTag, setContext } from '@/lib/sentry';

// Sätt tags för filtrering
setTag('feature', 'authentication');
setTag('environment', 'production');

// Sätt kontext för mer information
setContext('device', {
  model: 'iPhone 12',
  os: 'iOS 15.0'
});
```

## Error Boundary

`ErrorBoundary`-komponenten är redan integrerad i appen och kommer automatiskt att:
- Fånga React-renderingsfel
- Rapportera dem till Sentry
- Visa en användarvänlig felskärm
- Tillåta användaren att försöka igen

## Exempel på integrationer

### I en komponent:

```typescript
import React, { useEffect } from 'react';
import { captureException, addBreadcrumb } from '@/lib/sentry';

export const MyComponent = () => {
  useEffect(() => {
    addBreadcrumb({
      message: 'MyComponent mounted',
      category: 'navigation'
    });
  }, []);

  const handleAsyncOperation = async () => {
    try {
      const result = await someAsyncFunction();
      addBreadcrumb({
        message: 'Async operation completed',
        data: { resultId: result.id }
      });
    } catch (error) {
      captureException(error as Error, {
        tags: { component: 'MyComponent' },
        extra: { operation: 'asyncOperation' }
      });
    }
  };

  return (
    // Din komponent JSX
  );
};
```

### I en Context eller Hook:

```typescript
import { useEffect } from 'react';
import { setUser, setContext } from '@/lib/sentry';

export const useAuth = () => {
  const user = // ... din användarlogik

  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        email: user.email
      });
      
      setContext('auth', {
        loginMethod: user.loginMethod,
        lastLogin: user.lastLogin
      });
    }
  }, [user]);

  // ... resten av din hook
};
```

## Produktionskonfiguration

För produktion, justera följande inställningar i `lib/sentry.ts`:

```typescript
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    
    // Minska sample rates för produktion
    tracesSampleRate: 0.1, // 10% av transaktioner
    profilesSampleRate: 0.1, // 10% av profiler
    
    // Stäng av debug i produktion
    debug: false,
    
    // Filtrera bort känslig information
    beforeSend(event) {
      // Ta bort känsliga data från event
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
  });
};
```

## Testning

För att testa att Sentry fungerar, lägg till en testknapp i din app:

```typescript
import { captureException } from '@/lib/sentry';

const TestSentryButton = () => (
  <Button
    onPress={() => {
      captureException(new Error('Test error for Sentry'));
    }}
  >
    Test Sentry
  </Button>
);
```

## Felsökning

1. **Kontrollera att DSN är korrekt** - Verifiera att din DSN är rätt formaterad
2. **Kontrollera nätverksanslutning** - Sentry behöver internetuppkoppling
3. **Kontrollera debug-läge** - I utvecklingsläge loggas Sentry-events till konsolen
4. **Kontrollera Sentry-dashboarden** - Det kan ta några minuter innan events visas

## Säkerhet

- Lagra aldrig DSN i källkoden för publika repositories
- Använd miljövariabler för känslig konfiguration
- Filtrera bort personlig information i `beforeSend`-funktionen
- Sätt lämpliga sample rates för att undvika överanvändning