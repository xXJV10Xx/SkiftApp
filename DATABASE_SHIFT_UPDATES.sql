-- 🗄️ Database Schema Updates för Skiftbyten och Schemaläggning
-- Kör dessa SQL-kommandon i din Supabase SQL Editor

-- 1. Uppdatera befintlig shifts-tabell med nya fält
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_trade', 'cancelled'));

-- 2. Skapa ShiftTradeRequest-tabell
CREATE TABLE IF NOT EXISTS shift_trade_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  requesting_user_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för shift_trade_requests
ALTER TABLE shift_trade_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies för shift_trade_requests
CREATE POLICY "Team members can view trade requests in their team" ON shift_trade_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shifts s
      JOIN employees e ON s.owner_id = e.id
      JOIN employees current_user ON current_user.id = auth.uid()
      WHERE s.id = shift_trade_requests.shift_id
      AND (e.team_id = current_user.team_id OR s.owner_id = auth.uid() OR shift_trade_requests.requesting_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create trade requests for their own shifts" ON shift_trade_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.id = shift_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own trade requests" ON shift_trade_requests
  FOR UPDATE USING (requesting_user_id = auth.uid());

-- 3. Skapa PrivateChat-tabell
CREATE TABLE IF NOT EXISTS private_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  related_trade_request_id UUID REFERENCES shift_trade_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för private_chats
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;

-- RLS policies för private_chats
CREATE POLICY "Users can view chats they participate in" ON private_chats
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create private chats" ON private_chats
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Participants can update private chats" ON private_chats
  FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- 4. Skapa private_chat_messages-tabell
CREATE TABLE IF NOT EXISTS private_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  private_chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'shift_confirmation')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS för private_chat_messages
ALTER TABLE private_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies för private_chat_messages
CREATE POLICY "Chat participants can view messages" ON private_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chats pc
      WHERE pc.id = private_chat_messages.private_chat_id
      AND auth.uid() = ANY(pc.participant_ids)
    )
  );

CREATE POLICY "Chat participants can send messages" ON private_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM private_chats pc
      WHERE pc.id = private_chat_id
      AND auth.uid() = ANY(pc.participant_ids)
    )
  );

-- 5. Uppdatera shifts-tabell med RLS policies om de inte redan finns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shifts' AND policyname = 'Team members can view shifts'
  ) THEN
    CREATE POLICY "Team members can view shifts" ON shifts
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM employees e1
          JOIN employees e2 ON e1.team_id = e2.team_id
          WHERE e1.id = auth.uid() AND e2.id = shifts.owner_id
        ) OR owner_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shifts' AND policyname = 'Users can create shifts'
  ) THEN
    CREATE POLICY "Users can create shifts" ON shifts
      FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shifts' AND policyname = 'Users can update their own shifts'
  ) THEN
    CREATE POLICY "Users can update their own shifts" ON shifts
      FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END $$;

-- 6. Aktivera real-time för de nya tabellerna
-- (Detta måste göras manuellt i Supabase Dashboard under Database > Replication)
-- Aktivera real-time för:
-- - shift_trade_requests
-- - private_chats  
-- - private_chat_messages

-- 7. Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_shift_trade_requests_shift_id ON shift_trade_requests(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_trade_requests_requesting_user_id ON shift_trade_requests(requesting_user_id);
CREATE INDEX IF NOT EXISTS idx_shift_trade_requests_status ON shift_trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_private_chats_participants ON private_chats USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_private_chat_messages_chat_id ON private_chat_messages(private_chat_id);
CREATE INDEX IF NOT EXISTS idx_shifts_owner_id ON shifts(owner_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);

-- 8. Skapa funktioner för automatiska uppdateringar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Lägg till triggers för updated_at
CREATE TRIGGER update_shift_trade_requests_updated_at 
    BEFORE UPDATE ON shift_trade_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_private_chats_updated_at 
    BEFORE UPDATE ON private_chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_private_chat_messages_updated_at 
    BEFORE UPDATE ON private_chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();