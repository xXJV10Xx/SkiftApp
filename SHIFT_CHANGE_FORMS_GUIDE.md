# Skiftbyte-formulär i Chat - Användarguide

## Översikt
Nu kan användare skicka färdiga skiftbyte-formulär direkt i chatten istället för bara textmeddelanden. Detta gör det enklare att hantera skiftbyten strukturerat och effektivt.

## Hur det fungerar

### 1. Skicka skiftbyte-förfrågan
1. Öppna en chattkanal
2. Klicka på **+**-knappen bredvid meddelandefältet
3. Fyll i skiftbyte-formuläret:
   - **Nuvarande skift**: Datum och tid för ditt nuvarande skift
   - **Önskat skift**: Datum och tid för det skift du vill byta till
   - **Anledning**: Förklara varför du behöver byta skift
4. Klicka på **"Skicka förfrågan"**

### 2. Hantera mottagna förfrågningar
När någon skickar en skiftbyte-förfrågan i chatten visas den som ett strukturerat kort med:
- Nuvarande och önskat skift
- Anledning till bytet
- Status (Väntar på svar, Godkänd, Avvisad)
- Knappar för att godkänna eller avvisa (om det inte är din egen förfrågan)

### 3. Godkänna eller avvisa förfrågningar
- Klicka på **"Godkänn"** för att acceptera skiftbytet
- Klicka på **"Avvisa"** för att neka skiftbytet
- Ett bekräftelsemeddelande skickas automatiskt i chatten

## Tekniska detaljer

### Databasstruktur
```sql
shift_change_requests:
- id: Unikt ID för förfrågan
- requester_id: ID för den som begär bytet
- current_shift_date: Nuvarande skiftdatum
- current_shift_time: Nuvarande skifttid
- requested_shift_date: Önskat skiftdatum
- requested_shift_time: Önskad skifttid
- reason: Anledning till bytet
- status: pending/approved/rejected
- approved_by/rejected_by: Vem som godkände/avvisade
- created_at/updated_at: Tidsstämplar
```

### Meddelandetyper
- `text`: Vanliga textmeddelanden
- `shift_change_request`: Skiftbyte-formulär
- `system`: Systemmeddelanden (bekräftelser)

### Komponenter
- **ShiftChangeForm**: Formulär för att skapa skiftbyte-förfrågningar
- **ShiftChangeMessage**: Visar skiftbyte-förfrågningar i chatten
- **ChatContext**: Hanterar skicka/godkänna/avvisa funktionalitet

## Säkerhet och behörigheter
- Användare kan bara se skiftbyte-förfrågningar inom sitt företag
- Endast användare i samma företag kan godkänna/avvisa förfrågningar
- RLS (Row Level Security) säkerställer dataskydd
- Alla ändringar loggas med tidsstämplar

## Användningsfall
1. **Akut skiftbyte**: När någon blir sjuk eller får förhinder
2. **Planerat byte**: För semester eller andra planerade aktiviteter  
3. **Schemaoptimering**: Byta skift för bättre arbetsbalans
4. **Täckning**: Hjälpa kollegor som behöver täckning

## Fördelar
- ✅ Strukturerad data istället för fritext
- ✅ Tydlig status-tracking
- ✅ Enkel godkännande/avvisning
- ✅ Automatiska bekräftelser
- ✅ Historik av alla skiftbyten
- ✅ Integrerat med befintlig chat-funktionalitet

## Framtida förbättringar
- Push-notifikationer för nya förfrågningar
- Automatisk schemauppdatering vid godkännande
- Bulk-hantering av flera förfrågningar
- Rapporter över skiftbyten
- Integration med kalender-system