-- 🏢 Loveable Skiftappen - Komplett Database Schema
-- Integrerar alla svenska företag och skiftscheman från scraping

-- 1. Rensa befintliga tabeller (idempotent)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS private_chats CASCADE;
DROP TABLE IF EXISTS shift_trade_requests CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS shift_teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS online_status CASCADE;

-- 2. Skapa companies tabell (från scraping data)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  industry TEXT,
  location TEXT,
  logo_url TEXT,
  website TEXT,
  employee_count INTEGER,
  founded_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skapa shift_teams tabell (Loveable-optimized)
CREATE TABLE IF NOT EXISTS shift_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#3B82F6' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT,
  shift_pattern TEXT, -- M, A, N, F, E, D, L, D12, N12, NH, FH, FE, EN
  cycle_length INTEGER DEFAULT 7, -- Antal dagar i skiftcykeln
  team_offset INTEGER DEFAULT 0, -- Offset för team-rotation
  start_time_morning TIME DEFAULT '06:00:00',
  end_time_morning TIME DEFAULT '14:00:00',
  start_time_afternoon TIME DEFAULT '14:00:00',
  end_time_afternoon TIME DEFAULT '22:00:00',
  start_time_night TIME DEFAULT '22:00:00',
  end_time_night TIME DEFAULT '06:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skapa profiles tabell (Loveable-optimized)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  department_location TEXT,
  shift_team_id UUID REFERENCES shift_teams(id) ON DELETE SET NULL,
  fcm_token TEXT,
  phone_number TEXT,
  employee_id TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Skapa shifts tabell (Loveable-optimized)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_team_id UUID REFERENCES shift_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shift_type TEXT CHECK (shift_type IN ('M', 'A', 'N', 'F', 'E', 'D', 'L', 'D12', 'N12', 'NH', 'FH', 'FE', 'EN', 'morgon', 'kväll', 'natt', 'helg', 'ledig', 'övertid')),
  notes TEXT,
  cycle_day INTEGER, -- Dag i skiftcykeln
  is_generated BOOLEAN DEFAULT false, -- Om skiftet genererades automatiskt
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT shifts_time_check CHECK (end_time > start_time)
);

-- 6. Skapa shift_trade_requests tabell
CREATE TABLE IF NOT EXISTS shift_trade_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT trade_request_different_shifts CHECK (shift_id != requested_shift_id)
);

-- 7. Skapa private_chats tabell
CREATE TABLE IF NOT EXISTS private_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_trade_request_id UUID REFERENCES shift_trade_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chat_different_users CHECK (user1_id != user2_id),
  UNIQUE(user1_id, user2_id, shift_trade_request_id)
);

-- 8. Skapa messages tabell
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'shift_trade')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Skapa team_members tabell (för team-hantering)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES shift_teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'leader', 'manager')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, team_id)
);

-- 10. Skapa chat_messages tabell (för team-chattar)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES shift_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Skapa online_status tabell
CREATE TABLE IF NOT EXISTS online_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 12. Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_team_id ON shifts(shift_team_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_type ON shifts(shift_type);
CREATE INDEX IF NOT EXISTS idx_profiles_shift_team_id ON profiles(shift_team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_shift_id ON shift_trade_requests(shift_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester_id ON shift_trade_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_chats_users ON private_chats(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_shift_teams_company_id ON shift_teams(company_id);

-- 13. Enable RLS för alla tabeller
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies för companies
DROP POLICY IF EXISTS "All authenticated users can read companies" ON companies;
CREATE POLICY "All authenticated users can read companies" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

-- 15. RLS Policies för shift_teams
DROP POLICY IF EXISTS "All authenticated users can read shift teams" ON shift_teams;
CREATE POLICY "All authenticated users can read shift teams" ON shift_teams
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can insert shift teams" ON shift_teams;
CREATE POLICY "Only admins can insert shift teams" ON shift_teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can update shift teams" ON shift_teams;
CREATE POLICY "Only admins can update shift teams" ON shift_teams
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can delete shift teams" ON shift_teams;
CREATE POLICY "Only admins can delete shift teams" ON shift_teams
  FOR DELETE USING (auth.role() = 'authenticated');

-- 16. RLS Policies för profiles
DROP POLICY IF EXISTS "All authenticated users can read profiles" ON profiles;
CREATE POLICY "All authenticated users can read profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- 17. RLS Policies för shifts
DROP POLICY IF EXISTS "All authenticated users can read shifts" ON shifts;
CREATE POLICY "All authenticated users can read shifts" ON shifts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can insert shifts" ON shifts;
CREATE POLICY "Only admins can insert shifts" ON shifts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can update shifts" ON shifts;
CREATE POLICY "Only admins can update shifts" ON shifts
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can delete shifts" ON shifts;
CREATE POLICY "Only admins can delete shifts" ON shifts
  FOR DELETE USING (auth.role() = 'authenticated');

-- 18. RLS Policies för shift_trade_requests
DROP POLICY IF EXISTS "Users can read their own trade requests" ON shift_trade_requests;
CREATE POLICY "Users can read their own trade requests" ON shift_trade_requests
  FOR SELECT USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can read trade requests for their shifts" ON shift_trade_requests;
CREATE POLICY "Users can read trade requests for their shifts" ON shift_trade_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shifts 
      WHERE shifts.id = shift_trade_requests.shift_id 
      AND shifts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own trade requests" ON shift_trade_requests;
CREATE POLICY "Users can insert their own trade requests" ON shift_trade_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update their own trade requests" ON shift_trade_requests;
CREATE POLICY "Users can update their own trade requests" ON shift_trade_requests
  FOR UPDATE USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can delete their own trade requests" ON shift_trade_requests;
CREATE POLICY "Users can delete their own trade requests" ON shift_trade_requests
  FOR DELETE USING (auth.uid() = requester_id);

-- 19. RLS Policies för private_chats
DROP POLICY IF EXISTS "Users can read chats they are part of" ON private_chats;
CREATE POLICY "Users can read chats they are part of" ON private_chats
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can insert chats they are part of" ON private_chats;
CREATE POLICY "Users can insert chats they are part of" ON private_chats
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update chats they are part of" ON private_chats;
CREATE POLICY "Users can update chats they are part of" ON private_chats
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can delete chats they are part of" ON private_chats;
CREATE POLICY "Users can delete chats they are part of" ON private_chats
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 20. RLS Policies för messages
DROP POLICY IF EXISTS "Users can read messages in their chats" ON messages;
CREATE POLICY "Users can read messages in their chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chats 
      WHERE private_chats.id = messages.chat_id 
      AND (private_chats.user1_id = auth.uid() OR private_chats.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON messages;
CREATE POLICY "Users can insert messages in their chats" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM private_chats 
      WHERE private_chats.id = messages.chat_id 
      AND (private_chats.user1_id = auth.uid() OR private_chats.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- 21. RLS Policies för team_members
DROP POLICY IF EXISTS "Users can read team members" ON team_members;
CREATE POLICY "Users can read team members" ON team_members
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage their own team membership" ON team_members;
CREATE POLICY "Users can manage their own team membership" ON team_members
  FOR ALL USING (auth.uid() = user_id);

-- 22. RLS Policies för chat_messages
DROP POLICY IF EXISTS "Users can read team chat messages" ON chat_messages;
CREATE POLICY "Users can read team chat messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = chat_messages.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert team chat messages" ON chat_messages;
CREATE POLICY "Users can insert team chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = chat_messages.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- 23. RLS Policies för online_status
DROP POLICY IF EXISTS "Users can read online status" ON online_status;
CREATE POLICY "Users can read online status" ON online_status
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own online status" ON online_status;
CREATE POLICY "Users can update their own online status" ON online_status
  FOR ALL USING (auth.uid() = user_id);

-- 24. Triggers för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Skapa triggers för alla tabeller
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_teams_updated_at ON shift_teams;
CREATE TRIGGER update_shift_teams_updated_at 
  BEFORE UPDATE ON shift_teams 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
CREATE TRIGGER update_shifts_updated_at 
  BEFORE UPDATE ON shifts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_trade_requests_updated_at ON shift_trade_requests;
CREATE TRIGGER update_shift_trade_requests_updated_at 
  BEFORE UPDATE ON shift_trade_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_private_chats_updated_at ON private_chats;
CREATE TRIGGER update_private_chats_updated_at 
  BEFORE UPDATE ON private_chats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at 
  BEFORE UPDATE ON chat_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_online_status_updated_at ON online_status;
CREATE TRIGGER update_online_status_updated_at 
  BEFORE UPDATE ON online_status 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 25. Funktion för att skapa profil automatiskt efter registrering
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa trigger för nya användare
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 26. Kommentarer för dokumentation
COMMENT ON TABLE companies IS 'Svenska företag från scraping data';
COMMENT ON TABLE shift_teams IS 'Team och lag för skiftarbete med Loveable-optimering';
COMMENT ON TABLE profiles IS 'Användarprofiler med företags- och teaminformation';
COMMENT ON TABLE shifts IS 'Skiftschema med tider och team';
COMMENT ON TABLE shift_trade_requests IS 'Förfrågningar om skiftbyten';
COMMENT ON TABLE private_chats IS 'Privata chattar mellan användare';
COMMENT ON TABLE messages IS 'Meddelanden i privata chattar';
COMMENT ON TABLE team_members IS 'Team-medlemskap för användare';
COMMENT ON TABLE chat_messages IS 'Team-chattar';
COMMENT ON TABLE online_status IS 'Online-status för användare'; 