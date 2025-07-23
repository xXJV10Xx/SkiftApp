const fs = require('fs');
const path = require('path');

const inputFiles = [
  'skiftscheman_alla_företag_2020_2030.json',
  'skiftschema-output.json'
];

const outputDir = 'split_json';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

inputFiles.forEach(inputFile => {
  if (!fs.existsSync(inputFile)) {
    console.log(`Filen ${inputFile} hittades inte, hoppar över.`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const companies = Object.keys(data);
  companies.forEach(company => {
    const outFile = path.join(outputDir, `${company}_${inputFile.replace('.json','')}.json`);
    fs.writeFileSync(outFile, JSON.stringify(data[company]));
    console.log(`Skapade ${outFile}`);
  });
});
console.log('Klar! Alla företag är nu separata JSON-filer.');