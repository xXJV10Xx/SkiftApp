-- Migration: Add export functionality columns to employees table
-- Run this in your Supabase SQL Editor

-- Add export-related columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS has_paid_export BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS export_paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_has_paid_export ON employees(has_paid_export);
CREATE INDEX IF NOT EXISTS idx_employees_export_paid_at ON employees(export_paid_at);

-- Update existing users to have export access (optional - remove if you want all users to pay)
-- UPDATE employees SET has_paid_export = TRUE WHERE created_at < NOW();

-- Add comment for documentation
COMMENT ON COLUMN employees.has_paid_export IS 'Whether the user has paid for calendar export functionality';
COMMENT ON COLUMN employees.export_paid_at IS 'Timestamp when the user paid for export access';

-- Create a function to check export access (optional helper)
CREATE OR REPLACE FUNCTION check_user_export_access(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    SELECT has_paid_export INTO has_access
    FROM employees
    WHERE email = user_email;
    
    RETURN COALESCE(has_access, FALSE);
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_export_access TO authenticated;