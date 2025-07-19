# 📋 Skiftscheman Dokumentation - Komplett Guide

## 🏭 Företag och Skiftscheman Översikt

Denna dokumentation innehåller detaljerade skiftscheman för Sveriges största industriföretag. Alla scheman är beräknade för att fungera 2 år framåt och bakåt från startdatum 2024-01-01.

---

## 🏢 Företagslista (33 företag)

### Stora Industriföretag
1. **SSAB** - Stål och järn
2. **Volvo** - Lastbilar och entreprenadmaskiner  
3. **Scania** - Lastbilar och bussar
4. **Sandvik** - Verktyg och material
5. **SKF** - Kullager och tätningar
6. **Boliden** - Gruva och mineral
7. **LKAB** - Järnmalm och mineral

### Skogs- och Pappersindustri
8. **Stora Enso** - Skog och papper
9. **SCA** - Skog och papper
10. **Södra Cell** - Massa och papper
11. **Billerud** - Förpackningsmaterial
12. **Nordic Paper** - Pappersmassa
13. **Arctic Paper** - Grafiskt papper

### Kemisk Industri
14. **AGA** - Industriella gaser
15. **Preem** - Raffinaderi och petroleum
16. **Orica** - Sprängämnen och kemikalier
17. **Cambrex** - Läkemedel och kemikalier

### Livsmedel och Konsument
18. **Barilla** - Pasta och livsmedel
19. **Finess** - Livsmedel

### Teknologi och Verktyg
20. **Seco** - Skärverktyg
21. **Uddeholm** - Specialstål och verktyg
22. **Voestalpine** - Precision Strip
23. **Outokumpu** - Rostfritt stål
24. **Ovako** - Specialstål
25. **Schneider** - Elektroteknik
26. **Truck Service AB** - Truckar och maskiner

### Offentlig Sektor
27. **Avesta kommun** - Kommunal verksamhet
28. **Borlänge kommun** - Kommunal verksamhet
29. **Borlänge Energi** - Energiförsörjning
30. **Landstinget Dalarna** - Sjukvård

### Övriga
31. **Dentsply** - Dentala produkter
32. **Kubal** - Aluminium
33. **Ryssviken** - Verksamhet

---

## 🔄 Skifttyper och Mönster

### 2-Skift System
**Användning:** Volvo, Voestalpine, Uddeholm Tooling, Truck Service AB

**Mönster exempel (Volvo 2-skift):**
- Cykel: 14 dagar
- Mönster: `['M', 'M', 'M', 'M', 'M', 'L', 'L', 'A', 'A', 'A', 'A', 'A', 'L', 'L']`
- M = Morgon (06:00-14:00)
- A = Kväll (14:00-22:00)
- L = Ledig

### 3-Skift System
**Användning:** Volvo, SCA, SSAB, Boliden, Sandvik, Arctic Paper

**Mönster exempel (SSAB 3-skift):**
- Cykel: 14 dagar
- Mönster: `['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L']`
- M = Morgon (06:00-14:00)
- A = Kväll (14:00-22:00)
- N = Natt (22:00-06:00)
- L = Ledig

### 5-Skift System
**Användning:** Barilla, ABB HVDC, Stora Enso

**Mönster exempel (Barilla 5-skift):**
- Cykel: 8 dagar
- Mönster: `['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L']`
- F = Förmiddag (06:00-14:00)
- E = Eftermiddag (14:00-22:00)
- N = Natt (22:00-06:00)
- L = Ledig

### 6-Skift System
**Användning:** Aga Avesta, Avesta 6-veckors

**Mönster exempel (Aga Avesta 6-skift):**
- Cykel: 18 dagar
- Kontinuerligt schema med roterande skift

---

## 👥 Lagindelning och Färgkoder

### Volvo
- **Lag:** A, B, C, D
- **Färger:** 
  - A: #FF6B6B (Röd)
  - B: #4ECDC4 (Turkos)
  - C: #45B7D1 (Blå)
  - D: #96CEB4 (Grön)

### SSAB
- **Lag:** 1, 2, 3, 4, 5
- **Färger:**
  - 1: #FF6B35 (Orange)
  - 2: #004E89 (Marinblå)
  - 3: #1A936F (Grön)
  - 4: #C6426E (Rosa)
  - 5: #6F1E51 (Lila)

### Barilla Sverige
- **Lag:** 1, 2, 3, 4, 5
- **5-skiftssystem med kontinuerlig produktion**

### Aga Avesta
- **Lag:** A, B, C, D, E, F
- **6-skiftssystem med kontinuerlig drift**

---

## 📅 Cykelberäkningar

### Beräkningsmetod
Alla scheman beräknas från startdatum **2024-01-01** med följande formel:

```javascript
const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
const teamOffset = getTeamOffset(team, shiftType);
const adjustedDaysDiff = daysDiff + teamOffset;
const cyclePosition = ((adjustedDaysDiff % shiftType.cycle) + shiftType.cycle) % shiftType.cycle;
const shiftCode = shiftType.pattern[cyclePosition];
```

### Teamoffset
- Varje lag har en offset baserat på cykelns längd
- Team A/1 börjar på dag 0
- Team B/2 börjar på dag (cykel/antal_lag)
- Och så vidare...

---

## 🕐 Arbetstider per Skifttyp

### Standardtider
- **Morgon/Dag:** 06:00-14:00 (8 timmar)
- **Kväll/Eftermiddag:** 14:00-22:00 (8 timmar)
- **Natt:** 22:00-06:00 (8 timmar)

### Specialtider
- **Dag 12h:** 06:00-18:00 (12 timmar)
- **Natt 12h:** 18:00-06:00 (12 timmar)
- **Helgskift:** Varierar per företag

---

## 🔧 Teknisk Implementation

### Datastruktur
```javascript
COMPANIES = {
  FORETAG_ID: {
    id: 'foretag_id',
    name: 'Företagsnamn',
    description: 'Beskrivning',
    shifts: ['SHIFT_TYPE_1', 'SHIFT_TYPE_2'],
    teams: ['A', 'B', 'C'],
    colors: { A: '#COLOR1', B: '#COLOR2' }
  }
}

SHIFT_TYPES = {
  SHIFT_ID: {
    id: 'shift_id',
    name: 'Skiftnamn',
    pattern: ['M', 'A', 'N', 'L'],
    cycle: 4,
    times: {
      M: { start: '06:00', end: '14:00', name: 'Morgon' }
    }
  }
}
```

### Schemagenererare
- `generateMonthSchedule()` - Genererar månadsschema
- `generateYearSchedule()` - Genererar årsschema
- `calculateShiftForDate()` - Beräknar skift för specifikt datum
- `calculateWorkedHours()` - Beräknar arbetade timmar

---

## 📊 Schemaexempel

### SSAB 3-skift, Lag 1, Januari 2024
```
Dag 1: Morgon (06:00-14:00)
Dag 2: Morgon (06:00-14:00)
Dag 3: Morgon (06:00-14:00)
Dag 4: Kväll (14:00-22:00)
Dag 5: Kväll (14:00-22:00)
Dag 6: Kväll (14:00-22:00)
Dag 7: Natt (22:00-06:00)
Dag 8: Natt (22:00-06:00)
Dag 9: Natt (22:00-06:00)
Dag 10-14: Ledig
Dag 15: Morgon (06:00-14:00) [Cykel börjar om]
```

### Barilla 5-skift, Lag 3, Januari 2024
```
Dag 1: Natt (22:00-06:00)
Dag 2: Natt (22:00-06:00)
Dag 3: Ledig
Dag 4: Ledig
Dag 5: Förmiddag (06:00-14:00)
Dag 6: Förmiddag (06:00-14:00)
Dag 7: Eftermiddag (14:00-22:00)
Dag 8: Eftermiddag (14:00-22:00)
Dag 9: Natt (22:00-06:00) [Cykel börjar om]
```

---

## 🎯 Användning för AI-verktyg

### För Claude AI / Loveable
Denna dokumentation kan användas för att:
1. Implementera skiftscheman i andra appar
2. Skapa kalender-widgets
3. Beräkna arbetstider och övertid
4. Hantera automatisk schemaläggning
5. Integrera med HR-system

### Dataformat
Alla scheman är strukturerade som JSON-kompatibla objekt och kan enkelt exporteras/importeras mellan system.

### Validering
- Alla cykler är testade för 2 år framåt och bakåt
- Skift roterar korrekt mellan lag
- Arbetstider följer svenska arbetsmiljöregler

---

## 📝 Anteckningar

- Startdatum: 2024-01-01
- Alla tider i svensk tid (CET/CEST)
- Helger hanteras enligt svensk kalender
- Semesterperioder kan läggas till per företag
- OB-tillägg beräknas enligt kollektivavtal

**Senast uppdaterad:** 2025-01-18
**Version:** 1.0
**Antal företag:** 33
**Antal skifttyper:** 15+

---

*Denna dokumentation innehåller alla scheman som behövs för att implementera en fullständig skiftschema-app för Sveriges största industriföretag.* 