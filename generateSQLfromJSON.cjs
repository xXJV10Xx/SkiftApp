import fs from 'fs';

// Byt filnamn om du vill använda den andra filen!
const data = JSON.parse(fs.readFileSync('skiftschema-output.json', 'utf8'));

const companies = new Set();
const departments = new Set();
const teams = new Set();

for (const company of data) {
  companies.add(`('${company.company_id}', '${company.company_name.replace(/'/g, "''")}')`);
  for (const dept of company.departments) {
    departments.add(`('${dept.department_id}', '${dept.department_name.replace(/'/g, "''")}', '${company.company_id}')`);
    for (const team of dept.teams) {
      teams.add(`('${team.team_id}', '${team.team_name.replace(/'/g, "''")}', '${dept.department_id}', '${company.company_id}')`);
    }
  }
}

console.log('-- Företag');
console.log('INSERT INTO companies (id, name) VALUES');
console.log(Array.from(companies).join(',\n') + ' ON CONFLICT (id) DO NOTHING;');

console.log('\n-- Avdelningar');
console.log('INSERT INTO departments (id, name, company_id) VALUES');
console.log(Array.from(departments).join(',\n') + ' ON CONFLICT (id) DO NOTHING;');

console.log('\n-- Lag');
console.log('INSERT INTO teams (id, name, department_id, company_id) VALUES');
console.log(Array.from(teams).join(',\n') + ' ON CONFLICT (id) DO NOTHING;');