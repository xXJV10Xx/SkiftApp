const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co',
  SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk'
};

const supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_KEY);

// Test functions
const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
};

const testSchedulesTable = async () => {
  console.log('🔍 Testing schedules table...');
  
  try {
    // Test insert
    const testData = {
      date: '2024-01-01',
      shift: 'Day Shift',
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
    
    console.log('✅ Insert test successful');
    
    // Test select
    const { data: selectData, error: selectError } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', '2024-01-01')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Select test failed:', selectError.message);
      return false;
    }
    
    console.log('✅ Select test successful');
    
    // Cleanup test data
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('date', '2024-01-01');
    
    if (deleteError) {
      console.warn('⚠️  Cleanup warning:', deleteError.message);
    } else {
      console.log('✅ Cleanup successful');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Table test error:', err.message);
    return false;
  }
};

const testEnvironmentVariables = () => {
  console.log('🔍 Testing environment variables...');
  
  const required = [
    { name: 'SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL', value: TEST_CONFIG.SUPABASE_URL },
    { name: 'SUPABASE_KEY/EXPO_PUBLIC_SUPABASE_ANON_KEY', value: TEST_CONFIG.SUPABASE_KEY }
  ];
  
  let allPresent = true;
  
  required.forEach(({ name, value }) => {
    if (!value || value.includes('your-') || value.length < 10) {
      console.error(`❌ ${name}: Missing or invalid`);
      allPresent = false;
    } else {
      console.log(`✅ ${name}: Present`);
    }
  });
  
  return allPresent;
};

const testPuppeteerDependencies = async () => {
  console.log('🔍 Testing Puppeteer dependencies...');
  
  try {
    const puppeteer = require('puppeteer-core');
    console.log('✅ puppeteer-core module found');
    
    // Check if Chrome is available
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
    const fs = require('fs');
    
    if (fs.existsSync(executablePath)) {
      console.log('✅ Chrome executable found:', executablePath);
    } else {
      console.warn('⚠️  Chrome executable not found at:', executablePath);
      console.log('💡 This is normal in development. Chrome will be installed in CI/CD.');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Puppeteer dependency error:', err.message);
    return false;
  }
};

const runAllTests = async () => {
  console.log('🧪 Skiftappen Scraper Test Suite');
  console.log('==================================\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Schedules Table', fn: testSchedulesTable },
    { name: 'Puppeteer Dependencies', fn: testPuppeteerDependencies }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (err) {
      console.error(`❌ Test "${test.name}" threw an error:`, err.message);
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('==================================');
  console.log(`📊 Test Results: ${passedTests}/${tests.length} passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All tests passed! Scraper should work correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues before running the scraper.');
    process.exit(1);
  }
};

// Run tests
runAllTests().catch(err => {
  console.error('💥 Test suite crashed:', err.message);
  process.exit(1);
});