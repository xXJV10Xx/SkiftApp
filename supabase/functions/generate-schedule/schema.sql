-- Schema for the generate-schedule Edge Function
-- These tables need to be created in your Supabase database

-- 1. Schedules table - defines active schedules for teams
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Work patterns table - defines shift patterns for schedules
CREATE TABLE IF NOT EXISTS work_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  composition TEXT[] NOT NULL, -- Array of shift codes like ['F', 'E', 'N', 'N']
  n_count INTEGER NOT NULL DEFAULT 4, -- 4 or 5 - determines leave days after work cycle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Team states table - tracks current state of each team
CREATE TABLE IF NOT EXISTS team_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  state_type TEXT NOT NULL CHECK (state_type IN ('WORK', 'LEAVE')),
  current_day INTEGER NOT NULL DEFAULT 1,
  total_days INTEGER NOT NULL,
  work_pattern_id UUID REFERENCES work_patterns(id) ON DELETE SET NULL,
  n_count INTEGER, -- Current n_count being used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, date)
);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_states ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Users can view schedules for their company teams" ON schedules
FOR SELECT USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE company_id = (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "Authenticated users can manage schedules" ON schedules
FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for work_patterns
CREATE POLICY "Users can view work patterns for their company" ON work_patterns
FOR SELECT USING (
  schedule_id IN (
    SELECT s.id FROM schedules s
    JOIN teams t ON s.team_id = t.id
    WHERE t.company_id = (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "Authenticated users can manage work patterns" ON work_patterns
FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for team_states
CREATE POLICY "Users can view team states for their company" ON team_states
FOR SELECT USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE company_id = (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "Authenticated users can manage team states" ON team_states
FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_team_id ON schedules(team_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_work_patterns_schedule_id ON work_patterns(schedule_id);
CREATE INDEX IF NOT EXISTS idx_team_states_team_id ON team_states(team_id);
CREATE INDEX IF NOT EXISTS idx_team_states_date ON team_states(date);
CREATE INDEX IF NOT EXISTS idx_team_states_team_date ON team_states(team_id, date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedules_updated_at 
  BEFORE UPDATE ON schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_patterns_updated_at 
  BEFORE UPDATE ON work_patterns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_states_updated_at 
  BEFORE UPDATE ON team_states 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
-- Insert sample schedules (replace team IDs with actual ones from your teams table)
-- INSERT INTO schedules (team_id, is_active) VALUES 
--   ('your-team-id-1', true),
--   ('your-team-id-2', true);

-- Insert sample work patterns
-- INSERT INTO work_patterns (schedule_id, name, composition, n_count) VALUES 
--   ((SELECT id FROM schedules LIMIT 1), 'Pattern A', ARRAY['F', 'E', 'N', 'N'], 4),
--   ((SELECT id FROM schedules LIMIT 1), 'Pattern B', ARRAY['E', 'N', 'F', 'F'], 5);

-- Insert sample team states
-- INSERT INTO team_states (team_id, date, state_type, current_day, total_days, work_pattern_id, n_count) VALUES 
--   ('your-team-id-1', '2024-01-01', 'WORK', 1, 4, (SELECT id FROM work_patterns LIMIT 1), 4);