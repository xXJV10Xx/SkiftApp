# Privata Chattar för Formulär - Komplett Guide

## 📋 Översikt
Systemet skapar automatiskt privata chattar när användare är intresserade av olika typer av förfrågningar som skickas i gruppchatter. Detta fungerar för alla formulärtyper med samma ansvarsprincip.

## 🔄 Formulärtyper som stöds

### 1. **Skiftbyte-formulär**
- **Knapp**: "Intresserad av byte"
- **Ansvar**: Den som ansökt om skiftbytet ansvarar för att meddela sin chef
- **Chat-typ**: `shift_exchange`

### 2. **Extrajobb-formulär**
- **Knapp**: "Intresserad av jobbet"  
- **Ansvar**: Den som publicerat extrajobbet ansvarar för att meddela sin chef
- **Chat-typ**: `work_extra`

## 🎯 Användarflöde

### **Steg 1: Skicka formulär**
1. Klicka på **➕**-knappen i chatten
2. Välj formulärtyp från menyn:
   - **Skiftbyte**: Ansök om att byta skift med kollega
   - **Extrajobb**: Publicera tillgängligt extrajobb
3. Fyll i formuläret
4. Skicka till gruppchatt

### **Steg 2: Visa intresse**
1. Andra användare ser det strukturerade meddelandet
2. Klickar på intresse-knappen:
   - **"Intresserad av byte"** (skiftbyte)
   - **"Intresserad av jobbet"** (extrajobb)
3. Bekräftar att de vill starta privat chat

### **Steg 3: Privat chat skapas**
1. **Automatisk namngivning**:
   - `"Skiftbyte: Anna & Erik"`
   - `"Extrajobb: Maria & Johan"`
2. **Systemmeddelande** skickas automatiskt
3. **Båda parter** läggs till som medlemmar
4. **Automatisk omdirigering** till den nya chatten

## 💬 Systemmeddelanden

### **Skiftbyte-chat**
```
🔄 **Skiftbyte-chat skapad**

📋 **Viktigt att komma ihåg:**
• Den som ansökt om skiftbytet ansvarar för att meddela sin chef
• Kom överens om alla detaljer innan ni informerar chefen
• Se till att båda parter är överens om bytet

💬 Ni kan nu diskutera detaljerna för ert skiftbyte här!
```

### **Extrajobb-chat**
```
💼 **Extrajobb-chat skapad**

📋 **Viktigt att komma ihåg:**
• Den som publicerat extrajobbet ansvarar för att meddela sin chef
• Kom överens om alla detaljer innan jobbet bekräftas
• Se till att båda parter är överens om villkoren

💬 Ni kan nu diskutera detaljerna för extrajobbet här!
```

## 🛠️ Teknisk Implementation

### **Databastabeller**
```sql
-- Skiftbyte-förfrågningar
shift_change_requests:
- id, requester_id, current_shift_date, current_shift_time
- requested_shift_date, requested_shift_time, reason, status

-- Extrajobb-förfrågningar  
work_extra_requests:
- id, requester_id, date, start_time, end_time
- position, location, description, hourly_rate, status
```

### **Chat-typer**
- `shift_exchange`: Privata chattar för skiftbyte
- `work_extra`: Privata chattar för extrajobb
- `general`: Allmänna gruppchatter

### **Meddelandetyper**
- `text`: Vanliga textmeddelanden
- `shift_change_request`: Skiftbyte-formulär
- `work_extra_request`: Extrajobb-formulär
- `system`: Systemmeddelanden

## 🔒 Säkerhet & Behörigheter

### **RLS-policies**
- Användare ser bara förfrågningar inom sitt företag
- Privata chattar endast synliga för medlemmar
- Automatisk företags-validering

### **Chat-skapande**
- Kontrollerar befintliga chattar (undviker dubletter)
- Automatisk medlemskap för båda parter
- Samma säkerhetsnivå som gruppchatter

## 📱 UI/UX-funktioner

### **Formulärväljare**
- Elegant modal med alternativ
- Tydliga beskrivningar för varje typ
- Konsekvent design

### **Meddelande-kort**
- **Skiftbyte**: Visar nuvarande/önskat skift, anledning, status
- **Extrajobb**: Visar position, tid, plats, lön, beskrivning
- **Status-badges**: Färgkodade för olika tillstånd

### **Intresse-knappar**
- Endast synliga för andra än avsändaren
- Bekräftelsedialoger innan chat skapas
- Automatisk navigation till privat chat

## 🎨 Designprinciper

### **Konsekvent UI**
- Samma designspråk för alla formulärtyper
- Enhetliga färger och typografi
- Responsiv design för mobil/desktop

### **Tydlig kommunikation**
- Explicit ansvarsinformation
- Statusuppdateringar i realtid
- Användarvänliga felmeddelanden

## 🔮 Framtida utökningar

### **Nya formulärtyper**
Systemet är byggt för att enkelt lägga till nya typer:
1. Skapa ny formulärkomponent
2. Lägg till i formulärväljaren
3. Definiera systemmeddelande
4. Skapa databatabell

### **Möjliga tillägg**
- **Semesterbyten**: Byta semesterdagar
- **Utbildningstillfällen**: Anmälan till kurser
- **Vikariat**: Korttidsvikarier
- **Projektgrupper**: Tillfälliga arbetsgrupper

## 📊 Fördelar

### **För användare**
- ✅ Privat diskussion utan att störa gruppchatt
- ✅ Tydlig ansvarsfördelning
- ✅ Strukturerad information
- ✅ Automatisk chat-skapande

### **För organisation**
- ✅ Spårbarhet av förfrågningar
- ✅ Minskad administrativ börda
- ✅ Bättre kommunikation
- ✅ Centraliserad hantering

### **Tekniskt**
- ✅ Skalbar arkitektur
- ✅ Säker datahantering
- ✅ Realtidsuppdateringar
- ✅ Enkel utbyggnad

## 🚀 Användning

Systemet är nu fullt implementerat och redo att användas för både skiftbyte och extrajobb-förfrågningar, med samma smidiga privata chat-funktionalitet för alla formulärtyper!