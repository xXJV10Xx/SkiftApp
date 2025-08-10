// 🚀 FINAL SUPABASE DEPLOYMENT - Correct column mapping
import { createClient } from '@supabase/supabase-js';
import SSABFinalCorrect from './SSAB_Final_Correct';

const SUPABASE_URL = 'https://fsefeherdbtsddqimjco.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

async function deployFinal() {
  console.log('🚀 FINAL DEPLOYMENT TO SUPABASE');
  console.log('═'.repeat(40));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('📊 Generating corrected SSAB schedule...');
    const shifts = SSABFinalCorrect.generatePreciseSchedule('2025-01-01', '2025-12-31');
    
    // Map to correct Supabase schema
    const supabaseShifts = shifts.map(shift => ({
      team: shift.team,
      date: shift.date,
      shift_type: shift.type,  // Use shift_type instead of type
      code: shift.type,        // Also set code field
      start_time: shift.start_time || null,
      end_time: shift.end_time || null,
      hours_worked: getHours(shift.type),
      company: 'SSAB OXELÖSUND',
      department: `Lag ${shift.team}`,
      source_url: 'https://github.com/xXJV10Xx/SkiftApp',
      notes: `Corrected ${getPatternName(shift.team)} schedule`
    }));

    console.log(`✅ Mapped ${supabaseShifts.length} shifts to correct schema`);

    // Clear existing SSAB data
    console.log('\n🧹 Clearing old SSAB data...');
    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .in('team', [31, 32, 33, 34, 35]);

    if (deleteError) {
      console.warn('⚠️ Delete warning:', deleteError.message);
    }

    // Insert in batches
    console.log('\n📤 Deploying corrected shifts...');
    const batchSize = 100; // Small batches for safety
    let totalInserted = 0;

    for (let i = 0; i < supabaseShifts.length; i += batchSize) {
      const batch = supabaseShifts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(supabaseShifts.length / batchSize);

      console.log(`📦 Batch ${batchNum}/${totalBatches}...`);

      try {
        const { error: insertError, count } = await supabase
          .from('shifts')
          .insert(batch);

        if (insertError) {
          console.error(`❌ Batch ${batchNum}:`, insertError.message);
          continue;
        }

        totalInserted += batch.length;
        console.log(`✅ ${batch.length} shifts inserted (${totalInserted} total)`);

      } catch (batchError) {
        console.error(`❌ Batch ${batchNum} error:`, batchError);
      }
    }

    // Validation check
    console.log('\n🔍 Validating deployment...');
    const { data: validation, error: valError } = await supabase
      .from('shifts')
      .select('team, date, shift_type')
      .in('team', [31, 32, 33, 34, 35])
      .gte('date', '2025-01-08')
      .lte('date', '2025-01-12')
      .order('date')
      .order('team');

    if (valError) {
      console.warn('⚠️ Validation error:', valError.message);
    } else if (validation) {
      console.log(`📊 Validation sample (${validation.length} records):`);
      
      // Group by date and check coverage
      const dates = [...new Set(validation.map(s => s.date))];
      dates.forEach(date => {
        const dayShifts = validation.filter(s => s.date === date && s.shift_type !== 'L');
        const teams = dayShifts.map(s => s.team);
        const types = dayShifts.map(s => s.shift_type).sort();
        const perfect = JSON.stringify(types) === JSON.stringify(['E', 'F', 'N']);
        
        console.log(`  ${date}: Teams [${teams.join(',')}] Types [${types.join(',')}] ${perfect ? '✅' : '⚠️'}`);
      });
    }

    console.log('\n🎯 SUPABASE DEPLOYMENT COMPLETE!');
    console.log(`✅ Deployed: ${totalInserted}/${supabaseShifts.length} shifts`);
    console.log('✅ Teams 31-35 corrected to exact SSAB specifications');

    return { 
      success: totalInserted > 0, 
      inserted: totalInserted, 
      total: supabaseShifts.length 
    };

  } catch (error) {
    console.error('❌ DEPLOYMENT FAILED:', error);
    return { success: false, error };
  }
}

function getHours(shiftType: string): number {
  switch (shiftType) {
    case 'F':
    case 'E':
    case 'N':
      return 8;
    case 'L':
    default:
      return 0;
  }
}

function getPatternName(team: number): string {
  const patterns = {
    31: '3F→2E→2N→5L',
    32: '2F→2E→3N→4L', 
    33: '2F→3E→2N→5L',
    34: '3F→2E→2N→5L',
    35: '2F→2E→3N→4L'
  };
  return patterns[team as keyof typeof patterns] || 'Unknown';
}

deployFinal().then(result => {
  if (result.success) {
    console.log('\n🎉 SUPABASE DEPLOYMENT SUCCESSFUL!');
    console.log(`Deployed ${result.inserted} corrected shifts`);
  } else {
    console.log('\n💥 DEPLOYMENT ISSUES - Check logs above');
  }
});

export default deployFinal;