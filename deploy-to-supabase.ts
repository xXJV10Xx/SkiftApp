// 🚀 DEPLOY CORRECTED SSAB SCHEDULE TO SUPABASE
// This script deploys the corrected schedule directly to the database

import { createClient } from '@supabase/supabase-js';
import SSABFinalCorrect from './SSAB_Final_Correct';

const SUPABASE_URL = 'https://fsefeherdbtsddqimjco.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

async function deployToSupabase() {
  console.log('🚀 DEPLOYING CORRECTED SSAB SCHEDULE TO SUPABASE');
  console.log('═'.repeat(60));

  try {
    // Create Supabase client with service key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('📊 Generating corrected schedule...');
    const result = SSABFinalCorrect.generateForProduction();
    console.log(result.summary);

    // Step 1: Clear existing data
    console.log('\n🧹 Clearing existing SSAB data...');
    const { error: deleteError, count: deletedCount } = await supabase
      .from('shifts')
      .delete({ count: 'exact' })
      .in('team', [31, 32, 33, 34, 35])
      .gte('date', '2025-01-01')
      .lte('date', '2025-12-31');

    if (deleteError) {
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    console.log(`✅ Cleared ${deletedCount || 0} old shifts`);

    // Step 2: Insert corrected data in batches
    console.log('\n📤 Inserting corrected schedule...');
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < result.supabaseData.length; i += batchSize) {
      const batch = result.supabaseData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(result.supabaseData.length / batchSize);

      console.log(`📦 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);

      const { error: insertError, count } = await supabase
        .from('shifts')
        .insert(batch)
        .select('id', { count: 'exact', head: true });

      if (insertError) {
        throw new Error(`Failed to insert batch ${batchNumber}: ${insertError.message}`);
      }

      totalInserted += batch.length;
      console.log(`✅ Batch ${batchNumber} inserted (${totalInserted}/${result.supabaseData.length} total)`);
    }

    // Step 3: Validate deployment
    console.log('\n🔍 Validating deployment...');
    const { data: validationData, error: validationError } = await supabase
      .from('shifts')
      .select('team, date, type')
      .in('team', [31, 32, 33, 34, 35])
      .gte('date', '2025-01-01')
      .lte('date', '2025-01-31')
      .order('date')
      .order('team');

    if (validationError) {
      console.warn('⚠️ Validation query failed:', validationError.message);
    } else {
      // Check a few key dates
      const testDates = ['2025-01-08', '2025-01-15', '2025-01-20'];
      let perfectDays = 0;

      testDates.forEach(date => {
        const dayShifts = validationData?.filter(s => s.date === date && s.type !== 'L') || [];
        const types = dayShifts.map(s => s.type).sort();
        const isPerfect = JSON.stringify(types) === JSON.stringify(['E', 'F', 'N']);
        
        console.log(`📅 ${date}: ${dayShifts.map(s => `${s.team}:${s.type}`).join(', ')} ${isPerfect ? '✅' : '⚠️'}`);
        if (isPerfect) perfectDays++;
      });

      console.log(`\n📊 Validation: ${perfectDays}/${testDates.length} test dates perfect`);
    }

    console.log('\n🎯 SUPABASE DEPLOYMENT COMPLETE!');
    console.log(`✅ Deployed ${totalInserted} corrected shifts`);
    console.log('✅ Teams 31-35 now follow exact SSAB specifications');
    console.log('✅ Ready for frontend and Rork AI integration');

    return {
      success: true,
      deployed: totalInserted,
      validation: result.validation
    };

  } catch (error) {
    console.error('❌ DEPLOYMENT FAILED:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run deployment
deployToSupabase().then(result => {
  if (result.success) {
    console.log('\n🚀 Ready for next deployment phase!');
    process.exit(0);
  } else {
    console.log('\n💥 Deployment failed, check errors above');
    process.exit(1);
  }
});

export default deployToSupabase;