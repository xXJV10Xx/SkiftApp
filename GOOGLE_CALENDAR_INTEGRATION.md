# Google Kalender Integration

## Översikt
Denna integration möjliggör export av skift från appen till Google Kalender via Google Calendar API.

## Konfiguration

### 1. Miljövariabler
Kopiera `.env.example` till `.env` och fyll i dina Google OAuth-uppgifter:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000
```

### 2. Google Cloud Console Setup
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj ett befintligt
3. Aktivera Google Calendar API
4. Skapa OAuth 2.0-uppgifter (Web Application)
5. Lägg till dina redirect URIs:
   - `http://localhost:3000` (för lokal utveckling)
   - Din produktions-URL (för deployed app)

## Användning

### Importera komponenten
```tsx
import GoogleCalendarExport from '../components/GoogleCalendarExport';
```

### Använd komponenten
```tsx
const events = [
  {
    title: 'Morgonpass',
    description: 'Arbetspass på avdelning A',
    start: new Date('2024-01-15T08:00:00'),
    end: new Date('2024-01-15T16:00:00'),
  },
  // ... fler events
];

<GoogleCalendarExport 
  events={events}
  onExportComplete={() => {
    console.log('Export slutförd!');
  }}
/>
```

### Event-format
Varje event ska ha följande struktur:
```typescript
{
  title: string;           // Händelsens titel
  description?: string;    // Valfri beskrivning
  start: string | Date;    // Starttid
  end: string | Date;      // Sluttid
}
```

## Funktioner

### `exportToGoogleCalendar(events, tokens)`
Exporterar en array av events till användarens primära Google Kalender.

### `getAuthUrl()`
Genererar OAuth URL för Google-autentisering.

### `getTokensFromCode(code)`
Hämtar access och refresh tokens från authorization code.

### `refreshTokens(refreshToken)`
Uppdaterar access token med refresh token.

## Säkerhet
- Tokens lagras endast i komponentens state under sessionen
- Refresh tokens kan användas för att förnya access tokens
- Alla API-anrop görs över HTTPS

## Felsökning

### Vanliga fel
1. **"Invalid redirect URI"**: Kontrollera att redirect URI är korrekt konfigurerad i Google Cloud Console
2. **"Access denied"**: Användaren avbröt autentiseringsprocessen
3. **"Token expired"**: Använd refresh token för att förnya access token

### Debug-tips
- Kontrollera att miljövariablerna är korrekt satta
- Verifiera att Google Calendar API är aktiverad
- Kontrollera nätverksanslutning och CORS-inställningar