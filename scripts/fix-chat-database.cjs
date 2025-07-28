const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
                            process.env.SUPABASE_KEY || 
                            process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const createEmployeesTable = async () => {
  console.log('🏗️  Creating employees table...');
  
  const sql = `
    -- Drop existing table if it exists (with dependencies)
    DROP TABLE IF EXISTS employees CASCADE;
    
    -- Create employees table
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

    -- Enable RLS
    ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Anyone can view employees" ON employees 
      FOR SELECT USING (true);

    CREATE POLICY "Users can insert employees" ON employees 
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Users can update employees" ON employees 
      FOR UPDATE USING (auth.role() = 'authenticated');
  `;
  
  try {
    // We'll output the SQL for manual execution since RPC might not be available
    console.log('📋 SQL for employees table:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    return true;
  } catch (err) {
    console.error('❌ Error creating employees table:', err.message);
    return false;
  }
};

const createChatRoomsTable = async () => {
  console.log('🏗️  Creating chat_rooms table...');
  
  const sql = `
    -- Drop existing table if it exists (with dependencies)
    DROP TABLE IF EXISTS chat_rooms CASCADE;
    
    -- Create chat_rooms table
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

    -- Enable RLS
    ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

    -- Create simple policies (avoid recursion)
    CREATE POLICY "Anyone can view chat rooms" ON chat_rooms
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create chat rooms" ON chat_rooms
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Users can update their own chat rooms" ON chat_rooms
      FOR UPDATE USING (created_by = auth.uid());
  `;
  
  try {
    console.log('📋 SQL for chat_rooms table:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    return true;
  } catch (err) {
    console.error('❌ Error creating chat_rooms table:', err.message);
    return false;
  }
};

const createChatRoomMembersTable = async () => {
  console.log('🏗️  Creating chat_room_members table...');
  
  const sql = `
    -- Drop existing table if it exists
    DROP TABLE IF EXISTS chat_room_members CASCADE;
    
    -- Create chat_room_members table
    CREATE TABLE chat_room_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(chat_room_id, employee_id)
    );

    -- Enable RLS
    ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own memberships" ON chat_room_members
      FOR SELECT USING (employee_id = auth.uid());

    CREATE POLICY "Users can join chat rooms" ON chat_room_members
      FOR INSERT WITH CHECK (employee_id = auth.uid());

    CREATE POLICY "Users can leave chat rooms" ON chat_room_members
      FOR DELETE USING (employee_id = auth.uid());
  `;
  
  try {
    console.log('📋 SQL for chat_room_members table:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    return true;
  } catch (err) {
    console.error('❌ Error creating chat_room_members table:', err.message);
    return false;
  }
};

const createOnlineStatusTable = async () => {
  console.log('🏗️  Creating online_status table...');
  
  const sql = `
    -- Drop existing table if it exists
    DROP TABLE IF EXISTS online_status CASCADE;
    
    -- Create online_status table
    CREATE TABLE online_status (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      is_online BOOLEAN DEFAULT false,
      last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- Enable RLS
    ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view online status of company members" ON online_status
      FOR SELECT USING (
        user_id IN (
          SELECT id FROM employees 
          WHERE company_id = (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
          )
        )
      );

    CREATE POLICY "Users can update their own online status" ON online_status
      FOR ALL USING (user_id = auth.uid());
  `;
  
  try {
    console.log('📋 SQL for online_status table:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    return true;
  } catch (err) {
    console.error('❌ Error creating online_status table:', err.message);
    return false;
  }
};

const createTestData = async () => {
  console.log('🏗️  Creating test data...');
  
  const sql = `
    -- Insert test companies (if not exists)
    INSERT INTO companies (name, description, location) 
    SELECT 'Test Company AB', 'Ett test företag', 'Stockholm'
    WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Test Company AB');

    -- Insert test teams (if not exists)
    INSERT INTO teams (name, color, company_id, description)
    SELECT 'Utvecklingsteam', '#007AFF', c.id, 'Huvudutvecklingsteam'
    FROM companies c 
    WHERE c.name = 'Test Company AB'
    AND NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Utvecklingsteam');

    -- Insert test employees (if not exists)
    INSERT INTO employees (email, first_name, last_name, company_id, team_id, department, position)
    SELECT 'test@example.com', 'Test', 'Användare', c.id, t.id, 'IT', 'Utvecklare'
    FROM companies c
    CROSS JOIN teams t
    WHERE c.name = 'Test Company AB' 
    AND t.name = 'Utvecklingsteam'
    AND NOT EXISTS (SELECT 1 FROM employees WHERE email = 'test@example.com');

    -- Create test chat room
    INSERT INTO chat_rooms (name, description, company_id, team_id, type)
    SELECT 'Test Chattrum', 'Ett test chattrum', c.id, t.id, 'team'
    FROM companies c
    CROSS JOIN teams t
    WHERE c.name = 'Test Company AB' 
    AND t.name = 'Utvecklingsteam'
    AND NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Test Chattrum');
  `;
  
  try {
    console.log('📋 SQL for test data:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    return true;
  } catch (err) {
    console.error('❌ Error creating test data:', err.message);
    return false;
  }
};

const enableRealtimeForTables = async () => {
  console.log('🔄 Enabling realtime for tables...');
  
  const sql = `
    -- Enable realtime for chat tables
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE employees;
    ALTER PUBLICATION supabase_realtime ADD TABLE online_status;
  `;
  
  try {
    console.log('📋 SQL for realtime setup:');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    return true;
  } catch (err) {
    console.error('❌ Error enabling realtime:', err.message);
    return false;
  }
};

const main = async () => {
  console.log('🚀 Skiftappen Chat Database Fix');
  console.log('================================\n');
  
  console.log('This script will generate SQL to fix the chat functionality.');
  console.log('Please copy and paste each SQL block into your Supabase SQL Editor.\n');
  
  // Step 1: Create employees table
  await createEmployeesTable();
  console.log('');
  
  // Step 2: Create chat_rooms table
  await createChatRoomsTable();
  console.log('');
  
  // Step 3: Create chat_room_members table
  await createChatRoomMembersTable();
  console.log('');
  
  // Step 4: Create online_status table
  await createOnlineStatusTable();
  console.log('');
  
  // Step 5: Create test data
  await createTestData();
  console.log('');
  
  // Step 6: Enable realtime
  await enableRealtimeForTables();
  console.log('');
  
  console.log('================================');
  console.log('🎯 Next Steps:');
  console.log('1. Copy each SQL block above');
  console.log('2. Paste into Supabase SQL Editor');
  console.log('3. Run each block one by one');
  console.log('4. Test with: npm run test-chat');
  console.log('5. Test private chat creation: npm run test-interest');
  console.log('6. Start the app and test all chat functionality');
  console.log('');
  console.log('💡 After running the SQL, the chat should work!');
};

main().catch(err => {
  console.error('💥 Script failed:', err.message);
  process.exit(1);
});