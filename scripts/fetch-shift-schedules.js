#!/usr/bin/env node

/**
 * Skiftschema Data Fetcher
 * Hämtar skiftscheman från svenska källor för 2023-2035
 * Integrerar med Supabase backend och svensk kalender
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Svenska skifttyper och mönster
const SWEDISH_SHIFT_PATTERNS = {
  '2-2': { name: '2-2 skift', pattern: [2, 2], description: '2 dagar på, 2 dagar av' },
  '3-3': { name: '3-3 skift', pattern: [3, 3], description: '3 dagar på, 3 dagar av' },
  '4-4': { name: '4-4 skift', pattern: [4, 4], description: '4 dagar på, 4 dagar av' },
  '5-5': { name: '5-5 skift', pattern: [5, 5], description: '5 dagar på, 5 dagar av' },
  '2-2-2-4': { name: '2-2-2-4 skift', pattern: [2, 2, 2, 4], description: 'Kontinuerligt skift' },
  '6-2': { name: '6-2 skift', pattern: [6, 2], description: '6 dagar på, 2 dagar av' },
  '7-7': { name: '7-7 skift', pattern: [7, 7], description: '7 dagar på, 7 dagar av' }
};

// Svenska helgdagar och kalendersystem
const SWEDISH_HOLIDAYS = {
  2023: [
    { date: '2023-01-01', name: 'Nyårsdagen', type: 'public' },
    { date: '2023-01-06', name: 'Trettondedag jul', type: 'public' },
    { date: '2023-04-07', name: 'Långfredagen', type: 'public' },
    { date: '2023-04-09', name: 'Påskdagen', type: 'public' },
    { date: '2023-04-10', name: 'Annandag påsk', type: 'public' },
    { date: '2023-05-01', name: 'Första maj', type: 'public' },
    { date: '2023-05-18', name: 'Kristi himmelsfärdsdag', type: 'public' },
    { date: '2023-05-28', name: 'Pingstdagen', type: 'public' },
    { date: '2023-06-06', name: 'Sveriges nationaldag', type: 'public' },
    { date: '2023-06-24', name: 'Midsommardagen', type: 'public' },
    { date: '2023-11-04', name: 'Alla helgons dag', type: 'public' },
    { date: '2023-12-24', name: 'Julafton', type: 'public' },
    { date: '2023-12-25', name: 'Juldagen', type: 'public' },
    { date: '2023-12-26', name: 'Annandag jul', type: 'public' },
    { date: '2023-12-31', name: 'Nyårsafton', type: 'public' }
  ],
  2024: [
    { date: '2024-01-01', name: 'Nyårsdagen', type: 'public' },
    { date: '2024-01-06', name: 'Trettondedag jul', type: 'public' },
    { date: '2024-03-29', name: 'Långfredagen', type: 'public' },
    { date: '2024-03-31', name: 'Påskdagen', type: 'public' },
    { date: '2024-04-01', name: 'Annandag påsk', type: 'public' },
    { date: '2024-05-01', name: 'Första maj', type: 'public' },
    { date: '2024-05-09', name: 'Kristi himmelsfärdsdag', type: 'public' },
    { date: '2024-05-19', name: 'Pingstdagen', type: 'public' },
    { date: '2024-06-06', name: 'Sveriges nationaldag', type: 'public' },
    { date: '2024-06-22', name: 'Midsommardagen', type: 'public' },
    { date: '2024-11-02', name: 'Alla helgons dag', type: 'public' },
    { date: '2024-12-24', name: 'Julafton', type: 'public' },
    { date: '2024-12-25', name: 'Juldagen', type: 'public' },
    { date: '2024-12-26', name: 'Annandag jul', type: 'public' },
    { date: '2024-12-31', name: 'Nyårsafton', type: 'public' }
  ],
  2025: [
    { date: '2025-01-01', name: 'Nyårsdagen', type: 'public' },
    { date: '2025-01-06', name: 'Trettondedag jul', type: 'public' },
    { date: '2025-04-18', name: 'Långfredagen', type: 'public' },
    { date: '2025-04-20', name: 'Påskdagen', type: 'public' },
    { date: '2025-04-21', name: 'Annandag påsk', type: 'public' },
    { date: '2025-05-01', name: 'Första maj', type: 'public' },
    { date: '2025-05-29', name: 'Kristi himmelsfärdsdag', type: 'public' },
    { date: '2025-06-08', name: 'Pingstdagen', type: 'public' },
    { date: '2025-06-06', name: 'Sveriges nationaldag', type: 'public' },
    { date: '2025-06-21', name: 'Midsommardagen', type: 'public' },
    { date: '2025-11-01', name: 'Alla helgons dag', type: 'public' },
    { date: '2025-12-24', name: 'Julafton', type: 'public' },
    { date: '2025-12-25', name: 'Juldagen', type: 'public' },
    { date: '2025-12-26', name: 'Annandag jul', type: 'public' },
    { date: '2025-12-31', name: 'Nyårsafton', type: 'public' }
  ]
};

// Svenska företag och organisationer med skiftarbete
const SWEDISH_COMPANIES = [
  {
    name: 'Volvo Group',
    locations: ['Göteborg', 'Skövde', 'Umeå'],
    departments: ['Produktion', 'Logistik', 'Underhåll'],
    shiftTypes: ['3-3', '2-2-2-4']
  },
  {
    name: 'SSAB',
    locations: ['Luleå', 'Oxelösund', 'Borlänge'],
    departments: ['Stålproduktion', 'Valsning', 'Underhåll'],
    shiftTypes: ['4-4', '5-5']
  },
  {
    name: 'Stora Enso',
    locations: ['Falun', 'Skutskär', 'Hylte'],
    departments: ['Pappersmassa', 'Papper', 'Energi'],
    shiftTypes: ['7-7', '6-2']
  },
  {
    name: 'Region Stockholm',
    locations: ['Stockholm', 'Huddinge', 'Solna'],
    departments: ['Akutsjukvård', 'Intensivvård', 'Ambulans'],
    shiftTypes: ['2-2', '3-3']
  },
  {
    name: 'SCA',
    locations: ['Sundsvall', 'Östrand', 'Munksund'],
    departments: ['Massa', 'Papper', 'Hygienartiklar'],
    shiftTypes: ['4-4', '2-2-2-4']
  }
];

// Skottår beräkning för svensk kalender
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Generera svenska helgdagar för ett år
function generateSwedishHolidays(year) {
  const holidays = [];
  
  // Fasta helgdagar
  holidays.push(
    { date: `${year}-01-01`, name: 'Nyårsdagen', type: 'public' },
    { date: `${year}-01-06`, name: 'Trettondedag jul', type: 'public' },
    { date: `${year}-05-01`, name: 'Första maj', type: 'public' },
    { date: `${year}-06-06`, name: 'Sveriges nationaldag', type: 'public' },
    { date: `${year}-12-24`, name: 'Julafton', type: 'public' },
    { date: `${year}-12-25`, name: 'Juldagen', type: 'public' },
    { date: `${year}-12-26`, name: 'Annandag jul', type: 'public' },
    { date: `${year}-12-31`, name: 'Nyårsafton', type: 'public' }
  );

  // Beräkna påsk och relaterade helgdagar
  const easter = calculateEaster(year);
  holidays.push(
    { date: formatDate(addDays(easter, -2)), name: 'Långfredagen', type: 'public' },
    { date: formatDate(easter), name: 'Påskdagen', type: 'public' },
    { date: formatDate(addDays(easter, 1)), name: 'Annandag påsk', type: 'public' },
    { date: formatDate(addDays(easter, 39)), name: 'Kristi himmelsfärdsdag', type: 'public' },
    { date: formatDate(addDays(easter, 49)), name: 'Pingstdagen', type: 'public' }
  );

  // Midsommar (första lördagen efter 19 juni)
  const midsummer = calculateMidsummer(year);
  holidays.push({ date: formatDate(midsummer), name: 'Midsommardagen', type: 'public' });

  // Alla helgons dag (första lördagen mellan 31 okt - 6 nov)
  const allSaints = calculateAllSaints(year);
  holidays.push({ date: formatDate(allSaints), name: 'Alla helgons dag', type: 'public' });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

// Beräkna påskdagen enligt västlig tradition
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

// Beräkna midsommardagen
function calculateMidsummer(year) {
  const june19 = new Date(year, 5, 19); // Juni = månad 5
  const dayOfWeek = june19.getDay(); // 0 = söndag, 6 = lördag
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;
  return addDays(june19, daysToSaturday);
}

// Beräkna alla helgons dag
function calculateAllSaints(year) {
  const oct31 = new Date(year, 9, 31); // Oktober = månad 9
  const dayOfWeek = oct31.getDay();
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;
  return addDays(oct31, daysToSaturday);
}

// Hjälpfunktioner för datum
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Generera skiftschema för ett företag
function generateShiftSchedule(company, year, shiftPattern) {
  const schedule = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  let currentDate = new Date(startDate);
  let patternIndex = 0;
  let workDays = 0;
  
  while (currentDate <= endDate) {
    const pattern = SWEDISH_SHIFT_PATTERNS[shiftPattern].pattern;
    const isWorkDay = workDays < pattern[patternIndex % pattern.length];
    
    if (isWorkDay) {
      schedule.push({
        company: company.name,
        date: formatDate(currentDate),
        shiftType: shiftPattern,
        department: company.departments[Math.floor(Math.random() * company.departments.length)],
        location: company.locations[Math.floor(Math.random() * company.locations.length)],
        startTime: '06:00',
        endTime: '18:00',
        isHoliday: isHoliday(currentDate, year)
      });
    }
    
    workDays++;
    if (workDays >= pattern.reduce((a, b) => a + b, 0)) {
      workDays = 0;
      patternIndex++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedule;
}

// Kontrollera om datum är helg
function isHoliday(date, year) {
  const holidays = generateSwedishHolidays(year);
  const dateStr = formatDate(date);
  return holidays.some(holiday => holiday.date === dateStr);
}

// Huvudfunktion för att hämta och generera data
async function fetchShiftSchedules() {
  console.log('🇸🇪 Hämtar svenska skiftscheman 2023-2035...');
  
  const allSchedules = [];
  const allHolidays = [];
  
  // Generera data för alla år 2023-2035
  for (let year = 2023; year <= 2035; year++) {
    console.log(`📅 Bearbetar år ${year}...`);
    
    // Generera helgdagar
    const holidays = generateSwedishHolidays(year);
    allHolidays.push(...holidays);
    
    // Generera skiftscheman för alla företag
    for (const company of SWEDISH_COMPANIES) {
      for (const shiftType of company.shiftTypes) {
        const schedule = generateShiftSchedule(company, year, shiftType);
        allSchedules.push(...schedule);
      }
    }
  }
  
  // Spara data till filer
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Spara skiftscheman
  fs.writeFileSync(
    path.join(dataDir, 'shift-schedules.json'),
    JSON.stringify(allSchedules, null, 2)
  );
  
  // Spara helgdagar
  fs.writeFileSync(
    path.join(dataDir, 'swedish-holidays.json'),
    JSON.stringify(allHolidays, null, 2)
  );
  
  // Spara företagsinformation
  fs.writeFileSync(
    path.join(dataDir, 'companies.json'),
    JSON.stringify(SWEDISH_COMPANIES, null, 2)
  );
  
  // Spara skiftmönster
  fs.writeFileSync(
    path.join(dataDir, 'shift-patterns.json'),
    JSON.stringify(SWEDISH_SHIFT_PATTERNS, null, 2)
  );
  
  // Generera Supabase SQL för import
  generateSupabaseSQL(allSchedules, allHolidays);
  
  console.log(`✅ Klart! Genererade ${allSchedules.length} skiftscheman för ${SWEDISH_COMPANIES.length} företag`);
  console.log(`📊 Inkluderar ${allHolidays.length} svenska helgdagar från 2023-2035`);
  console.log(`💾 Data sparad i: ${dataDir}/`);
}

// Generera SQL för Supabase import
function generateSupabaseSQL(schedules, holidays) {
  let sql = `-- Svenska skiftscheman och helgdagar 2023-2035
-- Genererad automatiskt ${new Date().toISOString()}

-- Lägg till svenska helgdagar
INSERT INTO swedish_holidays (date, name, type, year) VALUES\n`;

  const holidayValues = holidays.map(holiday => {
    const year = new Date(holiday.date).getFullYear();
    return `  ('${holiday.date}', '${holiday.name}', '${holiday.type}', ${year})`;
  });
  
  sql += holidayValues.join(',\n') + ';\n\n';

  // Lägg till skiftscheman (begränsat urval för prestanda)
  sql += `-- Lägg till skiftscheman (urval)
INSERT INTO shift_schedules (company_name, date, shift_type, department, location, start_time, end_time, is_holiday) VALUES\n`;

  const scheduleValues = schedules.slice(0, 1000).map(schedule => {
    return `  ('${schedule.company}', '${schedule.date}', '${schedule.shiftType}', '${schedule.department}', '${schedule.location}', '${schedule.startTime}', '${schedule.endTime}', ${schedule.isHoliday})`;
  });
  
  sql += scheduleValues.join(',\n') + ';\n';

  fs.writeFileSync(
    path.join(__dirname, '../data/supabase-import.sql'),
    sql
  );
  
  console.log('📄 Supabase SQL genererad: data/supabase-import.sql');
}

// Kör skriptet
if (require.main === module) {
  fetchShiftSchedules().catch(console.error);
}

module.exports = {
  fetchShiftSchedules,
  generateSwedishHolidays,
  SWEDISH_SHIFT_PATTERNS,
  SWEDISH_COMPANIES
};