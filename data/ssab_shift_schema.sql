-- SSAB Shift Scheduling System Database Schema
-- This schema supports the advanced shift scheduling system with work patterns and team states

-- 1. Main schedules table - defines the overall scheduling rules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    work_block_length INTEGER NOT NULL, -- Length of work blocks in days
    valid_start_weekdays INTEGER[] NOT NULL, -- Array of valid weekdays to start (1=Monday, 7=Sunday)
    default_leave_days INTEGER NOT NULL, -- Default number of leave days
    special_leave_days INTEGER NOT NULL, -- Special leave days
    special_leave_trigger_n_count INTEGER NOT NULL, -- Trigger count for special leave
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Work patterns table - defines different work week compositions
CREATE TABLE work_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'standard_pattern', 'compact_pattern'
    composition TEXT[] NOT NULL, -- Array of shift codes: F=Förmiddag, E=Eftermiddag, N=Natt
    n_count INTEGER NOT NULL, -- How many times this pattern repeats in cycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Teams table - shift teams/groups (enhanced from existing teams table)
-- Note: This may conflict with existing teams table, consider renaming to shift_teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    alias TEXT, -- Alternative name/code for the team
    color TEXT, -- Team color for UI
    company_id UUID, -- Link to companies if needed
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Team states table - tracks current state of each team
CREATE TABLE team_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    state_date DATE NOT NULL, -- The date this state applies to
    block_type TEXT NOT NULL, -- 'WORK', 'LEAVE', etc.
    day_in_block INTEGER NOT NULL, -- Which day in the current block (1-based)
    work_pattern_id UUID REFERENCES work_patterns(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one state per team per date
    UNIQUE(team_id, state_date)
);

-- 5. Shift definitions table - defines what each shift code means
CREATE TABLE shift_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    shift_code TEXT NOT NULL, -- F, E, N, L, etc.
    shift_name TEXT NOT NULL, -- Förmiddag, Eftermiddag, Natt, Ledig
    start_time TIME, -- Start time for the shift
    end_time TIME, -- End time for the shift
    duration_hours DECIMAL(4,2), -- Duration in hours
    is_work_shift BOOLEAN DEFAULT true, -- Whether this counts as work time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique shift codes per schedule
    UNIQUE(schedule_id, shift_code)
);

-- Add indexes for better performance
CREATE INDEX idx_work_patterns_schedule_id ON work_patterns(schedule_id);
CREATE INDEX idx_teams_schedule_id ON teams(schedule_id);
CREATE INDEX idx_team_states_team_id ON team_states(team_id);
CREATE INDEX idx_team_states_date ON team_states(state_date);
CREATE INDEX idx_shift_definitions_schedule_id ON shift_definitions(schedule_id);

-- Add RLS policies if using Supabase
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_definitions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your authentication needs)
CREATE POLICY "Schedules are viewable by authenticated users" ON schedules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Work patterns are viewable by authenticated users" ON work_patterns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Team states are viewable by authenticated users" ON team_states
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Shift definitions are viewable by authenticated users" ON shift_definitions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert default shift definitions for SSAB system
INSERT INTO shift_definitions (schedule_id, shift_code, shift_name, start_time, end_time, duration_hours, is_work_shift) VALUES
-- These will need to be updated with actual schedule_id after creating the schedule
-- ('uuid-for-ssab-schedule', 'F', 'Förmiddag', '06:00', '14:00', 8.0, true),
-- ('uuid-for-ssab-schedule', 'E', 'Eftermiddag', '14:00', '22:00', 8.0, true),
-- ('uuid-for-ssab-schedule', 'N', 'Natt', '22:00', '06:00', 8.0, true),
-- ('uuid-for-ssab-schedule', 'L', 'Ledig', NULL, NULL, 0.0, false);

-- Note: Uncomment and run the above INSERT after running the main data.sql file