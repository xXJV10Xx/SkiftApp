-- =============================================================================
-- SKIFTAPPEN - DATABAS SCHEMA
-- Komplett SQL för Supabase Database Setup
-- =============================================================================

-- 1. PROFILES TABLE
-- Utökad profiltabell med FCM-token för push-notiser
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  fcm_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies för profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================

-- 2. SHIFTS TABLE
-- Arbetspass med ägare, tid och plats
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies för shifts
CREATE POLICY "Users can view their own shifts" ON shifts
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shifts" ON shifts
  FOR DELETE USING (auth.uid() = owner_id);

-- =============================================================================

-- 3. SHIFT_TRADE_REQUESTS TABLE
-- Förfrågningar om skiftbyten
CREATE TABLE shift_trade_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  requesting_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för shift_trade_requests
ALTER TABLE shift_trade_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies för shift_trade_requests
CREATE POLICY "Authenticated users can view open trade requests" ON shift_trade_requests
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (status = 'pending' OR requesting_user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM shifts WHERE shifts.id = shift_id AND shifts.owner_id = auth.uid()))
  );

CREATE POLICY "Authenticated users can create trade requests" ON shift_trade_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requesting_user_id AND
    EXISTS (SELECT 1 FROM shifts WHERE shifts.id = shift_id AND shifts.owner_id != auth.uid())
  );

CREATE POLICY "Users can update their own trade requests" ON shift_trade_requests
  FOR UPDATE USING (auth.uid() = requesting_user_id);

CREATE POLICY "Users can delete their own trade requests" ON shift_trade_requests
  FOR DELETE USING (auth.uid() = requesting_user_id);

-- =============================================================================

-- 4. PRIVATE_CHATS TABLE
-- Privata chattar för skiftbyten
CREATE TABLE private_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_request_id UUID REFERENCES shift_trade_requests(id) ON DELETE CASCADE NOT NULL,
  participants UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för private_chats
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies för private_chats
CREATE POLICY "Users can view chats they participate in" ON private_chats
  FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create chats they participate in" ON private_chats
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update chats they participate in" ON private_chats
  FOR UPDATE USING (auth.uid() = ANY(participants));

-- =============================================================================

-- 5. MESSAGES TABLE
-- Meddelanden i privata chattar
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies för messages
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chats 
      WHERE private_chats.id = messages.chat_id 
      AND auth.uid() = ANY(private_chats.participants)
    )
  );

CREATE POLICY "Users can send messages to their chats" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM private_chats 
      WHERE private_chats.id = messages.chat_id 
      AND auth.uid() = ANY(private_chats.participants)
    )
  );

-- =============================================================================

-- INDEXES för bättre prestanda
CREATE INDEX idx_shifts_owner_id ON shifts(owner_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_trade_requests_shift_id ON shift_trade_requests(shift_id);
CREATE INDEX idx_trade_requests_requesting_user ON shift_trade_requests(requesting_user_id);
CREATE INDEX idx_trade_requests_status ON shift_trade_requests(status);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =============================================================================

-- TRIGGERS för updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_requests_updated_at BEFORE UPDATE ON shift_trade_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_private_chats_updated_at BEFORE UPDATE ON private_chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================

-- TESTDATA (valfritt - för utveckling)
-- Uncomment följande för att lägga till testdata:

/*
-- Exempel på shifts (ersätt user-uuid med faktiska UUID:n)
INSERT INTO shifts (owner_id, start_time, end_time, title, description, location) VALUES
('user-uuid-1', '2024-01-15 08:00:00+00', '2024-01-15 16:00:00+00', 'Morgonpass', 'Vanligt morgonpass', 'Huvudkontoret'),
('user-uuid-2', '2024-01-15 16:00:00+00', '2024-01-16 00:00:00+00', 'Kvällspass', 'Kvällsarbete', 'Huvudkontoret');
*/

-- =============================================================================
-- SLUT PÅ SCHEMA
-- =============================================================================