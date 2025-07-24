-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work patterns table (defines shift patterns like SSAB 3-shift)
CREATE TABLE IF NOT EXISTS work_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  composition TEXT[] NOT NULL, -- Array of shift codes like ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L']
  cycle_length INTEGER NOT NULL, -- Length of the pattern cycle
  shift_definitions JSONB NOT NULL, -- Definitions for each shift code (times, names)
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table (overall schedule configurations)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT, -- Short name like "A", "B", "C"
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#007AFF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team states table (tracks the current state of each team in their work pattern)
CREATE TABLE IF NOT EXISTS team_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('WORK', 'LEAVE')),
  day_in_block INTEGER NOT NULL,
  work_pattern_id UUID REFERENCES work_patterns(id) ON DELETE SET NULL,
  work_pattern_composition TEXT[], -- Copy of pattern composition at this state
  work_pattern_n_count INTEGER, -- Number of work patterns in sequence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, state_date)
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table (generated schedule data)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_code TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  shift_name TEXT,
  break_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage companies" ON companies FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Company members can view work patterns" ON work_patterns 
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Company members can view schedules" ON schedules 
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Company members can view teams" ON teams 
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Company members can view team states" ON team_states 
FOR SELECT USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE company_id IN (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "Users can view company employees" ON employees 
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can view company shifts" ON shifts 
FOR SELECT USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE company_id IN (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_team_states_team_date ON team_states(team_id, state_date);
CREATE INDEX idx_shifts_employee_date ON shifts(employee_id, date);
CREATE INDEX idx_shifts_team_date ON shifts(team_id, date);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_teams_company ON teams(company_id);

-- Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_patterns_updated_at BEFORE UPDATE ON work_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_states_updated_at BEFORE UPDATE ON team_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for SSAB
INSERT INTO companies (name, slug) VALUES ('SSAB', 'ssab') ON CONFLICT (slug) DO NOTHING;

-- Insert SSAB 3-shift work pattern
INSERT INTO work_patterns (name, description, composition, cycle_length, shift_definitions, company_id)
SELECT 
  'SSAB 3-skift',
  'Kontinuerligt 3-skiftssystem med 14-dagars cykel',
  ARRAY['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L'],
  14,
  '{
    "M": {"start": "06:00", "end": "14:00", "name": "Morgon"},
    "A": {"start": "14:00", "end": "22:00", "name": "Kväll"},
    "N": {"start": "22:00", "end": "06:00", "name": "Natt"},
    "L": {"start": "", "end": "", "name": "Ledig"}
  }'::jsonb,
  c.id
FROM companies c WHERE c.slug = 'ssab'
ON CONFLICT DO NOTHING;

-- Insert sample schedule
INSERT INTO schedules (name, description, company_id, start_date)
SELECT 
  'Anpassat SSAB-skift',
  'Huvudschema för SSAB 3-skift',
  c.id,
  '2024-01-01'::date
FROM companies c WHERE c.slug = 'ssab'
ON CONFLICT DO NOTHING;

-- Insert sample teams
INSERT INTO teams (name, alias, company_id, schedule_id, color)
SELECT 
  'Lag A', 'A', c.id, s.id, '#FF6B6B'
FROM companies c, schedules s 
WHERE c.slug = 'ssab' AND s.name = 'Anpassat SSAB-skift'
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, alias, company_id, schedule_id, color)
SELECT 
  'Lag B', 'B', c.id, s.id, '#4ECDC4'
FROM companies c, schedules s 
WHERE c.slug = 'ssab' AND s.name = 'Anpassat SSAB-skift'
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, alias, company_id, schedule_id, color)
SELECT 
  'Lag C', 'C', c.id, s.id, '#45B7D1'
FROM companies c, schedules s 
WHERE c.slug = 'ssab' AND s.name = 'Anpassat SSAB-skift'
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, alias, company_id, schedule_id, color)
SELECT 
  'Lag D', 'D', c.id, s.id, '#96CEB4'
FROM companies c, schedules s 
WHERE c.slug = 'ssab' AND s.name = 'Anpassat SSAB-skift'
ON CONFLICT DO NOTHING;

-- Insert initial team states (starting from 2024-01-01)
INSERT INTO team_states (team_id, state_date, block_type, day_in_block, work_pattern_id, work_pattern_composition, work_pattern_n_count)
SELECT 
  t.id,
  '2024-01-01'::date,
  'WORK',
  1,
  wp.id,
  wp.composition,
  1
FROM teams t
JOIN companies c ON t.company_id = c.id
JOIN work_patterns wp ON wp.company_id = c.id
WHERE c.slug = 'ssab' AND wp.name = 'SSAB 3-skift'
ON CONFLICT (team_id, state_date) DO NOTHING;