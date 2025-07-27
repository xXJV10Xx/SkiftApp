-- 🗄️ Enhanced Database Schema for Multi-Company Schedule Syncing
-- This file contains the complete database schema needed for proper schedule syncing across all companies, departments, and teams

-- ===============================
-- 1. SCHEDULES TABLE (Missing from current schema)
-- ===============================

CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(slug) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  department TEXT,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combinations per company/team/date
  UNIQUE(company_id, team_name, department, date)
);

-- Enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Schedules are viewable by company employees" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = auth.uid() 
      AND e.company_id = schedules.company_id
    )
  );

CREATE POLICY "Schedules can be created by authenticated users" ON schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Schedules can be updated by authenticated users" ON schedules
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_company_date ON schedules(company_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_team_date ON schedules(team_name, date);
CREATE INDEX IF NOT EXISTS idx_schedules_department_date ON schedules(department, date);
CREATE INDEX IF NOT EXISTS idx_schedules_scraped_at ON schedules(scraped_at);

-- ===============================
-- 2. SCHEDULE_SOURCES TABLE (Track different schedule sources)
-- ===============================

CREATE TABLE IF NOT EXISTS schedule_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  selector_config JSONB, -- Store CSS selectors and scraping config
  is_active BOOLEAN DEFAULT true,
  last_scraped TIMESTAMP WITH TIME ZONE,
  scrape_frequency_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE schedule_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule sources
CREATE POLICY "Schedule sources are viewable by authenticated users" ON schedule_sources
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Schedule sources can be managed by authenticated users" ON schedule_sources
  FOR ALL USING (auth.role() = 'authenticated');

-- ===============================
-- 3. SCRAPE_LOGS TABLE (Track scraping activities)
-- ===============================

CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(slug) ON DELETE CASCADE,
  source_id UUID REFERENCES schedule_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  scraped_data JSONB, -- Store raw scraped data for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for scrape logs
CREATE POLICY "Scrape logs are viewable by authenticated users" ON scrape_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Scrape logs can be created by authenticated users" ON scrape_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scrape_logs_company_date ON scrape_logs(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON scrape_logs(status);

-- ===============================
-- 4. ENHANCED COMPANIES TABLE (Add missing columns)
-- ===============================

-- Add missing columns to companies table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'slug') THEN
    ALTER TABLE companies ADD COLUMN slug TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'schedule_url') THEN
    ALTER TABLE companies ADD COLUMN schedule_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'teams_config') THEN
    ALTER TABLE companies ADD COLUMN teams_config JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'departments_config') THEN
    ALTER TABLE companies ADD COLUMN departments_config JSONB;
  END IF;
END $$;

-- ===============================
-- 5. ENHANCED TEAMS TABLE (Add missing columns)
-- ===============================

-- Add missing columns to teams table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'department') THEN
    ALTER TABLE teams ADD COLUMN department TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'shift_pattern') THEN
    ALTER TABLE teams ADD COLUMN shift_pattern TEXT;
  END IF;
END $$;

-- ===============================
-- 6. INSERT DEFAULT SCHEDULE SOURCES
-- ===============================

-- Insert default schedule source for skiftschema.se
INSERT INTO schedule_sources (company_id, name, url, selector_config, is_active) 
VALUES (
  'skiftschema', -- Default company for skiftschema.se
  'Skiftschema.se',
  'https://skiftschema.se',
  '{
    "primaryButton": ".btn-primary",
    "tableSelector": ".table",
    "rowSelector": ".table tbody tr",
    "dateSelector": "td:nth-child(1)",
    "shiftSelector": "td:nth-child(2)", 
    "teamSelector": "td:nth-child(3)"
  }'::jsonb,
  true
) ON CONFLICT (company_id, name) DO UPDATE SET
  url = EXCLUDED.url,
  selector_config = EXCLUDED.selector_config,
  updated_at = NOW();

-- ===============================
-- 7. SYNC COMPANIES FROM CODE TO DATABASE
-- ===============================

-- Insert/Update companies from the companies.ts file
-- This will be handled by the enhanced scraping script

-- ===============================
-- 8. USEFUL VIEWS FOR REPORTING
-- ===============================

-- View for current schedules with company info
CREATE OR REPLACE VIEW current_schedules AS
SELECT 
  s.*,
  c.name as company_name,
  c.logo_url
FROM schedules s
JOIN companies c ON s.company_id = c.slug
WHERE s.date >= CURRENT_DATE
AND s.status = 'active'
ORDER BY s.company_id, s.date, s.team_name;

-- View for scraping statistics
CREATE OR REPLACE VIEW scraping_stats AS
SELECT 
  sl.company_id,
  c.name as company_name,
  COUNT(*) as total_scrapes,
  COUNT(CASE WHEN sl.status = 'success' THEN 1 END) as successful_scrapes,
  COUNT(CASE WHEN sl.status = 'error' THEN 1 END) as failed_scrapes,
  AVG(sl.execution_time_ms) as avg_execution_time_ms,
  SUM(sl.records_processed) as total_records_processed,
  SUM(sl.records_inserted) as total_records_inserted,
  MAX(sl.created_at) as last_scrape_time
FROM scrape_logs sl
JOIN companies c ON sl.company_id = c.slug
GROUP BY sl.company_id, c.name
ORDER BY last_scrape_time DESC;

-- ===============================
-- 9. FUNCTIONS FOR SCHEDULE MANAGEMENT
-- ===============================

-- Function to clean old schedules
CREATE OR REPLACE FUNCTION cleanup_old_schedules(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM schedules 
  WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO scrape_logs (company_id, status, records_processed, records_updated, error_message)
  VALUES ('system', 'success', deleted_count, 0, 'Cleaned up old schedules');
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get team schedule for a date range
CREATE OR REPLACE FUNCTION get_team_schedule(
  p_company_id TEXT,
  p_team_name TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  shift_type TEXT,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.date,
    s.shift_type,
    s.start_time,
    s.end_time,
    s.location,
    s.notes
  FROM schedules s
  WHERE s.company_id = p_company_id
    AND s.team_name = p_team_name
    AND s.date BETWEEN p_start_date AND p_end_date
    AND s.status = 'active'
  ORDER BY s.date;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 10. TRIGGERS FOR AUTOMATIC UPDATES
-- ===============================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at columns
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_sources_updated_at ON schedule_sources;
CREATE TRIGGER update_schedule_sources_updated_at
  BEFORE UPDATE ON schedule_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- VERIFICATION QUERIES
-- ===============================

-- Check if all tables exist
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('schedules', 'schedule_sources', 'scrape_logs', 'companies', 'teams')
ORDER BY tablename;

-- Check if all required columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('schedules', 'schedule_sources', 'scrape_logs')
ORDER BY table_name, ordinal_position;