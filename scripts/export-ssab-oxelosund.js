#!/usr/bin/env node

/**
 * 🏭 SSAB Oxelösund 3-skift Export Script
 * Exporterar lag 31-35 till Loveable.dev, Supabase och GitHub
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// SSAB Oxelösund data definition
const SSAB_OXELOSUND = {
  id: 'ssab_oxelosund',
  name: 'SSAB Oxelösund',
  description: 'Stål och järn - Oxelösund anläggning',
  location: 'Oxelösund, Sverige',
  shifts: ['SSAB_3SKIFT'],
  teams: ['31', '32', '33', '34', '35'],
  departments: ['Masugn', 'Stålverk', 'Varmvalsning', 'Kallvalsning', 'Underhåll', 'Råmaterial', 'Kvalitet'],
  colors: {
    '31': '#FF6B35',
    '32': '#004E89',
    '33': '#1A936F',
    '34': '#C6426E',
    '35': '#6F1E51'
  }
};

const SSAB_3SKIFT = {
  id: 'ssab_3skift',
  name: 'SSAB 3-skift',
  description: 'Kontinuerligt 3-skiftssystem',
  pattern: ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L'],
  cycle: 14,
  times: {
    'M': { start: '06:00', end: '14:00', name: 'Morgon' },
    'A': { start: '14:00', end: '22:00', name: 'Kväll' },
    'N': { start: '22:00', end: '06:00', name: 'Natt' },
    'L': { start: '', end: '', name: 'Ledig' }
  }
};

// Helper functions
function calculateShiftForDate(date, shiftType, team, startDate = new Date('2024-01-01')) {
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const teamOffset = getTeamOffset(team, shiftType);
  const adjustedDaysDiff = daysDiff + teamOffset;
  const cyclePosition = ((adjustedDaysDiff % shiftType.cycle) + shiftType.cycle) % shiftType.cycle;
  const shiftCode = shiftType.pattern[cyclePosition];

  return {
    code: shiftCode,
    time: shiftType.times[shiftCode],
    cycleDay: cyclePosition + 1,
    totalCycleDays: shiftType.cycle
  };
}

function getTeamOffset(team, shiftType) {
  const teamIndex = SSAB_OXELOSUND.teams.indexOf(team);
  if (teamIndex === -1) return 0;
  
  const offsetPerTeam = Math.floor(shiftType.cycle / SSAB_OXELOSUND.teams.length);
  return teamIndex * offsetPerTeam;
}

function generateMonthSchedule(year, month, shiftType, team) {
  const schedule = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const shift = calculateShiftForDate(date, shiftType, team);
    
    schedule.push({
      date: date,
      day: day,
      shift: shift,
      isToday: isToday(date),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  
  return schedule;
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

console.log('🏭 SSAB Oxelösund 3-skift Export');
console.log('================================');
console.log(`📍 Anläggning: ${SSAB_OXELOSUND.name}`);
console.log(`📍 Plats: ${SSAB_OXELOSUND.location}`);
console.log(`👥 Lag: ${SSAB_OXELOSUND.teams.join(', ')}`);
console.log(`⏰ Skifttyp: ${SSAB_3SKIFT.name}`);
console.log('');

// Generera data för alla lag (31-35)
const exportData = {
  facility: SSAB_OXELOSUND,
  shiftType: SSAB_3SKIFT,
  teams: {},
  schedules: {},
  timestamp: new Date().toISOString()
};

// Generera scheman för varje lag
SSAB_OXELOSUND.teams.forEach(team => {
  console.log(`📋 Genererar schema för Lag ${team}...`);
  
  // Generera schema för 2024 (hela året)
  const yearSchedule = [];
  for (let month = 0; month < 12; month++) {
    const monthSchedule = generateMonthSchedule(2024, month, SSAB_3SKIFT, team);
    yearSchedule.push(...monthSchedule);
  }
  
  exportData.teams[team] = {
    id: team,
    name: `Lag ${team}`,
    color: SSAB_OXELOSUND.colors[team],
    totalDays: yearSchedule.length,
    workDays: yearSchedule.filter(day => day.shift.code !== 'L').length,
    offDays: yearSchedule.filter(day => day.shift.code === 'L').length
  };
  
  exportData.schedules[team] = yearSchedule;
});

// Skapa export-mapp
const exportDir = path.join(__dirname, '..', 'exports', 'ssab-oxelosund');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// 1. Exportera till JSON
const jsonFile = path.join(exportDir, 'ssab-oxelosund-3skift-lag-31-35.json');
fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));
console.log(`✅ JSON export: ${jsonFile}`);

// 2. Exportera till CSV för varje lag
SSAB_OXELOSUND.teams.forEach(team => {
  const csvFile = path.join(exportDir, `lag-${team}-schema-2024.csv`);
  const schedule = exportData.schedules[team];
  
  let csvContent = 'Datum,Dag,Skift,Starttid,Sluttid,Skifttyp,Helg\n';
  schedule.forEach(day => {
    const date = day.date.toISOString().split('T')[0];
    const dayName = day.date.toLocaleDateString('sv-SE', { weekday: 'long' });
    csvContent += `${date},${dayName},${day.shift.code},${day.shift.time.start || ''},${day.shift.time.end || ''},${day.shift.time.name},${day.isWeekend}\n`;
  });
  
  fs.writeFileSync(csvFile, csvContent);
  console.log(`✅ CSV export Lag ${team}: ${csvFile}`);
});

// 3. Skapa Supabase SQL insert script
const sqlFile = path.join(exportDir, 'supabase-insert-ssab-oxelosund.sql');
let sqlContent = `-- SSAB Oxelösund 3-skift Lag 31-35 - Supabase Insert Script
-- Genererad: ${new Date().toISOString()}

-- Sätt in företaget
INSERT INTO companies (name, slug, logo_url) VALUES 
  ('SSAB Oxelösund', 'ssab-oxelosund', null)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name;

-- Sätt in lag/teams
`;

SSAB_OXELOSUND.teams.forEach(team => {
  sqlContent += `INSERT INTO teams (name, description, company_id) VALUES 
  ('Lag ${team}', '3-skift lag ${team} - SSAB Oxelösund', (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'))
ON CONFLICT DO NOTHING;

`;
});

sqlContent += `-- Sätt in exempelanställda för varje lag
`;

SSAB_OXELOSUND.teams.forEach(team => {
  for (let i = 1; i <= 5; i++) {
    sqlContent += `INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-${team}-${i.toString().padStart(2, '0')}', 'lag${team}.medlem${i}@ssab.se', 'Medlem', '${team}-${i}', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag ${team}' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   '${SSAB_OXELOSUND.departments[i % SSAB_OXELOSUND.departments.length]}', 'Operatör')
ON CONFLICT (email) DO NOTHING;

`;
  }
});

fs.writeFileSync(sqlFile, sqlContent);
console.log(`✅ Supabase SQL: ${sqlFile}`);

// 4. Skapa README för exporten
const readmeFile = path.join(exportDir, 'README.md');
const readmeContent = `# 🏭 SSAB Oxelösund 3-skift Export
## Lag 31-35 Schemaexport

### 📊 Exporterad Data
- **Anläggning**: ${SSAB_OXELOSUND.name}
- **Plats**: ${SSAB_OXELOSUND.location}
- **Skifttyp**: ${SSAB_3SKIFT.name} (${SSAB_3SKIFT.description})
- **Lag**: ${SSAB_OXELOSUND.teams.join(', ')}
- **Cykellängd**: ${SSAB_3SKIFT.cycle} dagar
- **Mönster**: ${SSAB_3SKIFT.pattern.join('-')}

### 📅 Skifttider
${Object.entries(SSAB_3SKIFT.times).map(([code, time]) => 
  `- **${code}** (${time.name}): ${time.start || 'Ledig'} - ${time.end || ''}`
).join('\n')}

### 📁 Exporterade Filer
- \`ssab-oxelosund-3skift-lag-31-35.json\` - Komplett dataexport
- \`lag-31-schema-2024.csv\` - Lag 31 årsschema
- \`lag-32-schema-2024.csv\` - Lag 32 årsschema  
- \`lag-33-schema-2024.csv\` - Lag 33 årsschema
- \`lag-34-schema-2024.csv\` - Lag 34 årsschema
- \`lag-35-schema-2024.csv\` - Lag 35 årsschema
- \`supabase-insert-ssab-oxelosund.sql\` - SQL för Supabase

### 🚀 Import till Plattformar

#### Loveable.dev
1. Importera hela projektet från GitHub: \`https://github.com/xXJV10Xx/SkiftApp\`
2. Använd JSON-data för frontend-utveckling
3. Implementera SSAB Oxelösund-specifika vyer

#### Supabase
1. Kör SQL-scriptet i Supabase SQL Editor
2. Verifiera att data importerats korrekt
3. Testa API-endpoints

#### GitHub
Data är redan inkluderad i huvudrepository under \`exports/ssab-oxelosund/\`

### 📱 Användning i Appen
Lag 31-35 kommer att visas som separata team under SSAB Oxelösund-företaget i appen.

---
**Exporterad**: ${new Date().toLocaleString('sv-SE')}
`;

fs.writeFileSync(readmeFile, readmeContent);
console.log(`✅ README: ${readmeFile}`);

// 5. Statistik
console.log('\n📊 EXPORT STATISTIK');
console.log('==================');
SSAB_OXELOSUND.teams.forEach(team => {
  const teamData = exportData.teams[team];
  console.log(`Lag ${team}: ${teamData.workDays} arbetsdagar, ${teamData.offDays} lediga dagar`);
});

console.log('\n🎯 EXPORT KOMPLETT!');
console.log('Alla filer skapade i:', exportDir);
console.log('\n🚀 Nästa steg:');
console.log('1. Commit och push till GitHub');
console.log('2. Importera SQL till Supabase');
console.log('3. Konfigurera i Loveable.dev');

// Auto-commit till git (om i git repo)
try {
  execSync('git add exports/ssab-oxelosund/', { cwd: path.join(__dirname, '..') });
  execSync('git commit -m "Export: SSAB Oxelösund 3-skift lag 31-35"', { cwd: path.join(__dirname, '..') });
  console.log('✅ Auto-commit till Git');
} catch (error) {
  console.log('ℹ️  Manuell Git commit krävs');
}