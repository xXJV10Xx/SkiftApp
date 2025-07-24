-- SSAB Oxelösund Skiftschema Migration
-- Skapat för att stödja fullständig schemahantering 2023-2035

-- Skapa companies tabell
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa shift_types tabell
CREATE TABLE IF NOT EXISTS shift_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pattern TEXT[] NOT NULL,
  cycle INTEGER NOT NULL,
  times JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa teams tabell
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  team_name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, team_name)
);

-- Skapa shifts tabell för att lagra faktiska skiftdata
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  shift_type_id TEXT REFERENCES shift_types(id),
  team_name TEXT NOT NULL,
  date DATE NOT NULL,
  shift_code TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  cycle_day INTEGER,
  total_cycle_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, team_name, date)
);

-- Lägg till index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_shifts_company_date ON shifts(company_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_team_date ON shifts(team_name, date);
CREATE INDEX IF NOT EXISTS idx_shifts_date_range ON shifts(date);

-- Infoga SSAB Oxelösund data
INSERT INTO companies (id, name, description, location) VALUES 
('ssab_oxelosund', 'SSAB Oxelösund', 'Stål och järn - Oxelösund', 'Oxelösund, Sverige')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  updated_at = NOW();

-- Infoga SSAB Oxelösund skifttyp
INSERT INTO shift_types (id, name, description, pattern, cycle, times) VALUES 
('ssab_oxelosund_3skift', 'SSAB Oxelösund 3-skift', 
 'Kontinuerligt 3-skiftssystem för SSAB Oxelösund - 7 arbetsdagar (F,F,E,E,N,N,N) + 4 lediga',
 ARRAY['F', 'F', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L'],
 11,
 '{
   "F": {"start": "06:00", "end": "14:00", "name": "Förmiddag"},
   "E": {"start": "14:00", "end": "22:00", "name": "Eftermiddag"},
   "N": {"start": "22:00", "end": "06:00", "name": "Natt"},
   "L": {"start": "", "end": "", "name": "Ledig"}
 }'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  pattern = EXCLUDED.pattern,
  cycle = EXCLUDED.cycle,
  times = EXCLUDED.times,
  updated_at = NOW();

-- Infoga SSAB Oxelösund lag
INSERT INTO teams (company_id, team_name, color) VALUES 
('ssab_oxelosund', '31', '#FF6B35'),
('ssab_oxelosund', '32', '#004E89'),
('ssab_oxelosund', '33', '#1A936F'),
('ssab_oxelosund', '34', '#C6426E'),
('ssab_oxelosund', '35', '#6F1E51')
ON CONFLICT (company_id, team_name) DO UPDATE SET
  color = EXCLUDED.color,
  updated_at = NOW();

-- Skapa funktion för att generera skiftschema
CREATE OR REPLACE FUNCTION generate_shift_schedule(
  p_company_id TEXT,
  p_shift_type_id TEXT,
  p_start_date DATE,
  p_end_date DATE
) RETURNS VOID AS $$
DECLARE
  shift_type_rec RECORD;
  team_rec RECORD;
  current_date DATE;
  days_diff INTEGER;
  team_offset INTEGER;
  adjusted_day INTEGER;
  cycle_pos INTEGER;
  shift_code TEXT;
  shift_info JSONB;
BEGIN
  -- Hämta skifttyp
  SELECT * INTO shift_type_rec FROM shift_types WHERE id = p_shift_type_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift type % not found', p_shift_type_id;
  END IF;
  
  -- Rensa befintliga skift för perioden
  DELETE FROM shifts 
  WHERE company_id = p_company_id 
    AND shift_type_id = p_shift_type_id
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Generera skift för varje lag
  FOR team_rec IN 
    SELECT team_name FROM teams WHERE company_id = p_company_id ORDER BY team_name
  LOOP
    -- Beräkna team offset (speciell hantering för SSAB Oxelösund)
    IF p_shift_type_id = 'ssab_oxelosund_3skift' THEN
      CASE team_rec.team_name
        WHEN '31' THEN team_offset := 5;
        WHEN '32' THEN team_offset := 3;
        WHEN '33' THEN team_offset := 0;
        WHEN '34' THEN team_offset := 2;
        WHEN '35' THEN team_offset := 8;
        ELSE team_offset := 0;
      END CASE;
    ELSE
      team_offset := 0; -- Standard för andra skifttyper
    END IF;
    
    -- Generera skift för varje dag
    current_date := p_start_date;
    WHILE current_date <= p_end_date LOOP
      -- Beräkna dagar från startdatum (2023-01-01)
      days_diff := current_date - DATE '2023-01-01';
      adjusted_day := days_diff + team_offset;
      cycle_pos := MOD(adjusted_day, shift_type_rec.cycle);
      
      -- Hämta skiftkod från pattern (PostgreSQL arrays är 1-indexerade)
      shift_code := shift_type_rec.pattern[cycle_pos + 1];
      
      -- Hämta skiftinfo från times JSON
      shift_info := shift_type_rec.times -> shift_code;
      
      -- Infoga skift
      INSERT INTO shifts (
        company_id, shift_type_id, team_name, date, shift_code, shift_name,
        start_time, end_time, cycle_day, total_cycle_days
      ) VALUES (
        p_company_id, p_shift_type_id, team_rec.team_name, current_date, shift_code,
        shift_info ->> 'name',
        CASE WHEN shift_info ->> 'start' != '' THEN (shift_info ->> 'start')::TIME ELSE NULL END,
        CASE WHEN shift_info ->> 'end' != '' THEN (shift_info ->> 'end')::TIME ELSE NULL END,
        cycle_pos + 1, shift_type_rec.cycle
      );
      
      current_date := current_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generera schema för SSAB Oxelösund 2023-2035
SELECT generate_shift_schedule(
  'ssab_oxelosund', 
  'ssab_oxelosund_3skift', 
  DATE '2023-01-01', 
  DATE '2035-12-31'
);

-- Skapa vy för enkel åtkomst till schemadata
CREATE OR REPLACE VIEW shift_calendar AS
SELECT 
  s.company_id,
  c.name as company_name,
  s.team_name,
  t.color as team_color,
  s.date,
  s.shift_code,
  s.shift_name,
  s.start_time,
  s.end_time,
  s.cycle_day,
  s.total_cycle_days,
  EXTRACT(YEAR FROM s.date) as year,
  EXTRACT(MONTH FROM s.date) as month,
  EXTRACT(DAY FROM s.date) as day,
  EXTRACT(DOW FROM s.date) as day_of_week
FROM shifts s
JOIN companies c ON s.company_id = c.id
JOIN teams t ON s.company_id = t.company_id AND s.team_name = t.team_name
ORDER BY s.company_id, s.date, s.team_name;

-- Skapa RLS (Row Level Security) policies om behövs
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Grundläggande policy för läsning (kan anpassas efter behov)
CREATE POLICY "Allow read access to all users" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON shift_types FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON shifts FOR SELECT USING (true);