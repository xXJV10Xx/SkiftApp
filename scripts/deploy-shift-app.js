#!/usr/bin/env node

/**
 * Svenska Skiftscheman - Deployment Script
 * Sätter upp hela systemet med svenska skiftscheman och kalenderdata
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Konfiguration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Svenska helgdagar 2023-2035
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
    { date: '2023-06-24', name: 'Midsommarafton', type: 'public' },
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
    { date: '2024-06-22', name: 'Midsommarafton', type: 'public' },
    { date: '2024-12-24', name: 'Julafton', type: 'public' },
    { date: '2024-12-25', name: 'Juldagen', type: 'public' },
    { date: '2024-12-26', name: 'Annandag jul', type: 'public' },
    { date: '2024-12-31', name: 'Nyårsafton', type: 'public' }
  ]
  // Fortsätt med fler år...
};

// Svenska företag med skiftscheman
const SAMPLE_COMPANIES = [
  {
    name: 'Volvo Cars',
    industry: 'Automotive',
    location: 'Göteborg',
    shift_patterns: ['3-skift', 'kontinuerligt'],
    departments: [
      { name: 'Karosseri', location: 'Torslanda', shift_type: '3-skift', employee_count: 450 },
      { name: 'Motor', location: 'Skövde', shift_type: 'kontinuerligt', employee_count: 320 },
      { name: 'Lackering', location: 'Torslanda', shift_type: '3-skift', employee_count: 280 }
    ]
  },
  {
    name: 'SSAB',
    industry: 'Steel',
    location: 'Oxelösund',
    shift_patterns: ['kontinuerligt', '4-skift'],
    departments: [
      { name: 'Stålverk', location: 'Oxelösund', shift_type: 'kontinuerligt', employee_count: 380 },
      { name: 'Valsning', location: 'Borlänge', shift_type: '4-skift', employee_count: 250 },
      { name: 'Underhåll', location: 'Oxelösund', shift_type: 'kontinuerligt', employee_count: 120 }
    ]
  },
  {
    name: 'Stora Enso',
    industry: 'Paper & Pulp',
    location: 'Falun',
    shift_patterns: ['kontinuerligt', '3-skift'],
    departments: [
      { name: 'Massa', location: 'Kvarnsveden', shift_type: 'kontinuerligt', employee_count: 180 },
      { name: 'Papper', location: 'Kvarnsveden', shift_type: 'kontinuerligt', employee_count: 220 },
      { name: 'Kartong', location: 'Fors', shift_type: '3-skift', employee_count: 150 }
    ]
  },
  {
    name: 'Sandvik',
    industry: 'Mining & Construction',
    location: 'Sandviken',
    shift_patterns: ['3-skift', '2-skift'],
    departments: [
      { name: 'Produktion', location: 'Sandviken', shift_type: '3-skift', employee_count: 340 },
      { name: 'Verktyg', location: 'Gimo', shift_type: '2-skift', employee_count: 190 },
      { name: 'Service', location: 'Stockholm', shift_type: 'dag', employee_count: 85 }
    ]
  },
  {
    name: 'SKF',
    industry: 'Bearings',
    location: 'Göteborg',
    shift_patterns: ['3-skift', 'kontinuerligt'],
    departments: [
      { name: 'Kullager', location: 'Göteborg', shift_type: '3-skift', employee_count: 290 },
      { name: 'Tätningar', location: 'Göteborg', shift_type: '2-skift', employee_count: 160 },
      { name: 'Smörjning', location: 'Göteborg', shift_type: 'kontinuerligt', employee_count: 110 }
    ]
  }
];

// Skiftmönster definitioner
const SHIFT_PATTERNS = {
  'dag': {
    shifts: [{ start: '07:00', end: '16:00', name: 'Dag' }],
    rotation_days: 5
  },
  '2-skift': {
    shifts: [
      { start: '06:00', end: '14:00', name: 'Dag' },
      { start: '14:00', end: '22:00', name: 'Kväll' }
    ],
    rotation_days: 7
  },
  '3-skift': {
    shifts: [
      { start: '06:00', end: '14:00', name: 'Dag' },
      { start: '14:00', end: '22:00', name: 'Kväll' },
      { start: '22:00', end: '06:00', name: 'Natt' }
    ],
    rotation_days: 21
  },
  '4-skift': {
    shifts: [
      { start: '06:00', end: '12:00', name: 'Dag 1' },
      { start: '12:00', end: '18:00', name: 'Dag 2' },
      { start: '18:00', end: '00:00', name: 'Kväll' },
      { start: '00:00', end: '06:00', name: 'Natt' }
    ],
    rotation_days: 28
  },
  'kontinuerligt': {
    shifts: [
      { start: '06:00', end: '14:00', name: 'Dag' },
      { start: '14:00', end: '22:00', name: 'Kväll' },
      { start: '22:00', end: '06:00', name: 'Natt' }
    ],
    rotation_days: 28,
    continuous: true
  }
};

async function deployShiftSystem() {
  console.log('🇸🇪 Deploying Svenska Skiftscheman System...\n');

  try {
    // 1. Skapa svenska helgdagar
    console.log('📅 Creating Swedish holidays...');
    for (const [year, holidays] of Object.entries(SWEDISH_HOLIDAYS)) {
      const holidaysWithYear = holidays.map(h => ({ ...h, year: parseInt(year) }));
      const { error } = await supabase
        .from('swedish_holidays')
        .upsert(holidaysWithYear, { onConflict: 'date' });
      
      if (error) {
        console.error(`Error creating holidays for ${year}:`, error);
      } else {
        console.log(`✅ Created ${holidays.length} holidays for ${year}`);
      }
    }

    // 2. Skapa företag och avdelningar
    console.log('\n🏢 Creating companies and departments...');
    for (const company of SAMPLE_COMPANIES) {
      // Skapa företag
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .upsert({
          name: company.name,
          industry: company.industry,
          location: company.location,
          shift_patterns: company.shift_patterns,
          active: true
        }, { onConflict: 'name' })
        .select()
        .single();

      if (companyError) {
        console.error(`Error creating company ${company.name}:`, companyError);
        continue;
      }

      console.log(`✅ Created company: ${company.name}`);

      // Skapa avdelningar
      for (const dept of company.departments) {
        const { error: deptError } = await supabase
          .from('departments')
          .upsert({
            company_id: companyData.id,
            name: dept.name,
            location: dept.location,
            shift_type: dept.shift_type,
            employee_count: dept.employee_count,
            active: true
          }, { onConflict: 'company_id,name' });

        if (deptError) {
          console.error(`Error creating department ${dept.name}:`, deptError);
        } else {
          console.log(`  ✅ Created department: ${dept.name}`);
        }
      }
    }

    // 3. Generera skiftscheman för 2024
    console.log('\n📋 Generating shift schedules for 2024...');
    await generateShiftSchedules(2024);

    // 4. Skapa skiftlag
    console.log('\n👥 Creating shift teams...');
    await createShiftTeams();

    console.log('\n🎉 Svenska Skiftscheman System deployed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${Object.keys(SWEDISH_HOLIDAYS).length} years of Swedish holidays`);
    console.log(`- ${SAMPLE_COMPANIES.length} companies with departments`);
    console.log('- Shift schedules for 2024');
    console.log('- Shift teams and patterns');
    
    // Exportera till Loveable
    console.log('\n🚀 Exporting to Loveable...');
    await exportToLoveable();

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function generateShiftSchedules(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  // Hämta alla företag och avdelningar
  const { data: companies } = await supabase
    .from('companies')
    .select(`
      id, name,
      departments(id, name, shift_type, employee_count)
    `)
    .eq('active', true);

  // Hämta helgdagar för året
  const { data: holidays } = await supabase
    .from('swedish_holidays')
    .select('date')
    .eq('year', year);

  const holidayDates = new Set(holidays?.map(h => h.date) || []);

  const schedules = [];
  
  for (const company of companies || []) {
    for (const dept of company.departments || []) {
      const pattern = SHIFT_PATTERNS[dept.shift_type] || SHIFT_PATTERNS['dag'];
      
      // Generera scheman för varje dag
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const isHoliday = holidayDates.has(dateStr);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        // Välj skift baserat på datum och mönster
        const dayOfYear = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
        const shiftIndex = Math.floor(dayOfYear / pattern.rotation_days) % pattern.shifts.length;
        const shift = pattern.shifts[shiftIndex];
        
        schedules.push({
          company_id: company.id,
          department_id: dept.id,
          date: dateStr,
          shift_type: shift.name,
          start_time: shift.start,
          end_time: shift.end,
          employee_count: Math.floor(dept.employee_count / pattern.shifts.length),
          is_holiday: isHoliday,
          is_weekend: isWeekend,
          notes: isHoliday ? 'Helgdag - reducerad bemanning' : null
        });
      }
    }
  }

  // Infoga scheman i batches
  const batchSize = 1000;
  for (let i = 0; i < schedules.length; i += batchSize) {
    const batch = schedules.slice(i, i + batchSize);
    const { error } = await supabase
      .from('shift_schedules')
      .upsert(batch, { onConflict: 'company_id,department_id,date' });
    
    if (error) {
      console.error('Error inserting schedule batch:', error);
    } else {
      console.log(`✅ Inserted ${batch.length} shift schedules`);
    }
  }
}

async function createShiftTeams() {
  // Hämta alla avdelningar
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('active', true);

  const teams = [];
  
  for (const dept of departments || []) {
    const pattern = SHIFT_PATTERNS[dept.shift_type] || SHIFT_PATTERNS['dag'];
    
    // Skapa lag för varje skift
    pattern.shifts.forEach((shift, index) => {
      teams.push({
        company_id: dept.company_id,
        department_id: dept.id,
        name: `${dept.name} - ${shift.name}`,
        shift_pattern: dept.shift_type,
        rotation_days: pattern.rotation_days,
        start_date: '2024-01-01',
        active: true
      });
    });
  }

  // Infoga skiftlag
  const { error } = await supabase
    .from('shift_teams')
    .upsert(teams, { onConflict: 'company_id,department_id,name' });

  if (error) {
    console.error('Error creating shift teams:', error);
  } else {
    console.log(`✅ Created ${teams.length} shift teams`);
  }
}

async function exportToLoveable() {
  const exportData = {
    project: 'svenska-skiftappen',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    components: [
      'ShiftCalendar',
      'CompanyFilter',
      'HolidayDisplay',
      'ShiftTeamManager'
    ],
    database_schema: 'supabase/migrations/20250126_create_shift_tables.sql',
    sample_data: {
      companies: SAMPLE_COMPANIES.length,
      holidays: Object.values(SWEDISH_HOLIDAYS).flat().length,
      shift_patterns: Object.keys(SHIFT_PATTERNS).length
    }
  };

  // Spara export data
  fs.writeFileSync(
    path.join(__dirname, '../loveable-export.json'),
    JSON.stringify(exportData, null, 2)
  );

  console.log('✅ Loveable export data created');
}

// Kör deployment
if (require.main === module) {
  deployShiftSystem();
}

module.exports = { deployShiftSystem };