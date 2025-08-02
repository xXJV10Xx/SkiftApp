-- Lägg till prenumerations- och exportkolumner till users-tabellen
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_paid_export BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS premium_type VARCHAR(20), -- 'monthly', 'semiannual', 'annual'
  ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_ended_at TIMESTAMPTZ;

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_trial ON users(trial_started_at);

-- Skapa tabell för att spåra betalningshistorik (valfritt)
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(255) UNIQUE,
  purchase_type VARCHAR(20) NOT NULL, -- 'monthly', 'semiannual', 'annual', 'export'
  amount INTEGER NOT NULL, -- Belopp i öre
  currency VARCHAR(3) DEFAULT 'sek',
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index för payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON payment_history(purchase_type);

-- Funktion för att kontrollera om trial har gått ut
CREATE OR REPLACE FUNCTION is_trial_expired(trial_start TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (EXTRACT(EPOCH FROM (now() - trial_start)) / 86400) > 7;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att kontrollera premium-status
CREATE OR REPLACE FUNCTION get_user_access_level(user_id UUID)
RETURNS TABLE(
  has_premium_access BOOLEAN,
  has_export_access BOOLEAN,
  trial_days_left INTEGER,
  premium_type VARCHAR(20)
) AS $$
DECLARE
  user_record RECORD;
  days_since_trial INTEGER;
BEGIN
  SELECT * INTO user_record 
  FROM users 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0, NULL::VARCHAR(20);
    RETURN;
  END IF;
  
  days_since_trial := EXTRACT(EPOCH FROM (now() - user_record.trial_started_at)) / 86400;
  
  RETURN QUERY SELECT 
    user_record.is_premium OR days_since_trial <= 7,
    user_record.has_paid_export,
    GREATEST(0, 7 - days_since_trial::INTEGER),
    user_record.premium_type;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies om de behövs
-- ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own payment history" ON payment_history
--   FOR SELECT USING (auth.uid() = user_id);