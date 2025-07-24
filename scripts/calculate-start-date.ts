#!/usr/bin/env tsx

// Beräkna rätt startdatum för SSAB schema
function calculateCorrectStartDate() {
  const targetDate = new Date('2025-07-24'); // Idag
  const targetPosition = 5; // Position 5 = sista E i mönstret ['M', 'M', 'M', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L']
  const cycleLength = 14;
  
  console.log('🔢 Beräknar korrekt startdatum för SSAB schema');
  console.log('==============================================');
  console.log(`Måldag: ${targetDate.toDateString()}`);
  console.log(`Önskad position i cykel: ${targetPosition} (sista E)`);
  console.log(`Cykellängd: ${cycleLength} dagar\n`);
  
  // Beräkna hur många dagar tillbaka vi behöver gå
  const daysToSubtract = targetPosition;
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - daysToSubtract);
  
  console.log(`Beräknat startdatum: ${startDate.toDateString()}`);
  console.log(`ISO format: ${startDate.toISOString().split('T')[0]}`);
  
  // Verifiera genom att räkna framåt
  console.log('\n🔍 Verifiering:');
  const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const position = daysDiff % cycleLength;
  
  console.log(`Dagar från startdatum till måldag: ${daysDiff}`);
  console.log(`Position i cykel: ${position}`);
  console.log(`Förväntad position: ${targetPosition}`);
  console.log(`Resultat: ${position === targetPosition ? '✅ KORREKT' : '❌ FELAKTIGT'}`);
  
  return startDate;
}

const correctStartDate = calculateCorrectStartDate();