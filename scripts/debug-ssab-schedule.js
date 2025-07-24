#!/usr/bin/env node

const { SHIFT_TYPES, calculateShiftForDate } = require('../data/ShiftSchedules');
const { COMPANIES } = require('../data/companies');

function debugSSABSchedule() {
  console.log('🔍 SSAB Oxelösund Schema Debug - 24 Juli 2025');
  console.log('==============================================\n');

  const today = new Date('2025-07-24');
  const ssabShift = SHIFT_TYPES.SSAB_3SKIFT;
  const ssabCompany = COMPANIES.SSAB;

  console.log('📋 Aktuell SSAB konfiguration:');
  console.log(`Mönster: [${ssabShift.pattern.join(', ')}]`);
  console.log(`Cykel: ${ssabShift.cycle} dagar`);
  console.log(`Lag: [${ssabCompany.teams.join(', ')}]\n`);

  console.log('🗓️ Schema för alla lag idag (24 juli 2025):');
  ssabCompany.teams.forEach((team, index) => {
    const shift = calculateShiftForDate(today, ssabShift, team);
    const offsetPerTeam = Math.floor(ssabShift.cycle / ssabCompany.teams.length);
    const teamOffset = index * offsetPerTeam;
    
    console.log(`Lag ${team}: ${shift.code} (${shift.time.name || 'Ledig'}) - Offset: ${teamOffset}, Cykeldag: ${shift.cycleDay}`);
  });

  console.log('\n📅 Schema för Lag 31 nästa 7 dagar:');
  for (let i = 0; i < 7; i++) {
    const date = new Date('2025-07-24');
    date.setDate(date.getDate() + i);
    const shift = calculateShiftForDate(date, ssabShift, '31');
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    
    console.log(`${dayName} ${date.getDate()}/7: ${shift.code} (${shift.time.name || 'Ledig'}) - Cykeldag ${shift.cycleDay}`);
  }

  console.log('\n🎯 Förväntat schema för Lag 31:');
  console.log('Torsdag 24/7: E (Eftermiddag) - sista eftermiddagen');
  console.log('Fredag 25/7: N (Natt)');
  console.log('Lördag 26/7: N (Natt)');
  console.log('Söndag 27/7: N (Natt)');
  console.log('Måndag 28/7: L (Ledig)');
  
  // Kontrollera att det stämmer
  const expectedPattern = ['E', 'N', 'N', 'N', 'L'];
  console.log('\n✅ Verifiering av förväntat mönster:');
  let allCorrect = true;
  for (let i = 0; i < 5; i++) {
    const date = new Date('2025-07-24');
    date.setDate(date.getDate() + i);
    const shift = calculateShiftForDate(date, ssabShift, '31');
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    const expected = expectedPattern[i];
    const isCorrect = shift.code === expected;
    allCorrect = allCorrect && isCorrect;
    
    console.log(`${dayName} ${date.getDate()}/7: ${shift.code} ${isCorrect ? '✅' : '❌'} (förväntat: ${expected})`);
  }
  
  console.log(`\nResultat: ${allCorrect ? '✅ KORREKT' : '❌ FELAKTIGT'} schema för Lag 31`);

  // Testa olika startdatum för att hitta rätt offset
  console.log('\n🔧 Testar olika startdatum för att hitta rätt synkronisering:');
  
  const testDates = [
    '2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22',
    '2025-01-01', '2025-01-06', '2025-01-13', '2025-01-20'
  ];

  testDates.forEach(startDateStr => {
    const startDate = new Date(startDateStr);
    const shift = calculateShiftForDate(today, ssabShift, '31', startDate);
    console.log(`Startdatum ${startDateStr}: Lag 31 idag = ${shift.code} (${shift.time.name || 'Ledig'})`);
  });
}

if (require.main === module) {
  debugSSABSchedule();
}

module.exports = { debugSSABSchedule };