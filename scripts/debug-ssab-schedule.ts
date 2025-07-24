#!/usr/bin/env tsx

import { SHIFT_TYPES, calculateShiftForDate, getTeamOffset } from '../data/ShiftSchedules';
import { COMPANIES } from '../data/companies';

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
    const actualOffset = getTeamOffset(team, ssabShift);
    
    console.log(`Lag ${team}: ${shift.code} (${shift.time.name || 'Ledig'}) - Offset: ${actualOffset}, Cykeldag: ${shift.cycleDay}`);
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

  // Visa alla lag för att kontrollera synkroniseringen
  console.log('\n🔄 Schema för alla lag nästa 7 dagar:');
  for (let i = 0; i < 7; i++) {
    const date = new Date('2025-07-24');
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' });
    
    console.log(`${dayName} ${date.getDate()}/7:`);
    ssabCompany.teams.forEach(team => {
      const shift = calculateShiftForDate(date, ssabShift, team);
      console.log(`  Lag ${team}: ${shift.code} (${shift.time.name || 'Ledig'})`);
    });
    console.log('');
  }
}

debugSSABSchedule();