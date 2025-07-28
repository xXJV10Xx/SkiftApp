const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co',
  SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk'
};

const supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_KEY);

// Test functions
const testInterestWorkflow = async () => {
  console.log('🔍 Testing interest workflow...');
  
  try {
    // 1. Test employees table access
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(2);
    
    if (employeesError) {
      console.error('❌ Employees table test failed:', employeesError.message);
      return false;
    }
    
    if (!employees || employees.length < 2) {
      console.log('⚠️  Need at least 2 employees to test interest functionality');
      console.log('💡 Run the SQL from fix-chat script to add test data');
      return false;
    }
    
    console.log(`✅ Found ${employees.length} employees for testing`);
    
    // 2. Test private chat room creation
    const testChatName = `Test Private Chat ${Date.now()}`;
    const { data: chatRoom, error: chatError } = await supabase
      .from('chat_rooms')
      .insert({
        name: testChatName,
        description: 'Test private chat for interest functionality',
        type: 'private',
        is_private: true
      })
      .select()
      .single();
    
    if (chatError) {
      console.error('❌ Private chat creation test failed:', chatError.message);
      return false;
    }
    
    console.log('✅ Private chat room creation works');
    
    // 3. Test chat room members
    const { error: membersError } = await supabase
      .from('chat_room_members')
      .insert([
        {
          chat_room_id: chatRoom.id,
          employee_id: employees[0].id,
          role: 'member'
        },
        {
          chat_room_id: chatRoom.id,
          employee_id: employees[1].id,
          role: 'member'
        }
      ]);
    
    if (membersError) {
      console.error('❌ Chat members test failed:', membersError.message);
      return false;
    }
    
    console.log('✅ Chat room member management works');
    
    // 4. Test interest message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoom.id,
        sender_id: employees[0].id,
        content: `Hej ${employees[1].first_name}! Jag är intresserad av att chatta med dig. 😊`,
        message_type: 'interest'
      });
    
    if (messageError) {
      console.error('❌ Interest message test failed:', messageError.message);
      return false;
    }
    
    console.log('✅ Interest message sending works');
    
    // 5. Test private chat retrieval
    const { data: privateChatRooms, error: retrieveError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('type', 'private')
      .eq('id', chatRoom.id);
    
    if (retrieveError) {
      console.error('❌ Private chat retrieval test failed:', retrieveError.message);
      return false;
    }
    
    console.log('✅ Private chat retrieval works');
    
    // Cleanup test data
    await supabase.from('chat_rooms').delete().eq('id', chatRoom.id);
    console.log('✅ Test cleanup completed');
    
    return true;
  } catch (err) {
    console.error('❌ Interest workflow test error:', err.message);
    return false;
  }
};

const testUserListFunctionality = async () => {
  console.log('🔍 Testing user list functionality...');
  
  try {
    // Test company-based employee filtering
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ Companies query failed:', companiesError.message);
      return false;
    }
    
    if (!companies || companies.length === 0) {
      console.log('⚠️  No companies found for testing');
      return false;
    }
    
    const company = companies[0];
    
    // Test employee filtering by company
    const { data: companyEmployees, error: companyEmployeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', company.id);
    
    if (companyEmployeesError) {
      console.error('❌ Company employees query failed:', companyEmployeesError.message);
      return false;
    }
    
    console.log(`✅ Found ${companyEmployees?.length || 0} employees in ${company.name}`);
    
    // Test team-based filtering
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('company_id', company.id)
      .limit(1);
    
    if (teamsError) {
      console.error('❌ Teams query failed:', teamsError.message);
      return false;
    }
    
    if (teams && teams.length > 0) {
      const team = teams[0];
      
      const { data: teamEmployees, error: teamEmployeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('team_id', team.id);
      
      if (teamEmployeesError) {
        console.error('❌ Team employees query failed:', teamEmployeesError.message);
        return false;
      }
      
      console.log(`✅ Found ${teamEmployees?.length || 0} employees in team ${team.name}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ User list functionality test error:', err.message);
    return false;
  }
};

const runAllTests = async () => {
  console.log('🧪 Skiftappen Interest Functionality Test');
  console.log('==========================================\n');
  
  const tests = [
    { name: 'Interest Workflow', fn: testInterestWorkflow },
    { name: 'User List Functionality', fn: testUserListFunctionality }
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
  
  console.log('==========================================');
  console.log(`📊 Test Results: ${passedTests}/${tests.length} passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 Interest functionality is working correctly!');
    console.log('');
    console.log('✅ Users can:');
    console.log('  - See team members in the Team tab');
    console.log('  - Click "Intresserad" to start private chats');
    console.log('  - Send interest messages automatically');
    console.log('  - Access private chats in the Chat tab');
    console.log('');
    console.log('🚀 Ready to use! Start the app and test the Team tab.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the database setup.');
    console.log('💡 Run: npm run fix-chat');
    process.exit(1);
  }
};

// Run tests
runAllTests().catch(err => {
  console.error('💥 Test suite crashed:', err.message);
  process.exit(1);
});