-- SkiftApp Premium Users Schema
-- Kör detta i Supabase SQL Editor

-- Skapa users-tabell om den inte finns
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Premium-relaterade fält
  is_premium BOOLEAN DEFAULT FALSE,
  premium_activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Stripe-relaterade fält
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  
  -- Användardata
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- App-inställningar
  notification_enabled BOOLEAN DEFAULT TRUE,
  theme_preference TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  
  -- Metadata
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0
);

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- Skapa updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Användare kan bara se sin egen data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Användare kan bara uppdatera sin egen data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Användare kan skapa sin egen profil
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Skapa premium_features tabell för att hålla koll på vad som ingår
CREATE TABLE IF NOT EXISTS premium_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lägg till premium-funktioner
INSERT INTO premium_features (feature_key, feature_name, description) VALUES
  ('calendar_export', 'Kalenderexport', 'Exportera skift till Google Calendar och Apple Calendar'),
  ('auto_sync', 'Automatisk synkronisering', 'Automatisk uppdatering av skift'),
  ('advanced_stats', 'Avancerad statistik', 'Detaljerad statistik över arbetstider'),
  ('custom_themes', 'Anpassade teman', 'Personalisera appens utseende'),
  ('ad_free', 'Reklamfritt', 'Ingen reklam i appen'),
  ('priority_support', 'Prioriterad support', 'Snabbare hjälp och support')
ON CONFLICT (feature_key) DO NOTHING;

-- Skapa payments tabell för att logga betalningar
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in öre (SEK cents)
  currency TEXT DEFAULT 'sek',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index för payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS för payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

-- Skapa funktion för att uppdatera premium-status
CREATE OR REPLACE FUNCTION update_user_premium_status(
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_amount INTEGER DEFAULT 9900
)
RETURNS BOOLEAN AS $$
DECLARE
  payment_record payments%ROWTYPE;
BEGIN
  -- Sätt användaren som premium
  UPDATE users 
  SET 
    is_premium = TRUE,
    premium_activated_at = NOW(),
    stripe_session_id = p_stripe_session_id,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Logga betalningen
  INSERT INTO payments (user_id, stripe_session_id, amount, status, completed_at)
  VALUES (p_user_id, p_stripe_session_id, p_amount, 'completed', NOW())
  ON CONFLICT (stripe_session_id) 
  DO UPDATE SET 
    status = 'completed',
    completed_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_premium_status TO service_role;

-- Visa alla tabeller och deras struktur
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'premium_features', 'payments')
ORDER BY table_name, ordinal_position;