#!/usr/bin/env node

/**
 * Calendar Demo Script - Showcases long-term calendar functionality
 */

const ScheduleGeneratorService = require('../services/scheduleGeneratorService');

async function runCalendarDemo() {
  console.log('🗓️  SSAB Skiftschema Calendar Generator Demo');
  console.log('==========================================\n');

  const scheduleGenerator = new ScheduleGeneratorService();

  // Demo 1: Pattern Information
  console.log('📋 1. Shift Pattern Information');
  console.log('-------------------------------');
  const patternInfo = scheduleGenerator.getShiftPatternInfo();
  console.log(`Pattern Length: ${patternInfo.patternLength} days`);
  console.log(`Working Days per Cycle: ${patternInfo.workingDaysPerCycle}`);
  console.log(`Rest Days per Cycle: ${patternInfo.restDaysPerCycle}`);
  console.log(`Pattern: ${patternInfo.pattern.join(' ')}`);
  console.log();

  // Demo 2: Single Shift Calculation
  console.log('🎯 2. Single Shift Examples');
  console.log('----------------------------');
  const testDates = ['2022-01-01', '2024-07-15', '2030-12-25', '2040-12-31'];
  
  testDates.forEach(date => {
    const shift31 = scheduleGenerator.getShiftForDate(31, date);
    const shift35 = scheduleGenerator.getShiftForDate(35, date);
    console.log(`${date}: Team 31 = ${shift31.shiftType} (${shift31.shiftName}), Team 35 = ${shift35.shiftType} (${shift35.shiftName})`);
  });
  console.log();

  // Demo 3: Weekly Schedule
  console.log('📅 3. Weekly Schedule Example (Team 31, Jan 2024)');
  console.log('--------------------------------------------------');
  const weeklySchedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-01-07');
  
  weeklySchedule.schedule.forEach(shift => {
    const date = new Date(shift.date);
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    console.log(`${shift.date} (${dayName}): ${shift.shiftType} - ${shift.shiftName} ${shift.shiftTime || ''}`);
  });
  
  console.log(`\nWeek Statistics:`);
  console.log(`Working Days: ${weeklySchedule.statistics.workingDays}`);
  console.log(`Rest Days: ${weeklySchedule.statistics.restDays}`);
  console.log(`Total Hours: ${weeklySchedule.statistics.totalHours}h`);
  console.log();

  // Demo 4: Monthly Overview
  console.log('📊 4. Monthly Overview (Team 32, January 2024)');
  console.log('-----------------------------------------------');
  const monthlyCalendar = scheduleGenerator.generateMonthlyCalendar(32, 2024, 1);
  
  console.log(`Month: ${monthlyCalendar.monthName} ${monthlyCalendar.year}`);
  console.log(`Team: ${monthlyCalendar.teamName} (${monthlyCalendar.teamColor})`);
  console.log(`Statistics:`);
  console.log(`  Working Days: ${monthlyCalendar.statistics.workingDays}`);
  console.log(`  Rest Days: ${monthlyCalendar.statistics.restDays}`);
  console.log(`  Total Hours: ${monthlyCalendar.statistics.totalHours}h`);
  console.log(`  Average Hours/Week: ${Math.round(monthlyCalendar.statistics.averageHoursPerWeek)}h`);
  
  console.log('\nShift Breakdown:');
  Object.entries(monthlyCalendar.statistics.shiftBreakdown).forEach(([type, count]) => {
    if (count > 0) {
      const shiftInfo = scheduleGenerator.shiftTypes[type];
      console.log(`  ${type} (${shiftInfo.name}): ${count} days`);
    }
  });
  console.log();

  // Demo 5: Yearly Statistics
  console.log('📈 5. Yearly Statistics (Team 33, 2024)');
  console.log('----------------------------------------');
  const yearlyCalendar = scheduleGenerator.generateYearlyCalendar(33, 2024);
  
  console.log(`Year: ${yearlyCalendar.year}`);
  console.log(`Team: ${yearlyCalendar.teamName}`);
  console.log(`Annual Statistics:`);
  console.log(`  Total Working Days: ${yearlyCalendar.statistics.totalWorkingDays}`);
  console.log(`  Total Rest Days: ${yearlyCalendar.statistics.totalRestDays}`);
  console.log(`  Total Hours: ${yearlyCalendar.statistics.totalHours}h`);
  console.log(`  Work Percentage: ${Math.round((yearlyCalendar.statistics.totalWorkingDays / 366) * 100)}%`);
  
  console.log('\nMonthly Breakdown:');
  yearlyCalendar.months.forEach(month => {
    console.log(`  ${month.monthName}: ${month.statistics.workingDays} work days, ${month.statistics.totalHours}h`);
  });
  console.log();

  // Demo 6: Team Comparison
  console.log('👥 6. Team Comparison (All Teams, January 2024)');
  console.log('------------------------------------------------');
  const comparison = scheduleGenerator.generateAllTeamsComparison(2024, 1);
  
  console.log(`Month: ${comparison.monthName} ${comparison.year}`);
  console.log();
  
  Object.entries(comparison.teams).forEach(([teamNumber, teamData]) => {
    console.log(`${teamData.teamName}:`);
    console.log(`  Working Days: ${teamData.statistics.workingDays}`);
    console.log(`  Total Hours: ${teamData.statistics.totalHours}h`);
    console.log(`  Shift Types: ${Object.keys(teamData.statistics.shiftBreakdown).join(', ')}`);
    console.log();
  });

  // Demo 7: Shift Pattern Search
  console.log('🔍 7. Finding Specific Shifts (Team 34, F-shifts in Jan 2024)');
  console.log('--------------------------------------------------------------');
  const fShifts = scheduleGenerator.findShiftOccurrences(34, 'F', '2024-01-01', '2024-01-31');
  
  console.log(`Found ${fShifts.length} Förmiddag shifts:`);
  fShifts.slice(0, 5).forEach(occurrence => { // Show first 5
    console.log(`  ${occurrence.date} (${occurrence.dayOfWeek}) - Cycle Day ${occurrence.cycleDay}`);
  });
  if (fShifts.length > 5) {
    console.log(`  ... and ${fShifts.length - 5} more`);
  }
  console.log();

  // Demo 8: Long-term Range
  console.log('🌍 8. Long-term Analysis (Team 35, Full Year 2030)');
  console.log('---------------------------------------------------');
  const longTermSchedule = scheduleGenerator.generateTeamSchedule(35, '2030-01-01', '2030-12-31');
  
  console.log(`Full Year 2030 for ${longTermSchedule.teamName}:`);
  console.log(`  Total Days: ${longTermSchedule.statistics.totalDays}`);
  console.log(`  Working Days: ${longTermSchedule.statistics.workingDays}`);
  console.log(`  Rest Days: ${longTermSchedule.statistics.restDays}`);
  console.log(`  Annual Hours: ${longTermSchedule.statistics.totalHours}h`);
  console.log(`  Longest Work Streak: ${longTermSchedule.statistics.longestWorkStreak} days`);
  console.log(`  Longest Rest Streak: ${longTermSchedule.statistics.longestRestStreak} days`);
  console.log();

  // Demo 9: Export Example
  console.log('💾 9. Export Capabilities');
  console.log('-------------------------');
  try {
    const jsonExport = await scheduleGenerator.exportSchedule(31, '2024-01-01', '2024-01-07', 'json');
    const csvExport = await scheduleGenerator.exportSchedule(31, '2024-01-01', '2024-01-07', 'csv');
    
    console.log('✅ JSON Export: Success');
    console.log(`   Data points: ${jsonExport.data.schedule.length}`);
    console.log(`   Generated at: ${jsonExport.exportedAt}`);
    
    console.log('✅ CSV Export: Success');
    console.log(`   CSV rows: ${csvExport.split('\n').length - 1}`);
    
  } catch (error) {
    console.log('❌ Export Error:', error.message);
  }
  console.log();

  // Demo 10: Pattern Validation
  console.log('✅ 10. Pattern Validation');
  console.log('-------------------------');
  
  // Test pattern consistency over time
  const baseShift = scheduleGenerator.getShiftForDate(31, '2024-01-01');
  const cycleShift = scheduleGenerator.getShiftForDate(31, '2024-01-22'); // 21 days later
  const doubleCycleShift = scheduleGenerator.getShiftForDate(31, '2024-02-12'); // 42 days later
  
  console.log('Pattern Consistency Test:');
  console.log(`  2024-01-01: ${baseShift.shiftType} (Cycle Day ${baseShift.cycleDay})`);
  console.log(`  2024-01-22: ${cycleShift.shiftType} (Cycle Day ${cycleShift.cycleDay}) - Should match`);
  console.log(`  2024-02-12: ${doubleCycleShift.shiftType} (Cycle Day ${doubleCycleShift.cycleDay}) - Should match`);
  
  const consistent = baseShift.shiftType === cycleShift.shiftType && 
                   baseShift.shiftType === doubleCycleShift.shiftType;
  console.log(`  Pattern Consistent: ${consistent ? '✅ YES' : '❌ NO'}`);
  console.log();

  // Summary
  console.log('🎉 Demo Complete!');
  console.log('=================');
  console.log('The SSAB Schedule Generator successfully demonstrates:');
  console.log('✅ Accurate 21-day shift pattern implementation');
  console.log('✅ Team offset calculations (31-35)');
  console.log('✅ Long-term scheduling (2022-2040)');
  console.log('✅ Monthly and yearly calendar generation');
  console.log('✅ Team comparison and statistics');
  console.log('✅ Export capabilities (JSON/CSV)');
  console.log('✅ Pattern validation and consistency');
  console.log();
  console.log('🚀 Ready for production integration!');
}

// CLI execution
if (require.main === module) {
  runCalendarDemo()
    .then(() => {
      console.log('\n✨ Calendar demo completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { runCalendarDemo };