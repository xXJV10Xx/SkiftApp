-- Supabase Database Setup for Skiftschema App
-- Create all tables for full functionality (Premium, Calendar, Chat)

-- 1. Companies table - All companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Departments table - Departments/locations per company
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Teams table - Shift teams connected to department
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Shifts table - Shift schedules per team
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL,  -- F, E, N, L (Förmiddag, Eftermiddag, Natt, Ledig)
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Users table - Authenticated users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id),
  department_id UUID REFERENCES departments(id),
  team_id UUID REFERENCES teams(id),
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Subscriptions table - Premium payments
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  price INTEGER,
  duration TEXT, -- monthly, yearly, etc.
  payment_method TEXT,
  status TEXT, -- active, expired, failed
  paid_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Groups table - Group chats
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  company_id UUID REFERENCES companies(id),
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Group members table - Which users are in which groups
CREATE TABLE group_members (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

-- 9. Messages table - Group chats and private messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Notifications table - Push notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shifts_team_date ON shifts(team_id, date);
CREATE INDEX idx_messages_group_created ON messages(group_id, created_at);
CREATE INDEX idx_notifications_user_seen ON notifications(user_id, seen);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_departments_company ON departments(company_id);
CREATE INDEX idx_teams_department ON teams(department_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can view data from their company
CREATE POLICY "Users can view company data" ON companies FOR SELECT USING (
  id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can view department data" ON departments FOR SELECT USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can view team data" ON teams FOR SELECT USING (
  department_id IN (
    SELECT d.id FROM departments d 
    JOIN users u ON d.company_id = u.company_id 
    WHERE u.id = auth.uid()
  )
);

CREATE POLICY "Users can view shift data" ON shifts FOR SELECT USING (
  team_id IN (
    SELECT t.id FROM teams t
    JOIN departments d ON t.department_id = d.id
    JOIN users u ON d.company_id = u.company_id
    WHERE u.id = auth.uid()
  )
);

-- Group and message policies
CREATE POLICY "Users can view groups they belong to" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view messages in their groups" ON messages FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send messages to their groups" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND 
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());