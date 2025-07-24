-- schema.sql

-- Tabell för att lagra de övergripande reglerna
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  work_block_length INT NOT NULL,
  valid_start_weekdays INT[] NOT NULL,
  default_leave_days INT NOT NULL,
  special_leave_days INT NOT NULL,
  special_leave_trigger_n_count INT NOT NULL
);

-- Tabell för att lagra de olika 7-dagars arbetsmönstren
CREATE TABLE work_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  composition TEXT[] NOT NULL,
  n_count INT NOT NULL
);

-- Tabell för att lagra alla skiftlag
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alias TEXT
);

-- Tabell för att lagra starttillståndet för varje lag
CREATE TABLE team_states (
  id BIGSERIAL PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  block_type TEXT NOT NULL, -- 'WORK' eller 'LEAVE'
  day_in_block INT NOT NULL,
  work_pattern_id UUID REFERENCES work_patterns(id)
);

CREATE UNIQUE INDEX on team_states (team_id, state_date);