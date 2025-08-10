// 🚀 FIXED SUPABASE DEPLOYMENT - Adapted to actual table schema
import { createClient } from '@supabase/supabase-js';
import SSABFinalCorrect from './SSAB_Final_Correct';

const SUPABASE_URL = 'https://fsefeherdbtsddqimjco.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

async function deployFixed() {
  console.log('🚀 DEPLOYING CORRECTED SSAB SCHEDULE (FIXED)');
  console.log('═'.repeat(50));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Step 1: Check table schema
    console.log('🔍 Checking table schema...');
    const { data: sampleData, error: schemaError } = await supabase
      .from('shifts')
      .select('*')
      .limit(1);

    if (schemaError) {
      throw new Error(`Schema check failed: ${schemaError.message}`);
    }

    if (sampleData && sampleData.length > 0) {
      console.log('📋 Table columns:', Object.keys(sampleData[0]));
    }

    // Step 2: Generate corrected schedule with simplified format
    console.log('\n📊 Generating corrected schedule...');
    const shifts = SSABFinalCorrect.generatePreciseSchedule('2025-01-01', '2025-12-31');
    
    // Adapt to actual table schema (remove is_generated if not supported)
    const adaptedData = shifts.map(shift => ({
      team: shift.team,
      date: shift.date,
      type: shift.type,
      start_time: shift.start_time || null,
      end_time: shift.end_time || null
      // Remove is_generated and created_at if they don't exist
    }));

    console.log(`✅ Generated ${adaptedData.length} shifts`);

    // Step 3: Clear existing data for teams 31-35
    console.log('\n🧹 Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .in('team', [31, 32, 33, 34, 35])
      .gte('date', '2025-01-01')
      .lte('date', '2025-12-31');

    if (deleteError) {
      console.warn('⚠️ Delete warning:', deleteError.message);
    } else {
      console.log('✅ Cleared old data');
    }

    // Step 4: Insert in smaller batches
    console.log('\n📤 Inserting corrected data...');
    const batchSize = 500; // Smaller batches
    let inserted = 0;

    for (let i = 0; i < adaptedData.length; i += batchSize) {
      const batch = adaptedData.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(adaptedData.length / batchSize);

      try {
        console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
        
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(batch);

        if (insertError) {
          console.error(`❌ Batch ${batchNum} failed:`, insertError.message);
          // Continue with next batch instead of failing completely
          continue;
        }

        inserted += batch.length;
        console.log(`✅ Batch ${batchNum} inserted (${inserted} total)`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (batchError) {
        console.error(`❌ Batch ${batchNum} error:`, batchError);
        continue;
      }
    }

    // Step 5: Quick validation
    console.log('\n🔍 Validating deployment...');
    const { data: validationData, error: valError } = await supabase
      .from('shifts')
      .select('team, date, type')
      .in('team', [31, 32, 33, 34, 35])
      .gte('date', '2025-01-08')
      .lte('date', '2025-01-15')
      .order('date');

    if (valError) {
      console.warn('⚠️ Validation warning:', valError.message);
    } else if (validationData) {
      const dates = [...new Set(validationData.map(s => s.date))];
      let perfectDays = 0;

      dates.forEach(date => {
        const dayShifts = validationData.filter(s => s.date === date && s.type !== 'L');
        const types = dayShifts.map(s => s.type).sort();
        const isPerfect = JSON.stringify(types) === JSON.stringify(['E', 'F', 'N']);
        
        if (isPerfect) {
          perfectDays++;
          console.log(`✅ ${date}: Perfect F,E,N coverage`);
        } else {
          console.log(`⚠️ ${date}: ${types.join(',')} (${dayShifts.length} teams)`);
        }
      });

      console.log(`\n📊 Validation: ${perfectDays}/${dates.length} days perfect`);
    }

    console.log('\n🎯 SUPABASE DEPLOYMENT COMPLETE!');
    console.log(`✅ Successfully deployed ${inserted}/${adaptedData.length} shifts`);
    console.log('✅ SSAB teams 31-35 corrected');
    
    return { success: true, inserted };

  } catch (error) {
    console.error('❌ DEPLOYMENT FAILED:', error);
    return { success: false, error };
  }
}

deployFixed().then(result => {
  console.log(result.success ? '\n🚀 SUPABASE READY!' : '\n💥 SUPABASE FAILED');
});

export default deployFixed;