-- ===============================================
-- SCHEDULE CACHE TABLE MIGRATION
-- Run this to update existing schedule_cache table
-- ===============================================

-- Add new columns to existing schedule_cache table
ALTER TABLE schedule_cache 
ADD COLUMN IF NOT EXISTS is_weekend BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_cache_company_team_date ON schedule_cache(company_id, team_identifier, date);
CREATE INDEX IF NOT EXISTS idx_schedule_cache_date_range ON schedule_cache(date);
CREATE INDEX IF NOT EXISTS idx_schedule_cache_company_date ON schedule_cache(company_id, date);

-- Update RLS policies
DROP POLICY IF EXISTS "Schedule cache is viewable by everyone" ON schedule_cache;

-- Create new RLS policies
CREATE POLICY "Allow users to view schedule for their company" ON schedule_cache
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to insert schedule" ON schedule_cache
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    created_by = auth.uid()
  );

CREATE POLICY "Allow users to update their own schedule cache" ON schedule_cache
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to delete their own schedule cache" ON schedule_cache
  FOR DELETE USING (created_by = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_schedule_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_cache_updated_at
BEFORE UPDATE ON schedule_cache
FOR EACH ROW
EXECUTE FUNCTION update_schedule_cache_updated_at();