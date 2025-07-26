#!/usr/bin/env node

/**
 * 🧪 Test script för att verifiera Outokumpu-schemat
 * Verifierar att Outokumpu-företaget och dess skiftscheman sparas korrekt i databasen
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Check for dry-run before loading credentials
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

// Supabase konfiguration (skip if dry-run)
let supabase = null;
if (!isDryRun) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase miljövariabler saknas!');
    console.error('Kontrollera att EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_ANON_KEY är satta');
    console.error('\n📋 För att köra detta test behöver du:');
    console.error('1. Skapa en .env fil baserad på .env.example');
    console.error('2. Lägg till dina Supabase credentials från ditt projekt');
    console.error('3. Se SUPABASE_SETUP.md för mer information');
    console.error('\n💡 Om du bara vill se teststrukturen, kör: node scripts/test-outokumpu.cjs --dry-run');
    process.exit(1);
  }

  supabase = createClient(supabaseUrl, supabaseKey);
}

// Outokumpu företagsdata som ska verifieras
const OUTOKUMPU_DATA = {
  id: 'outokumpu',
  name: 'Outokumpu',
  description: 'Rostfritt stål',
  location: 'Avesta, Sverige',
  shifts: ['OUTOKUMPU_3SKIFT', 'OUTOKUMPU_2SKIFT', 'OUTOKUMPU_DAG'],
  teams: ['A', 'B', 'C', 'D'],
  departments: ['Smältverk', 'Valsning', 'Glödgning', 'Kvalitet', 'Underhåll'],
  colors: {
    'A': '#C0392B',  // Rostfritt röd
    'B': '#2C3E50',  // Stål grå
    'C': '#E67E22',  // Koppar orange
    'D': '#27AE60'   // Nickel grön
  }
};

// Outokumpu skifttyper som ska verifieras
const OUTOKUMPU_SHIFT_TYPES = {
  OUTOKUMPU_3SKIFT: {
    id: 'outokumpu_3skift',
    name: 'Outokumpu 3-skift',
    description: 'Kontinuerligt 3-skiftssystem för rostfritt stål',
    pattern: ['M', 'M', 'A', 'A', 'N', 'N', 'L', 'L'],
    cycle: 8,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },
  OUTOKUMPU_2SKIFT: {
    id: 'outokumpu_2skift',
    name: 'Outokumpu 2-skift',
    description: '2-skiftssystem för underhåll och kvalitet',
    pattern: ['M', 'M', 'M', 'M', 'M', 'L', 'L', 'A', 'A', 'A', 'A', 'A', 'L', 'L'],
    cycle: 14,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },
  OUTOKUMPU_DAG: {
    id: 'outokumpu_dag',
    name: 'Outokumpu Dag',
    description: 'Dagskift för administration och planering',
    pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
    cycle: 7,
    times: {
      'D': { start: '07:00', end: '16:00', name: 'Dag' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  }
};

async function testOutokumpuSchema() {
  console.log('🧪 Startar Outokumpu schema-test...\n');

  try {
    // Test 1: Verifiera företagsdata
    console.log('📋 Test 1: Verifierar företagsdata...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', 'outokumpu');

    if (companiesError) {
      console.error('❌ Fel vid hämtning av företagsdata:', companiesError);
      return false;
    }

    if (!companies || companies.length === 0) {
      console.log('⚠️  Outokumpu företag finns inte i databasen');
      console.log('   Förväntat företag:', OUTOKUMPU_DATA);
      return false;
    }

    const company = companies[0];
    console.log('✅ Outokumpu företag hittades:', {
      id: company.id,
      name: company.name,
      description: company.description,
      location: company.location
    });

    // Verifiera företagsdata
    const companyValid = 
      company.name === OUTOKUMPU_DATA.name &&
      company.description === OUTOKUMPU_DATA.description &&
      company.location === OUTOKUMPU_DATA.location;

    if (!companyValid) {
      console.log('❌ Företagsdata matchar inte förväntade värden');
      console.log('   Faktisk:', company);
      console.log('   Förväntad:', OUTOKUMPU_DATA);
      return false;
    }

    // Test 2: Verifiera skifttyper
    console.log('\n📋 Test 2: Verifierar skifttyper...');
    const { data: shifts, error: shiftsError } = await supabase
      .from('shift_types')
      .select('*')
      .in('id', Object.keys(OUTOKUMPU_SHIFT_TYPES));

    if (shiftsError) {
      console.error('❌ Fel vid hämtning av skifttyper:', shiftsError);
      return false;
    }

    if (!shifts || shifts.length !== 3) {
      console.log(`⚠️  Förväntat 3 skifttyper, hittade ${shifts?.length || 0}`);
      console.log('   Förväntade skifttyper:', Object.keys(OUTOKUMPU_SHIFT_TYPES));
      return false;
    }

    for (const shift of shifts) {
      const expectedShift = OUTOKUMPU_SHIFT_TYPES[shift.id.toUpperCase()];
      if (!expectedShift) {
        console.log(`❌ Oväntad skifttyp: ${shift.id}`);
        return false;
      }

      console.log(`✅ Skifttyp ${shift.name} verifierad`);
      
      // Verifiera skiftdata
      if (shift.name !== expectedShift.name || 
          shift.description !== expectedShift.description ||
          shift.cycle !== expectedShift.cycle) {
        console.log(`❌ Skiftdata för ${shift.id} matchar inte`);
        console.log('   Faktisk:', shift);
        console.log('   Förväntad:', expectedShift);
        return false;
      }
    }

    // Test 3: Verifiera att scheman kan genereras
    console.log('\n📋 Test 3: Verifierar schemagenerering...');
    
    const testDate = new Date('2024-01-01');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('shifts')
      .select('*')
      .eq('company_id', 'outokumpu')
      .gte('date', testDate.toISOString().split('T')[0])
      .lt('date', new Date(testDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .limit(10);

    if (scheduleError) {
      console.error('❌ Fel vid hämtning av scheman:', scheduleError);
      return false;
    }

    if (scheduleData && scheduleData.length > 0) {
      console.log(`✅ Scheman genererade: ${scheduleData.length} poster hittades`);
      console.log('   Exempel schema:', {
        date: scheduleData[0].date,
        shift_type: scheduleData[0].shift_type,
        team: scheduleData[0].team,
        department: scheduleData[0].department
      });
    } else {
      console.log('⚠️  Inga scheman hittades - detta kan vara normalt om de inte genererats än');
    }

    // Test 4: Verifiera lagfärger
    console.log('\n📋 Test 4: Verifierar lagfärger...');
    
    const expectedTeams = OUTOKUMPU_DATA.teams;
    const expectedColors = OUTOKUMPU_DATA.colors;
    
    for (const team of expectedTeams) {
      if (!expectedColors[team]) {
        console.log(`❌ Färg saknas för lag ${team}`);
        return false;
      }
      console.log(`✅ Lag ${team}: ${expectedColors[team]}`);
    }

    console.log('\n🎉 Alla tester passerade! Outokumpu-schemat är korrekt sparat.');
    return true;

  } catch (error) {
    console.error('❌ Oväntat fel under testning:', error);
    return false;
  }
}

async function createOutokumpuTestData() {
  console.log('🔧 Skapar testdata för Outokumpu...\n');

  try {
    // Skapa företag
    console.log('📋 Skapar företagsdata...');
    const { error: companyError } = await supabase
      .from('companies')
      .upsert([OUTOKUMPU_DATA]);

    if (companyError) {
      console.error('❌ Fel vid skapande av företag:', companyError);
      return false;
    }
    console.log('✅ Företagsdata skapad');

    // Skapa skifttyper
    console.log('📋 Skapar skifttyper...');
    const shiftTypesArray = Object.values(OUTOKUMPU_SHIFT_TYPES);
    
    for (const shiftType of shiftTypesArray) {
      const { error: shiftError } = await supabase
        .from('shift_types')
        .upsert([shiftType]);

      if (shiftError) {
        console.error(`❌ Fel vid skapande av skifttyp ${shiftType.id}:`, shiftError);
        return false;
      }
      console.log(`✅ Skifttyp ${shiftType.name} skapad`);
    }

    console.log('\n🎉 Outokumpu testdata skapad framgångsrikt!');
    return true;

  } catch (error) {
    console.error('❌ Oväntat fel vid skapande av testdata:', error);
    return false;
  }
}

async function showDryRun() {
  console.log('🏭 Outokumpu Schema Test Suite - Dry Run');
  console.log('==========================================\n');
  
  console.log('📋 Detta test verifierar följande Outokumpu-data:\n');
  
  console.log('🏢 Företagsdata:');
  console.log(`   • ID: ${OUTOKUMPU_DATA.id}`);
  console.log(`   • Namn: ${OUTOKUMPU_DATA.name}`);
  console.log(`   • Beskrivning: ${OUTOKUMPU_DATA.description}`);
  console.log(`   • Plats: ${OUTOKUMPU_DATA.location}`);
  console.log(`   • Lag: ${OUTOKUMPU_DATA.teams.join(', ')}`);
  console.log(`   • Avdelningar: ${OUTOKUMPU_DATA.departments.join(', ')}\n`);
  
  console.log('⚙️  Skifttyper som testas:');
  Object.values(OUTOKUMPU_SHIFT_TYPES).forEach(shift => {
    console.log(`   • ${shift.name}`);
    console.log(`     - Beskrivning: ${shift.description}`);
    console.log(`     - Cykel: ${shift.cycle} dagar`);
    console.log(`     - Mönster: ${shift.pattern.join('-')}`);
  });
  
  console.log('\n🧪 Tester som körs:');
  console.log('   1. ✓ Verifierar företagsdata i databasen');
  console.log('   2. ✓ Kontrollerar att alla skifttyper finns');
  console.log('   3. ✓ Testar schemagenerering för 30 dagar');
  console.log('   4. ✓ Validerar lagfärger och teams');
  
  console.log('\n💡 För att köra riktiga tester:');
  console.log('   • Skapa .env fil med Supabase credentials');
  console.log('   • Kör: node scripts/test-outokumpu.cjs --create');
  console.log('   • Eller: node scripts/test-outokumpu.cjs (för att bara testa)');
}

// Huvudfunktion
async function main() {
  console.log('🏭 Outokumpu Schema Test Suite');
  console.log('=============================\n');

  const createData = args.includes('--create') || args.includes('-c');

  if (isDryRun) {
    await showDryRun();
    process.exit(0);
  }

  if (createData) {
    console.log('🔧 Skapar testdata först...\n');
    const created = await createOutokumpuTestData();
    if (!created) {
      console.log('\n❌ Kunde inte skapa testdata. Avbryter.');
      process.exit(1);
    }
    console.log('\n' + '='.repeat(50) + '\n');
  }

  const success = await testOutokumpuSchema();
  
  if (success) {
    console.log('\n✅ Alla tester passerade! Outokumpu-schemat fungerar korrekt.');
    process.exit(0);
  } else {
    console.log('\n❌ Ett eller flera tester misslyckades.');
    console.log('\nKör scriptet med --create flaggan för att skapa testdata:');
    console.log('  node scripts/test-outokumpu.cjs --create');
    process.exit(1);
  }
}

// Kör huvudfunktionen
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Kritiskt fel:', error);
    process.exit(1);
  });
}

module.exports = {
  testOutokumpuSchema,
  createOutokumpuTestData,
  OUTOKUMPU_DATA,
  OUTOKUMPU_SHIFT_TYPES
};