const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
                            process.env.SUPABASE_KEY || 
                            process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  console.log('\n💡 Make sure you have either:');
  console.log('   - SUPABASE_SERVICE_KEY (recommended for admin operations)');
  console.log('   - SUPABASE_KEY (fallback)');
  console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY (fallback)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const createSchedulesTable = async () => {
  console.log('🏗️  Setting up schedules table...');
  
  try {
    // First, try to create the table using a raw SQL query
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schedules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date TEXT NOT NULL,
        shift TEXT,
        team TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (error) {
      console.log('⚠️  RPC method not available, trying alternative approach...');
      
      // Alternative: Try to insert a test record to see if table exists
      const { error: testError } = await supabase
        .from('schedules')
        .select('id')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.error('❌ Schedules table does not exist.');
        console.log('\n📋 Please create the table manually in Supabase SQL Editor:');
        console.log('==================================================');
        console.log(createTableSQL);
        console.log('==================================================');
        console.log('\nThen run this script again.');
        return false;
      } else if (testError) {
        console.error('❌ Error checking table:', testError.message);
        return false;
      } else {
        console.log('✅ Schedules table already exists');
        return true;
      }
    } else {
      console.log('✅ Schedules table created successfully');
      return true;
    }
  } catch (err) {
    console.error('❌ Error setting up table:', err.message);
    return false;
  }
};

const enableRLS = async () => {
  console.log('🔒 Setting up Row Level Security...');
  
  try {
    const rlsSQL = `
      ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Schedules are viewable by authenticated users" ON schedules;
      DROP POLICY IF EXISTS "Schedules can be managed by service role" ON schedules;
      
      CREATE POLICY "Schedules are viewable by authenticated users" ON schedules
        FOR SELECT USING (auth.role() = 'authenticated');
      
      CREATE POLICY "Schedules can be managed by service role" ON schedules
        FOR ALL USING (auth.role() = 'service_role');
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (error) {
      console.log('⚠️  Could not set up RLS automatically. Please set up manually:');
      console.log('==================================================');
      console.log(rlsSQL);
      console.log('==================================================');
      return false;
    } else {
      console.log('✅ Row Level Security configured');
      return true;
    }
  } catch (err) {
    console.error('⚠️  RLS setup error:', err.message);
    return false;
  }
};

const testTableOperations = async () => {
  console.log('🧪 Testing table operations...');
  
  try {
    // Test insert
    const testData = {
      date: 'test-' + Date.now(),
      shift: 'Test Shift',
      team: 'Test Team'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('schedules')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Insert operation working');
    
    // Test select
    const { data: selectData, error: selectError } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', testData.date);
    
    if (selectError) {
      console.error('❌ Select test failed:', selectError.message);
      return false;
    }
    
    console.log('✅ Select operation working');
    
    // Test delete (cleanup)
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('date', testData.date);
    
    if (deleteError) {
      console.error('❌ Delete test failed:', deleteError.message);
      return false;
    }
    
    console.log('✅ Delete operation working');
    return true;
  } catch (err) {
    console.error('❌ Table operations test error:', err.message);
    return false;
  }
};

const main = async () => {
  console.log('🚀 Skiftappen Database Setup');
  console.log('============================\n');
  
  let success = true;
  
  // Step 1: Create table
  if (!(await createSchedulesTable())) {
    success = false;
  }
  
  console.log(''); // Empty line
  
  // Step 2: Enable RLS (optional, may fail in some setups)
  await enableRLS();
  
  console.log(''); // Empty line
  
  // Step 3: Test operations
  if (!(await testTableOperations())) {
    success = false;
  }
  
  console.log('\n============================');
  if (success) {
    console.log('🎉 Database setup completed successfully!');
    console.log('💡 You can now run the scraper with: npm run scrape');
    process.exit(0);
  } else {
    console.log('⚠️  Database setup completed with some issues.');
    console.log('💡 Please check the messages above and fix any problems.');
    process.exit(1);
  }
};

main().catch(err => {
  console.error('💥 Setup failed:', err.message);
  process.exit(1);
});