-- Add subscription and payment fields to users table
-- Run this in your Supabase SQL editor

-- Add new columns for subscription management
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_paid_export BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.is_premium IS 'Whether user has active premium subscription';
COMMENT ON COLUMN users.has_paid_export IS 'Whether user has paid for one-time export feature';
COMMENT ON COLUMN users.trial_started_at IS 'When the user trial period started';
COMMENT ON COLUMN users.subscription_type IS 'Type of subscription: monthly, semiannual, annual';
COMMENT ON COLUMN users.subscription_status IS 'Stripe subscription status: active, cancelled, past_due, etc.';
COMMENT ON COLUMN users.subscription_started_at IS 'When the paid subscription started';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for this user';

-- Create index for performance on premium users
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium) WHERE is_premium = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status) WHERE subscription_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Update existing users to have trial_started_at if null
UPDATE users 
SET trial_started_at = created_at 
WHERE trial_started_at IS NULL AND created_at IS NOT NULL;

-- Create a function to check if user has access to premium features
CREATE OR REPLACE FUNCTION check_user_premium_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_data RECORD;
  trial_days INTEGER;
BEGIN
  SELECT is_premium, has_paid_export, trial_started_at
  INTO user_data
  FROM users
  WHERE id = user_id;
  
  -- If user not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If user is premium, return true
  IF user_data.is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if trial is still active (7 days)
  IF user_data.trial_started_at IS NOT NULL THEN
    trial_days := EXTRACT(DAY FROM NOW() - user_data.trial_started_at);
    IF trial_days < 7 THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- No premium access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can export
CREATE OR REPLACE FUNCTION check_user_export_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_data RECORD;
BEGIN
  SELECT is_premium, has_paid_export
  INTO user_data
  FROM users
  WHERE id = user_id;
  
  -- If user not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Premium users can always export
  IF user_data.is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Users who paid for export can export
  IF user_data.has_paid_export THEN
    RETURN TRUE;
  END IF;
  
  -- Check trial access
  RETURN check_user_premium_access(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_user_premium_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_export_access(UUID) TO authenticated;

-- Create RLS policies for subscription data (if RLS is enabled)
-- Note: Adjust these policies based on your existing RLS setup

-- Allow users to read their own subscription data
CREATE POLICY IF NOT EXISTS "Users can read own subscription data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow service role to update subscription data (for webhooks)
CREATE POLICY IF NOT EXISTS "Service role can update subscription data" ON users
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.uid() = id
  );

-- Create a view for user subscription status (optional)
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  id,
  email,
  is_premium,
  has_paid_export,
  subscription_type,
  subscription_status,
  trial_started_at,
  subscription_started_at,
  check_user_premium_access(id) as has_premium_access,
  check_user_export_access(id) as has_export_access,
  CASE 
    WHEN trial_started_at IS NOT NULL THEN
      GREATEST(0, 7 - EXTRACT(DAY FROM NOW() - trial_started_at)::INTEGER)
    ELSE 0
  END as trial_days_left
FROM users;

-- Grant access to the view
GRANT SELECT ON user_subscription_status TO authenticated;