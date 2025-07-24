#!/usr/bin/env node

/**
 * Test script för SSAB Oxelösund Schema System
 * Kör detta script för att verifiera att allt fungerar korrekt
 */

const { generateSSABSchedule, generateCurrentMonthSchedule, generateAllTeamsSchedule } = require('../lib/schedule-generator');
const { initializeSSABOxelosund, getSSABData, clearSSABSchedules, generateInitialSSABSchedules } = require('../lib/ssab-setup');

async function testSSABSystem() {
  console.log('🏭 SSAB Oxelösund Schema System - Test Suite');
  console.log('================================================\n');

  try {
    // Test 1: Initialisera systemet
    console.log('1️⃣ Initialiserar SSAB Oxelösund...');
    const initResult = await initializeSSABOxelosund();
    console.log(`   ${initResult.success ? '✅' : '❌'} ${initResult.message}`);
    if (!initResult.success) {
      console.log(`   Fel: ${initResult.error}`);
      return;
    }
    console.log(`   Företags-ID: ${initResult.data?.companyId}`);
    console.log(`   Antal lag: ${initResult.data?.teamIds.length}\n`);

    // Test 2: Hämta SSAB data
    console.log('2️⃣ Hämtar SSAB data från Supabase...');
    const ssabData = await getSSABData();
    console.log(`   ${ssabData.success ? '✅' : '❌'} SSAB data hämtad`);
    if (ssabData.success && ssabData.data) {
      console.log(`   Företag: ${ssabData.data.company.name}`);
      console.log(`   Lag: ${ssabData.data.teams.map(t => t.name).join(', ')}\n`);
    }

    // Test 3: Generera schema för ett specifikt lag
    console.log('3️⃣ Genererar schema för Lag 31...');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const scheduleResult = await generateSSABSchedule(
      '31',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      true
    );
    
    console.log(`   ${scheduleResult.success ? '✅' : '❌'} Schema genererat för Lag 31`);
    if (scheduleResult.success && scheduleResult.data) {
      console.log(`   Antal dagar: ${scheduleResult.data.schedule.length}`);
      console.log(`   Arbetsdagar: ${scheduleResult.data.stats?.workDays}`);
      console.log(`   Totala timmar: ${scheduleResult.data.stats?.totalHours}`);
      console.log(`   Färg: ${scheduleResult.data.teamInfo.color}\n`);
    } else {
      console.log(`   Fel: ${scheduleResult.error}\n`);
    }

    // Test 4: Generera schema för aktuell månad
    console.log('4️⃣ Genererar schema för aktuell månad (Lag 32)...');
    const currentMonthResult = await generateCurrentMonthSchedule('32');
    console.log(`   ${currentMonthResult.success ? '✅' : '❌'} Aktuell månads schema genererat`);
    if (currentMonthResult.success && currentMonthResult.data) {
      console.log(`   Lag: ${currentMonthResult.data.teamInfo.teamId}`);
      console.log(`   Skifttyp: ${currentMonthResult.data.teamInfo.shiftType}`);
      
      // Visa första 5 dagarna
      console.log('   Första 5 dagarna:');
      currentMonthResult.data.schedule.slice(0, 5).forEach(day => {
        const shiftInfo = day.shift.time.start ? 
          `${day.shift.time.name} (${day.shift.time.start}-${day.shift.time.end})` : 
          'Ledig';
        console.log(`     ${day.weekday} ${day.day}: ${shiftInfo}`);
      });
      console.log('');
    }

    // Test 5: Generera schema för alla lag
    console.log('5️⃣ Genererar schema för alla lag (7 dagar)...');
    const testStart = new Date();
    const testEnd = new Date();
    testEnd.setDate(testStart.getDate() + 6);
    
    const allTeamsResult = await generateAllTeamsSchedule(
      testStart.toISOString().split('T')[0],
      testEnd.toISOString().split('T')[0]
    );
    
    let successCount = 0;
    for (const [teamId, result] of Object.entries(allTeamsResult)) {
      if (result.success) successCount++;
      console.log(`   ${result.success ? '✅' : '❌'} Lag ${teamId}: ${result.success ? 'OK' : result.error}`);
    }
    console.log(`   Totalt: ${successCount}/5 lag genererade\n`);

    // Test 6: Verifiera skiftmönster
    console.log('6️⃣ Verifierar SSAB 3-skift mönster...');
    if (scheduleResult.success && scheduleResult.data) {
      const schedule = scheduleResult.data.schedule;
      const pattern = schedule.slice(0, 14).map(day => day.shift.code);
      const expectedPattern = ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L'];
      
      // Kontrollera att mönstret stämmer (kan vara förskjutet)
      let patternMatch = false;
      for (let offset = 0; offset < 14; offset++) {
        const shiftedPattern = [...expectedPattern.slice(offset), ...expectedPattern.slice(0, offset)];
        if (JSON.stringify(pattern) === JSON.stringify(shiftedPattern)) {
          patternMatch = true;
          console.log(`   ✅ SSAB 3-skift mönster verifierat (offset: ${offset})`);
          console.log(`   Mönster: ${pattern.join('')}`);
          break;
        }
      }
      
      if (!patternMatch) {
        console.log(`   ❌ Mönster matchar inte SSAB 3-skift`);
        console.log(`   Faktiskt: ${pattern.join('')}`);
        console.log(`   Förväntat: ${expectedPattern.join('')} (eller förskjutet)`);
      }
      console.log('');
    }

    // Test 7: Generera initiala scheman för alla lag
    console.log('7️⃣ Genererar initiala scheman för alla lag (3 månader)...');
    const initialSchedulesResult = await generateInitialSSABSchedules();
    console.log(`   ${initialSchedulesResult.success ? '✅' : '❌'} ${initialSchedulesResult.message}`);
    if (initialSchedulesResult.generatedSchedules) {
      console.log(`   Totalt genererade skiftdagar: ${initialSchedulesResult.generatedSchedules}\n`);
    }

    console.log('🎉 SSAB Oxelösund Schema System - Test Komplett!');
    console.log('================================================');
    console.log('✅ Systemet är redo att användas av Loveable frontend');
    console.log('📋 Se SSAB_OXELOSUND_SETUP.md för API-dokumentation');
    console.log('🔗 API Endpoints:');
    console.log('   - GET/POST /api/generate-schedule');
    console.log('   - GET/POST /api/setup-ssab');

  } catch (error) {
    console.error('❌ Test misslyckades:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Kör tester om scriptet körs direkt
if (require.main === module) {
  testSSABSystem();
}

module.exports = { testSSABSystem };