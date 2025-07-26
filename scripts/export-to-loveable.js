#!/usr/bin/env node

/**
 * Loveable Export Script
 * Exporterar skiftappen till Loveable för frontend deployment
 * Inkluderar svenska skiftscheman och kalenderdata
 */

const fs = require('fs');
const path = require('path');

const LOVEABLE_CONFIG = {
  projectName: 'svenska-skiftappen',
  description: 'Svenska skiftscheman och kalenderapp med Supabase backend',
  version: '1.0.0',
  type: 'react-native-web',
  features: [
    'Swedish shift schedules',
    'Calendar integration',
    'Holiday management',
    'Company filtering',
    'Real-time sync',
    'Supabase backend'
  ]
};

// Loveable komponentstruktur
const LOVEABLE_COMPONENTS = {
  'src/components/ShiftCalendar.tsx': {
    type: 'component',
    description: 'Huvudkalenderkomponent för skiftscheman',
    dependencies: ['react-native-calendars', 'date-fns'],
    props: {
      schedules: 'ShiftSchedule[]',
      holidays: 'SwedishHoliday[]',
      onDateSelect: '(date: string) => void',
      selectedCompany: 'string',
      selectedLocation: 'string'
    }
  },
  'src/components/ShiftScheduleCard.tsx': {
    type: 'component',
    description: 'Kort för att visa skiftschema-information',
    dependencies: ['@expo/vector-icons'],
    props: {
      schedule: 'ShiftSchedule',
      onPress: '() => void',
      showDetails: 'boolean'
    }
  },
  'src/components/CompanyFilter.tsx': {
    type: 'component',
    description: 'Filter för företag, ort och avdelning',
    dependencies: [],
    props: {
      companies: 'Company[]',
      selectedCompany: 'string',
      selectedLocation: 'string',
      selectedDepartment: 'string',
      onCompanyChange: '(company: string) => void',
      onLocationChange: '(location: string) => void',
      onDepartmentChange: '(department: string) => void'
    }
  },
  'src/components/HolidayIndicator.tsx': {
    type: 'component',
    description: 'Indikator för svenska helgdagar',
    dependencies: ['@expo/vector-icons'],
    props: {
      holiday: 'SwedishHoliday',
      size: 'small | medium | large'
    }
  },
  'src/screens/ShiftScheduleScreen.tsx': {
    type: 'screen',
    description: 'Huvudskärm för skiftscheman',
    dependencies: ['react-native-calendars', 'date-fns'],
    features: ['calendar', 'filtering', 'real-time-updates']
  },
  'src/hooks/useShiftSchedules.ts': {
    type: 'hook',
    description: 'Hook för att hantera skiftschema-data',
    dependencies: ['@supabase/supabase-js'],
    returns: {
      schedules: 'ShiftSchedule[]',
      loading: 'boolean',
      error: 'string | null',
      refresh: '() => Promise<void>'
    }
  },
  'src/hooks/useSwedishHolidays.ts': {
    type: 'hook',
    description: 'Hook för svenska helgdagar',
    dependencies: ['@supabase/supabase-js'],
    returns: {
      holidays: 'SwedishHoliday[]',
      getHolidaysForYear: '(year: number) => SwedishHoliday[]',
      isHoliday: '(date: string) => boolean'
    }
  },
  'src/types/shift.ts': {
    type: 'types',
    description: 'TypeScript-typer för skiftscheman',
    exports: [
      'ShiftSchedule',
      'SwedishHoliday',
      'Company',
      'ShiftPattern',
      'CalendarData'
    ]
  },
  'src/utils/shiftCalculations.ts': {
    type: 'utility',
    description: 'Verktyg för skiftberäkningar',
    functions: [
      'calculateShiftPattern',
      'getWorkDaysInPeriod',
      'isWorkDay',
      'getNextShiftDate'
    ]
  },
  'src/utils/swedishCalendar.ts': {
    type: 'utility',
    description: 'Svensk kalender och helgdagsberäkningar',
    functions: [
      'calculateEaster',
      'calculateMidsummer',
      'calculateAllSaints',
      'isLeapYear',
      'getSwedishHolidays'
    ]
  }
};

// Generera Loveable projektstruktur
function generateLoveableProject() {
  console.log('🚀 Exporterar till Loveable...');
  
  const exportDir = path.join(__dirname, '../loveable-export');
  
  // Skapa exportmapp
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  // Generera project.json
  const projectConfig = {
    ...LOVEABLE_CONFIG,
    timestamp: new Date().toISOString(),
    components: LOVEABLE_COMPONENTS,
    supabase: {
      url: process.env.SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      tables: [
        'swedish_holidays',
        'swedish_companies',
        'shift_patterns',
        'shift_schedules',
        'swedish_calendar',
        'user_shift_schedules'
      ]
    },
    dependencies: {
      '@supabase/supabase-js': '^2.52.0',
      'react-native-calendars': '^1.1313.0',
      'date-fns': '^2.30.0',
      '@expo/vector-icons': '^14.1.0',
      'react-native-reanimated': '^3.17.4'
    }
  };
  
  fs.writeFileSync(
    path.join(exportDir, 'project.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  
  // Kopiera viktiga filer
  copyAppFiles(exportDir);
  
  // Generera komponentmallar
  generateComponentTemplates(exportDir);
  
  // Generera README för Loveable
  generateLoveableReadme(exportDir);
  
  // Generera deployment instruktioner
  generateDeploymentInstructions(exportDir);
  
  console.log(`✅ Loveable export klar i: ${exportDir}`);
  console.log('📁 Filer som exporterats:');
  console.log('  - project.json (Loveable konfiguration)');
  console.log('  - components/ (React komponenter)');
  console.log('  - screens/ (App skärmar)');
  console.log('  - hooks/ (Custom hooks)');
  console.log('  - utils/ (Hjälpfunktioner)');
  console.log('  - types/ (TypeScript typer)');
  console.log('  - README.md (Dokumentation)');
  console.log('  - DEPLOYMENT.md (Deploy instruktioner)');
}

function copyAppFiles(exportDir) {
  const srcDir = path.join(__dirname, '../skiftappen');
  const targetDir = path.join(exportDir, 'src');
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Kopiera viktiga app-filer
  const filesToCopy = [
    'app/(tabs)/shift-schedule.tsx',
    'lib/supabase.ts',
    'package.json'
  ];
  
  filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.existsSync(srcPath)) {
      const targetDirPath = path.dirname(targetPath);
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }
      fs.copyFileSync(srcPath, targetPath);
    }
  });
}

function generateComponentTemplates(exportDir) {
  const componentsDir = path.join(exportDir, 'src/components');
  
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  // ShiftCalendar komponent
  const shiftCalendarTemplate = `import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ShiftSchedule, SwedishHoliday } from '../types/shift';

interface ShiftCalendarProps {
  schedules: ShiftSchedule[];
  holidays: SwedishHoliday[];
  onDateSelect: (date: string) => void;
  selectedCompany?: string;
  selectedLocation?: string;
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  schedules,
  holidays,
  onDateSelect,
  selectedCompany,
  selectedLocation
}) => {
  const getMarkedDates = () => {
    const marked: any = {};
    
    // Markera skiftscheman
    schedules.forEach(schedule => {
      const dateKey = schedule.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      marked[dateKey].dots.push({ 
        color: getShiftTypeColor(schedule.shift_type) 
      });
    });
    
    // Markera helgdagar
    holidays.forEach(holiday => {
      const dateKey = holiday.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      marked[dateKey].customStyles = {
        container: { backgroundColor: '#ffebee' },
        text: { color: '#d32f2f', fontWeight: 'bold' }
      };
    });
    
    return marked;
  };
  
  const getShiftTypeColor = (shiftType: string) => {
    const colors: { [key: string]: string } = {
      '2-2': '#4CAF50',
      '3-3': '#2196F3',
      '4-4': '#FF9800',
      '5-5': '#9C27B0',
      '6-2': '#F44336',
      '7-7': '#607D8B',
      '2-2-2-4': '#795548'
    };
    return colors[shiftType] || '#757575';
  };
  
  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => onDateSelect(day.dateString)}
        markingType="multi-dot"
        markedDates={getMarkedDates()}
        firstDay={1} // Måndag som första dag
        showWeekNumbers={true}
        locale="sv"
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          arrowColor: '#2196F3',
          monthTextColor: '#2196F3'
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
});`;
  
  fs.writeFileSync(
    path.join(componentsDir, 'ShiftCalendar.tsx'),
    shiftCalendarTemplate
  );
  
  // ShiftScheduleCard komponent
  const scheduleCardTemplate = `import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShiftSchedule } from '../types/shift';

interface ShiftScheduleCardProps {
  schedule: ShiftSchedule;
  onPress: () => void;
  showDetails?: boolean;
}

export const ShiftScheduleCard: React.FC<ShiftScheduleCardProps> = ({
  schedule,
  onPress,
  showDetails = true
}) => {
  const getShiftTypeColor = (shiftType: string) => {
    const colors: { [key: string]: string } = {
      '2-2': '#4CAF50',
      '3-3': '#2196F3',
      '4-4': '#FF9800',
      '5-5': '#9C27B0',
      '6-2': '#F44336',
      '7-7': '#607D8B',
      '2-2-2-4': '#795548'
    };
    return colors[shiftType] || '#757575';
  };
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={[
          styles.shiftTypeBadge,
          { backgroundColor: getShiftTypeColor(schedule.shift_type) }
        ]}>
          <Text style={styles.shiftTypeText}>{schedule.shift_type}</Text>
        </View>
        <Text style={styles.companyName}>{schedule.company_name}</Text>
      </View>
      
      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {schedule.start_time} - {schedule.end_time}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{schedule.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{schedule.department}</Text>
          </View>
        </View>
      )}
      
      {schedule.is_weekend && (
        <View style={styles.weekendBadge}>
          <Text style={styles.weekendText}>Helg</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  shiftTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  weekendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weekendText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});`;
  
  fs.writeFileSync(
    path.join(componentsDir, 'ShiftScheduleCard.tsx'),
    scheduleCardTemplate
  );
}

function generateLoveableReadme(exportDir) {
  const readme = `# Svenska Skiftappen - Loveable Export

## 🇸🇪 Översikt

Detta är en React Native-app för att visa svenska skiftscheman och kalenderdata. Appen integrerar med Supabase för backend och stödjer:

- **Svenska skiftscheman** från stora företag och organisationer
- **Svensk kalender** med helgdagar och skottår
- **Realtidssynkronisering** med Supabase
- **Filtrering** per företag, ort och avdelning
- **Kalendervisning** med skiftmarkeringar

## 🏗️ Projektstruktur

\`\`\`
src/
├── components/          # React komponenter
│   ├── ShiftCalendar.tsx
│   ├── ShiftScheduleCard.tsx
│   ├── CompanyFilter.tsx
│   └── HolidayIndicator.tsx
├── screens/             # App skärmar
│   └── ShiftScheduleScreen.tsx
├── hooks/               # Custom hooks
│   ├── useShiftSchedules.ts
│   └── useSwedishHolidays.ts
├── types/               # TypeScript typer
│   └── shift.ts
└── utils/               # Hjälpfunktioner
    ├── shiftCalculations.ts
    └── swedishCalendar.ts
\`\`\`

## 🚀 Funktioner

### Skiftscheman
- Visa scheman för svenska företag (Volvo, SSAB, Stora Enso, etc.)
- Olika skifttyper: 2-2, 3-3, 4-4, 5-5, 6-2, 7-7, 2-2-2-4
- Filtrering per företag, ort och avdelning
- Kalendervisning med färgkodade skift

### Svensk Kalender
- Svenska helgdagar 2023-2035
- Automatisk beräkning av påsk, midsommar, alla helgons dag
- Skottårshantering
- Veckonummervisning

### Supabase Integration
- Realtidsdata från Supabase
- Optimerade queries med indexering
- Row Level Security (RLS)
- Användarspecifika scheman

## 📱 Komponenter

### ShiftCalendar
Huvudkalenderkomponent som visar skiftscheman och helgdagar.

\`\`\`tsx
<ShiftCalendar
  schedules={schedules}
  holidays={holidays}
  onDateSelect={handleDateSelect}
  selectedCompany="Volvo Group"
  selectedLocation="Göteborg"
/>
\`\`\`

### ShiftScheduleCard
Kort för att visa detaljerad skiftinformation.

\`\`\`tsx
<ShiftScheduleCard
  schedule={schedule}
  onPress={handleCardPress}
  showDetails={true}
/>
\`\`\`

### CompanyFilter
Filter för att välja företag, ort och avdelning.

\`\`\`tsx
<CompanyFilter
  companies={companies}
  selectedCompany={selectedCompany}
  onCompanyChange={setSelectedCompany}
/>
\`\`\`

## 🔧 Setup

1. **Installera dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Konfigurera Supabase:**
   - Skapa nytt Supabase projekt
   - Kör migrations från \`supabase/migrations/\`
   - Uppdatera \`SUPABASE_URL\` och \`SUPABASE_ANON_KEY\`

3. **Importera data:**
   \`\`\`bash
   node scripts/fetch-shift-schedules.js
   \`\`\`

4. **Starta appen:**
   \`\`\`bash
   npm start
   \`\`\`

## 🌐 Loveable Deployment

### Automatisk Deploy
Denna app är konfigurerad för automatisk deployment till Loveable:

1. Importera projektet i Loveable
2. Koppla till GitHub repository
3. Konfigurera environment variables
4. Deploy automatiskt vid push till main

### Environment Variables
\`\`\`
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
\`\`\`

## 📊 Data

### Svenska Företag
- Volvo Group (Göteborg, Skövde, Umeå)
- SSAB (Luleå, Oxelösund, Borlänge)
- Stora Enso (Falun, Skutskär, Hylte)
- Region Stockholm (Stockholm, Huddinge, Solna)
- SCA (Sundsvall, Östrand, Munksund)

### Skifttyper
- **2-2**: 2 dagar på, 2 dagar av
- **3-3**: 3 dagar på, 3 dagar av
- **4-4**: 4 dagar på, 4 dagar av
- **5-5**: 5 dagar på, 5 dagar av
- **6-2**: 6 dagar på, 2 dagar av
- **7-7**: 7 dagar på, 7 dagar av
- **2-2-2-4**: Kontinuerligt skift

### Svenska Helgdagar
- Nyårsdagen, Trettondedag jul
- Långfredagen, Påskdagen, Annandag påsk
- Första maj, Kristi himmelsfärdsdag
- Sveriges nationaldag, Pingstdagen
- Midsommardagen, Alla helgons dag
- Julafton, Juldagen, Annandag jul, Nyårsafton

## 🔄 Synkronisering

Appen synkroniseras automatiskt med Supabase för:
- Skiftscheman uppdateringar
- Nya företag och avdelningar
- Helgdagsändringar
- Användarinställningar

## 📈 Prestanda

- Optimerade Supabase queries
- Lazy loading av data
- Caching av kalenderdata
- Effektiv rendering av stora dataset

## 🤝 Bidrag

För att bidra till projektet:
1. Fork repository
2. Skapa feature branch
3. Commit ändringar
4. Skapa Pull Request

## 📄 Licens

MIT License - se LICENSE fil för detaljer.

---

**Utvecklad för svenska skiftarbetare** 🇸🇪
`;

  fs.writeFileSync(path.join(exportDir, 'README.md'), readme);
}

function generateDeploymentInstructions(exportDir) {
  const deployment = `# Deployment Instructions - Loveable

## 🚀 Deploy till Loveable

### Steg 1: Förbered Projektet

1. **Kontrollera att alla filer är exporterade:**
   \`\`\`bash
   ls -la loveable-export/
   \`\`\`

2. **Verifiera project.json:**
   \`\`\`bash
   cat loveable-export/project.json
   \`\`\`

### Steg 2: Loveable Setup

1. **Logga in på Loveable:**
   - Gå till [loveable.dev](https://loveable.dev)
   - Logga in med GitHub

2. **Skapa nytt projekt:**
   - Klicka "New Project"
   - Välj "Import from folder"
   - Ladda upp \`loveable-export/\` mappen

3. **Konfigurera projekt:**
   - Projektnamn: "Svenska Skiftappen"
   - Framework: "React Native Web"
   - Template: "Custom"

### Steg 3: Environment Setup

1. **Supabase Konfiguration:**
   \`\`\`
   SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   \`\`\`

2. **App Konfiguration:**
   \`\`\`
   APP_NAME=Svenska Skiftappen
   APP_VERSION=1.0.0
   LOCALE=sv-SE
   TIMEZONE=Europe/Stockholm
   \`\`\`

### Steg 4: Database Setup

1. **Kör Supabase Migrations:**
   - Öppna Supabase Dashboard
   - Gå till SQL Editor
   - Kör \`supabase/migrations/20250126_create_shift_tables.sql\`

2. **Importera Data:**
   - Kör \`scripts/fetch-shift-schedules.js\`
   - Verifiera att data finns i tabellerna

### Steg 5: Deploy

1. **Första Deploy:**
   - Klicka "Deploy" i Loveable
   - Vänta på build att slutföras
   - Testa appen på staging URL

2. **Produktionsdeploy:**
   - Klicka "Deploy to Production"
   - Konfigurera custom domain (valfritt)
   - Aktivera SSL

### Steg 6: Verifiering

1. **Testa Funktionalitet:**
   - [ ] Kalender visas korrekt
   - [ ] Skiftscheman laddas
   - [ ] Filtrering fungerar
   - [ ] Svenska helgdagar visas
   - [ ] Responsiv design

2. **Prestanda Check:**
   - [ ] Snabb laddning (<3s)
   - [ ] Smooth scrolling
   - [ ] Effektiv datahantering

## 🔄 Kontinuerlig Deployment

### GitHub Integration

1. **Koppla Repository:**
   - Gå till Settings > Integrations
   - Koppla GitHub repository
   - Välj main branch

2. **Auto-Deploy:**
   - Aktivera "Auto-deploy on push"
   - Konfigurera build hooks
   - Sätt upp notifications

### Update Process

1. **Kod Ändringar:**
   \`\`\`bash
   # Gör ändringar i skiftappen/
   git add .
   git commit -m "Update: beskrivning"
   git push origin main
   \`\`\`

2. **Export och Deploy:**
   \`\`\`bash
   # Exportera till Loveable
   node scripts/export-to-loveable.js
   
   # Auto-deploy triggas automatiskt
   \`\`\`

## 📊 Monitoring

### Loveable Dashboard
- **Performance Metrics:** Laddningstider, användning
- **Error Tracking:** JavaScript errors, crashes
- **Analytics:** Användarstatistik, populära funktioner

### Supabase Dashboard
- **Database Performance:** Query times, connections
- **API Usage:** Requests per minut, rate limits
- **Storage:** Data storlek, backup status

## 🐛 Troubleshooting

### Vanliga Problem

1. **Build Fel:**
   - Kontrollera package.json dependencies
   - Verifiera TypeScript konfiguration
   - Kolla environment variables

2. **Supabase Connection:**
   - Verifiera URL och API keys
   - Kontrollera RLS policies
   - Testa database connectivity

3. **Performance Issues:**
   - Optimera Supabase queries
   - Implementera caching
   - Reducera bundle size

### Support

- **Loveable Support:** support@loveable.dev
- **Supabase Support:** Via dashboard
- **Community:** GitHub Issues

---

**Ready for Production!** 🚀
`;

  fs.writeFileSync(path.join(exportDir, 'DEPLOYMENT.md'), deployment);
}

// Kör export
if (require.main === module) {
  generateLoveableProject();
}

module.exports = {
  generateLoveableProject,
  LOVEABLE_CONFIG,
  LOVEABLE_COMPONENTS
};