const fs = require('fs');
const path = require('path');

// Read the generated JSON file
const outputPath = path.join(process.cwd(), 'skiftschema-output.json');
const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

console.log('📊 Generated Shift Schedule Summary');
console.log('===================================');
console.log(`Total schedules: ${data.length}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

// Get unique companies, teams, and years
const companies = [...new Set(data.map(s => s.företag))];
const teams = [...new Set(data.map(s => s.skiftlag))];
const years = [...new Set(data.map(s => s.år))];

console.log(`\nCompanies (${companies.length}):`);
companies.forEach(company => {
  const companySchedules = data.filter(s => s.företag === company);
  const companyTeams = [...new Set(companySchedules.map(s => s.skiftlag))];
  console.log(`  ${company}: ${companyTeams.length} teams`);
});

console.log(`\nYears: ${years.length} (${Math.min(...years)} - ${Math.max(...years)})`);

// Show sample data
console.log('\n📋 Sample Data:');
const sample = data[0];
console.log(`Company: ${sample.företag}`);
console.log(`Team: ${sample.skiftlag}`);
console.log(`Year: ${sample.år}`);
console.log(`Shifts: ${sample.schema.length} days`);

// Show first 10 shifts
console.log('\nFirst 10 shifts:');
sample.schema.slice(0, 10).forEach(shift => {
  console.log(`  ${shift.datum}: ${shift.skift}`);
});

// Show shift distribution
const shiftTypes = {};
sample.schema.forEach(shift => {
  shiftTypes[shift.skift] = (shiftTypes[shift.skift] || 0) + 1;
});

console.log('\nShift distribution:');
Object.entries(shiftTypes).forEach(([shift, count]) => {
  console.log(`  ${shift}: ${count} days`);
});

console.log('\n✅ JSON file is ready for import into your app!'); 