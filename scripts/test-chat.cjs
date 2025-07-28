const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co',
  SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk'
};

const supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_KEY);

// Required tables for chat functionality
const REQUIRED_TABLES = [
  'companies',
  'teams', 
  'employees',
  'profiles',
  'chat_rooms',
  'chat_room_members',
  'messages',
  'shifts',
  'schedules'
];

// Test functions
const testTableExists = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        return { exists: false, error: `Table ${tableName} does not exist` };
      }
      return { exists: false, error: error.message };
    }
    
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
};

const testChatTables = async () => {
  console.log('🔍 Testing chat database tables...');
  
  const results = {};
  let allTablesExist = true;
  
  for (const table of REQUIRED_TABLES) {
    const result = await testTableExists(table);
    results[table] = result;
    
    if (result.exists) {
      console.log(`✅ ${table}: exists`);
    } else {
      console.log(`❌ ${table}: ${result.error}`);
      allTablesExist = false;
    }
  }
  
  return { allTablesExist, results };
};

const testChatFunctionality = async () => {
  console.log('🔍 Testing chat functionality...');
  
  try {
    // Test companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ Companies test failed:', companiesError.message);
      return false;
    }
    
    console.log('✅ Companies table accessible');
    
    // Test teams table  
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);
    
    if (teamsError) {
      console.error('❌ Teams test failed:', teamsError.message);
      return false;
    }
    
    console.log('✅ Teams table accessible');
    
    // Test employees table
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (employeesError) {
      console.error('❌ Employees test failed:', employeesError.message);
      return false;
    }
    
    console.log('✅ Employees table accessible');
    
    // Test chat_rooms table
    const { data: chatRooms, error: chatRoomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .limit(1);
    
    if (chatRoomsError) {
      console.error('❌ Chat rooms test failed:', chatRoomsError.message);
      return false;
    }
    
    console.log('✅ Chat rooms table accessible');
    
    // Test messages table
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ Messages test failed:', messagesError.message);
      return false;
    }
    
    console.log('✅ Messages table accessible');
    
    return true;
  } catch (err) {
    console.error('❌ Chat functionality test error:', err.message);
    return false;
  }
};

const generateMissingTableSQL = (missingTables) => {
  const sqlStatements = [];
  
  if (missingTables.includes('companies')) {
    sqlStatements.push(`
-- Companies Table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');`);
  }
  
  if (missingTables.includes('teams')) {
    sqlStatements.push(`
-- Teams Table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by authenticated users" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');`);
  }
  
  if (missingTables.includes('employees')) {
    sqlStatements.push(`
-- Employees Table
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employees in same company" ON employees 
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);`);
  }
  
  if (missingTables.includes('profiles')) {
    sqlStatements.push(`
-- Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'sv',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);`);
  }
  
  if (missingTables.includes('chat_rooms')) {
    sqlStatements.push(`
-- Chat Rooms Table
CREATE TABLE chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'team',
  department TEXT,
  is_private BOOLEAN DEFAULT false,
  auto_join_department TEXT,
  auto_join_team BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat rooms they are members of" ON chat_rooms
FOR SELECT USING (
  id IN (
    SELECT chat_room_id FROM chat_room_members 
    WHERE employee_id = auth.uid()
  )
);`);
  }
  
  if (missingTables.includes('chat_room_members')) {
    sqlStatements.push(`
-- Chat Room Members Table
CREATE TABLE chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_room_id, employee_id)
);

ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships" ON chat_room_members
  FOR SELECT USING (employee_id = auth.uid());`);
  }
  
  if (missingTables.includes('messages')) {
    sqlStatements.push(`
-- Messages Table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in rooms they are members of" ON messages
FOR SELECT USING (
  chat_room_id IN (
    SELECT chat_room_id FROM chat_room_members 
    WHERE employee_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to rooms they are members of" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  chat_room_id IN (
    SELECT chat_room_id FROM chat_room_members 
    WHERE employee_id = auth.uid()
  )
);`);
  }
  
  if (missingTables.includes('shifts')) {
    sqlStatements.push(`
-- Shifts Table
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  shift_type TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company shifts" ON shifts 
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employees 
    WHERE company_id = (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);`);
  }
  
  if (missingTables.includes('schedules')) {
    sqlStatements.push(`
-- Schedules Table (for Scraping)
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  shift TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedules are viewable by authenticated users" ON schedules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Schedules can be managed by service role" ON schedules
  FOR ALL USING (auth.role() = 'service_role');`);
  }
  
  return sqlStatements.join('\n\n');
};

const runAllTests = async () => {
  console.log('🧪 Skiftappen Chat Test Suite');
  console.log('==============================\n');
  
  // Test 1: Check all required tables
  const { allTablesExist, results } = await testChatTables();
  console.log(''); // Empty line
  
  // Test 2: Test chat functionality if tables exist
  let chatFunctional = false;
  if (allTablesExist) {
    chatFunctional = await testChatFunctionality();
  } else {
    console.log('⚠️  Skipping chat functionality test - missing tables');
  }
  
  console.log('\n==============================');
  console.log('📊 Test Results:');
  console.log(`- Database tables: ${allTablesExist ? '✅' : '❌'}`);
  console.log(`- Chat functionality: ${chatFunctional ? '✅' : '❌'}`);
  
  // Generate missing table SQL if needed
  const missingTables = Object.keys(results).filter(table => !results[table].exists);
  
  if (missingTables.length > 0) {
    console.log('\n🔧 Missing Tables Found:');
    missingTables.forEach(table => console.log(`- ${table}`));
    
    console.log('\n📋 SQL to create missing tables:');
    console.log('=====================================');
    console.log(generateMissingTableSQL(missingTables));
    console.log('=====================================');
    console.log('\n💡 Copy the SQL above and run it in your Supabase SQL Editor');
  }
  
  if (allTablesExist && chatFunctional) {
    console.log('\n🎉 Chat functionality is ready to use!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Chat functionality needs setup. Please create the missing tables.');
    process.exit(1);
  }
};

// Run tests
runAllTests().catch(err => {
  console.error('💥 Test suite crashed:', err.message);
  process.exit(1);
});