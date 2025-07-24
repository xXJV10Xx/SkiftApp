-- Supabase Schema for Shift Scheduling System
-- Generated SQL CREATE TABLE statements

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schedules table - defines main rules for shift schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    work_block_length INTEGER NOT NULL CHECK (work_block_length > 0),
    -- Valid start days stored as array of day numbers (0=Sunday, 1=Monday, etc.)
    valid_start_days INTEGER[] NOT NULL DEFAULT '{}',
    -- Leave rules configuration (stored as JSONB for flexibility)
    leave_rules JSONB DEFAULT '{}',
    -- Additional schedule metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Work patterns table - defines 7-day work compositions linked to schedules
CREATE TABLE work_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- 7-day pattern stored as array (e.g., ['F','F','F','E','E','N','N'])
    -- F=Free, E=Evening, N=Night, D=Day, etc.
    pattern VARCHAR(1)[] NOT NULL CHECK (array_length(pattern, 1) = 7),
    -- Pattern order/priority for rotation
    pattern_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique pattern names within a schedule
    UNIQUE(schedule_id, name)
);

-- 3. Teams table - lists all shift teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    -- Link to schedule this team follows
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
    -- Team metadata
    team_size INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Team states table - stores initial/current state for each team
CREATE TABLE team_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    -- Date this state is effective from
    effective_date DATE NOT NULL,
    -- Current block type (e.g., 'work', 'rest', 'leave')
    block_type VARCHAR(50) NOT NULL,
    -- Current day within the block (1-based)
    day_in_block INTEGER NOT NULL CHECK (day_in_block > 0),
    -- Current active work pattern
    active_work_pattern_id UUID NOT NULL REFERENCES work_patterns(id),
    -- Additional state metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure one state per team per date
    UNIQUE(team_id, effective_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_schedules_active ON schedules(is_active);
CREATE INDEX idx_work_patterns_schedule ON work_patterns(schedule_id);
CREATE INDEX idx_work_patterns_active ON work_patterns(is_active);
CREATE INDEX idx_teams_schedule ON teams(schedule_id);
CREATE INDEX idx_teams_active ON teams(is_active);
CREATE INDEX idx_team_states_team ON team_states(team_id);
CREATE INDEX idx_team_states_date ON team_states(effective_date);
CREATE INDEX idx_team_states_team_date ON team_states(team_id, effective_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_patterns_updated_at BEFORE UPDATE ON work_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_states_updated_at BEFORE UPDATE ON team_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies - Enable RLS on all tables
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_states ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your authentication requirements)
-- Allow authenticated users to read all records
CREATE POLICY "Allow authenticated users to read schedules" ON schedules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read work_patterns" ON work_patterns
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read teams" ON teams
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read team_states" ON team_states
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete (adjust as needed)
CREATE POLICY "Allow authenticated users to manage schedules" ON schedules
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage work_patterns" ON work_patterns
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage teams" ON teams
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage team_states" ON team_states
    FOR ALL TO authenticated USING (true);

-- Sample data insertion (optional - remove if not needed)
-- INSERT INTO schedules (name, description, work_block_length, valid_start_days, leave_rules) VALUES
-- ('Standard 12-Hour Shift', 'Standard 12-hour rotating shift schedule', 7, ARRAY[1,2,3,4,5], '{"annual_leave_days": 25, "sick_leave_days": 10}');

-- INSERT INTO work_patterns (schedule_id, name, pattern, pattern_order) VALUES
-- ((SELECT id FROM schedules WHERE name = 'Standard 12-Hour Shift'), 'Pattern A', ARRAY['F','F','F','E','E','N','N'], 1),
-- ((SELECT id FROM schedules WHERE name = 'Standard 12-Hour Shift'), 'Pattern B', ARRAY['N','N','F','F','F','E','E'], 2);

-- INSERT INTO teams (name, description, schedule_id) VALUES
-- ('Team Alpha', 'Primary shift team', (SELECT id FROM schedules WHERE name = 'Standard 12-Hour Shift')),
-- ('Team Beta', 'Secondary shift team', (SELECT id FROM schedules WHERE name = 'Standard 12-Hour Shift'));