// ✅ Test FINAL SSAB Implementation
import SSABFinalCorrect from './SSAB_Final_Correct';

console.log('🧪 TESTING FINAL SSAB Implementation');
console.log('═'.repeat(50));

// Generate the schedule
console.log('\n📊 Generating schedule...');
const result = SSABFinalCorrect.generateForProduction();
console.log(result.summary);

// Show first 20 days in detail
console.log('\n📅 First 20 days detailed view:');
const janShifts = result.shifts.filter(s => s.date.startsWith('2025-01')).slice(0, 100);

const shiftsByDate: { [date: string]: any[] } = {};
janShifts.forEach(shift => {
  if (!shiftsByDate[shift.date]) shiftsByDate[shift.date] = [];
  shiftsByDate[shift.date].push(shift);
});

Object.entries(shiftsByDate).slice(0, 20).forEach(([date, dayShifts]) => {
  const workingShifts = dayShifts.filter(s => s.type !== 'L');
  const types = workingShifts.map(s => s.type).sort();
  const teams = workingShifts.map(s => s.team);
  
  const isValidDay = JSON.stringify(types) === JSON.stringify(['E', 'F', 'N']);
  const status = isValidDay ? '✅' : (workingShifts.length === 3 ? '⚠️' : '❌');
  
  console.log(`${date}: Teams [${teams.join(',')}] Shifts [${types.join(',')}] ${status}`);
  
  // Show team details for this day
  dayShifts.forEach(shift => {
    if (shift.type !== 'L') {
      console.log(`  Team ${shift.team}: ${shift.type} (${shift.start_time}-${shift.end_time})`);
    }
  });
});

// Validation summary
console.log('\n🔍 Validation Summary:');
console.log(`Perfect days: ${result.validation.stats.perfectDays}/${result.validation.stats.totalDays}`);
console.log(`Success rate: ${Math.round((result.validation.stats.perfectDays/result.validation.stats.totalDays)*100)}%`);

if (result.validation.errors.length > 0) {
  console.log('\n❌ Issues found:');
  result.validation.errors.forEach(error => console.log(`  - ${error}`));
}

// Show when teams start and their first few shifts
console.log('\n👥 Team Start Analysis:');
const teamStarts = {
  31: '2025-01-03',
  32: '2025-01-06', 
  33: '2025-01-08',
  34: '2025-01-10',
  35: '2025-01-13'
};

for (const [team, startDate] of Object.entries(teamStarts)) {
  console.log(`\nTeam ${team} starts ${startDate}:`);
  const teamShifts = result.shifts
    .filter(s => s.team === parseInt(team) && s.date >= startDate)
    .slice(0, 12); // Show first 12 days
    
  teamShifts.forEach((shift, i) => {
    console.log(`  Day ${i+1} (${shift.date}): ${shift.type} ${shift.start_time}-${shift.end_time}`);
  });
}

console.log('\n🚀 READY FOR IMPLEMENTATION!');
console.log('Next steps:');
console.log('1. Review the output above');
console.log('2. Import to Supabase using the generated data');
console.log('3. Update frontend to use corrected schedule');