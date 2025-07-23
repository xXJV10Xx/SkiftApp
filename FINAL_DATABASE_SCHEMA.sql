-- 🏢 Komplett Database Schema för Skiftappen med RLS Policies
-- Idempotent script - kan köras flera gånger utan fel

-- 1. Rensa befintliga tabeller (om de finns)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS private_chats CASCADE;
DROP TABLE IF EXISTS shift_trade_requests CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS shift_teams CASCADE;

-- 2. Skapa shift_teams tabell
CREATE TABLE IF NOT EXISTS shift_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color_hex TEXT NOT NULL DEFAULT '#3B82F6' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  company_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skapa profiles tabell
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  department_location TEXT,
  shift_team_id UUID REFERENCES shift_teams(id) ON DELETE SET NULL,
  fcm_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skapa shifts tabell
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_team_id UUID REFERENCES shift_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shift_type TEXT CHECK (shift_type IN ('morgon', 'kväll', 'natt', 'helg', 'ledig')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT shifts_time_check CHECK (end_time > start_time)
);

-- 5. Skapa shift_trade_requests tabell
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

-- 6. Skapa private_chats tabell
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

-- 7. Skapa messages tabell
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_team_id ON shifts(shift_team_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_shift_team_id ON profiles(shift_team_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_shift_id ON shift_trade_requests(shift_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester_id ON shift_trade_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_chats_users ON private_chats(user1_id, user2_id);

-- 9. Enable RLS för alla tabeller
ALTER TABLE shift_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies för shift_teams
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

-- 11. RLS Policies för profiles
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

-- 12. RLS Policies för shifts
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

-- 13. RLS Policies för shift_trade_requests
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

-- 14. RLS Policies för private_chats
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

-- 15. RLS Policies för messages
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

-- 16. Triggers för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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

-- 17. Funktion för att skapa profil automatiskt efter registrering
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

-- 18. Exempel data för testning
INSERT INTO shift_teams (name, color_hex, description) VALUES
  ('Morgonpass', '#10B981', 'Morgonpass 06:00-14:00'),
  ('Kvällspass', '#F59E0B', 'Kvällspass 14:00-22:00'),
  ('Nattpass', '#6366F1', 'Nattpass 22:00-06:00'),
  ('Helgpass', '#EF4444', 'Helgpass 08:00-16:00')
ON CONFLICT (name) DO NOTHING;

-- 19. Kommentarer för dokumentation
COMMENT ON TABLE shift_teams IS 'Lag och team för skiftarbete';
COMMENT ON TABLE profiles IS 'Användarprofiler med företags- och teaminformation';
COMMENT ON TABLE shifts IS 'Skiftschema med tider och team';
COMMENT ON TABLE shift_trade_requests IS 'Förfrågningar om skiftbyten';
COMMENT ON TABLE private_chats IS 'Privata chattar mellan användare';
COMMENT ON TABLE messages IS 'Meddelanden i privata chattar'; 