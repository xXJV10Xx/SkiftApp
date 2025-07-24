#!/usr/bin/env tsx

import { generateSSABSchedule } from '../lib/schedule-generator';

async function testAPISchedule() {
  console.log('🧪 Testing SSAB API Schedule Generation');
  console.log('=====================================\n');

  // Test för Lag 31 - ska ha E idag (24/7) och sedan N N N
  console.log('Testing Lag 31 for July 24-28, 2025...');
  
  try {
    const result = await generateSSABSchedule('31', '2025-07-24', '2025-07-28', true);
    
    if (result.success && result.data) {
      console.log('✅ API call successful');
      console.log(`Team: ${result.data.teamInfo.teamId}`);
      console.log(`Company: ${result.data.teamInfo.companyName}`);
      console.log(`Color: ${result.data.teamInfo.color}`);
      
      console.log('\nSchedule:');
      result.data.schedule.forEach(day => {
        const shiftInfo = day.shift.time.start ? 
          `${day.shift.time.name} (${day.shift.time.start}-${day.shift.time.end})` : 
          'Ledig';
        console.log(`${day.weekday} ${day.day}/7: ${day.shift.code} - ${shiftInfo}`);
      });
      
      if (result.data.stats) {
        console.log(`\nStats: ${result.data.stats.workDays} arbetsdagar, ${result.data.stats.totalHours}h totalt`);
      }
      
      // Verifiera att mönstret stämmer
      const expectedPattern = ['E', 'N', 'N', 'N', 'L'];
      const actualPattern = result.data.schedule.map(day => day.shift.code);
      const isCorrect = JSON.stringify(actualPattern) === JSON.stringify(expectedPattern);
      
      console.log(`\nPattern verification: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      console.log(`Expected: [${expectedPattern.join(', ')}]`);
      console.log(`Actual:   [${actualPattern.join(', ')}]`);
      
    } else {
      console.log('❌ API call failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
  
  // Test alla lag för idag
  console.log('\n🔄 Testing all teams for today (July 24, 2025)...');
  
  const teams: ('31' | '32' | '33' | '34' | '35')[] = ['31', '32', '33', '34', '35'];
  
  for (const team of teams) {
    try {
      const result = await generateSSABSchedule(team, '2025-07-24', '2025-07-24', false);
      
      if (result.success && result.data && result.data.schedule.length > 0) {
        const todayShift = result.data.schedule[0];
        const shiftInfo = todayShift.shift.time.start ? 
          `${todayShift.shift.time.name} (${todayShift.shift.time.start}-${todayShift.shift.time.end})` : 
          'Ledig';
        console.log(`Lag ${team}: ${todayShift.shift.code} - ${shiftInfo}`);
      } else {
        console.log(`Lag ${team}: ❌ Error - ${result.error}`);
      }
      
    } catch (error) {
      console.log(`Lag ${team}: ❌ Exception - ${error}`);
    }
  }
}

testAPISchedule();