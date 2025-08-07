-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium');
CREATE TYPE company_type AS ENUM ('ssab', 'other');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  company_type company_type DEFAULT 'ssab',
  selected_team INTEGER DEFAULT 31,
  phone_number TEXT,
  timezone TEXT DEFAULT 'Europe/Stockholm',
  language TEXT DEFAULT 'sv',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team_number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  company_type company_type DEFAULT 'ssab',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat rooms table
CREATE TABLE chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_number INTEGER REFERENCES teams(team_number),
  is_public BOOLEAN DEFAULT false,
  is_team_specific BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  edited_at TIMESTAMPTZ,
  reply_to UUID REFERENCES chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  shift_reminders BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 2,
  theme TEXT DEFAULT 'light',
  calendar_sync_enabled BOOLEAN DEFAULT false,
  calendar_sync_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default teams
INSERT INTO teams (team_number, name, color) VALUES
(31, 'Lag 31', '#FF6B6B'),
(32, 'Lag 32', '#4ECDC4'),
(33, 'Lag 33', '#45B7D1'),
(34, 'Lag 34', '#96CEB4'),
(35, 'Lag 35', '#FFEAA7');

-- Create default chat rooms
INSERT INTO chat_rooms (name, description, team_number, is_public, is_team_specific) VALUES
('Allmän diskussion', 'Öppen diskussion för alla användare', NULL, true, false),
('Lag 31 Chat', 'Privat chat för Lag 31', 31, false, true),
('Lag 32 Chat', 'Privat chat för Lag 32', 32, false, true),
('Lag 33 Chat', 'Privat chat för Lag 33', 33, false, true),
('Lag 34 Chat', 'Privat chat för Lag 34', 34, false, true),
('Lag 35 Chat', 'Privat chat för Lag 35', 35, false, true);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat rooms policies
CREATE POLICY "Users can view public rooms" ON chat_rooms
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view team rooms if member" ON chat_rooms
  FOR SELECT USING (
    is_team_specific = true AND 
    team_number = (SELECT selected_team FROM profiles WHERE id = auth.uid())
  );

-- Chat messages policies
CREATE POLICY "Users can view messages in accessible rooms" ON chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE is_public = true 
      OR (is_team_specific = true AND team_number = (
        SELECT selected_team FROM profiles WHERE id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can insert messages in accessible rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE is_public = true 
      OR (is_team_specific = true AND team_number = (
        SELECT selected_team FROM profiles WHERE id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create functions and triggers

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Create default preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Create free subscription
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_profiles_selected_team ON profiles(selected_team);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_rooms_team_number ON chat_rooms(team_number);

-- Enable real-time for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;