-- Svenska skiftscheman och kalendersystem
-- Migration för att lägga till tabeller för skiftscheman och svenska helgdagar

-- Tabell för svenska helgdagar
CREATE TABLE IF NOT EXISTS swedish_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'public', -- public, regional, religious
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för snabbare sökningar
CREATE INDEX idx_swedish_holidays_date ON swedish_holidays(date);
CREATE INDEX idx_swedish_holidays_year ON swedish_holidays(year);
CREATE INDEX idx_swedish_holidays_type ON swedish_holidays(type);

-- Tabell för svenska företag och organisationer
CREATE TABLE IF NOT EXISTS swedish_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT,
  locations TEXT[] DEFAULT '{}',
  departments TEXT[] DEFAULT '{}',
  shift_types TEXT[] DEFAULT '{}',
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för företag
CREATE INDEX idx_swedish_companies_name ON swedish_companies(name);
CREATE INDEX idx_swedish_companies_industry ON swedish_companies(industry);

-- Tabell för skiftmönster
CREATE TABLE IF NOT EXISTS shift_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- t.ex. '2-2', '3-3', '4-4'
  name TEXT NOT NULL,
  pattern INTEGER[] NOT NULL, -- t.ex. [2, 2] för 2-2 skift
  description TEXT,
  total_cycle_days INTEGER GENERATED ALWAYS AS (
    (SELECT SUM(value) FROM unnest(pattern) AS value)
  ) STORED,
  work_days INTEGER GENERATED ALWAYS AS (
    (SELECT SUM(value) FROM unnest(pattern[1:array_length(pattern,1)/2]) AS value)
  ) STORED,
  rest_days INTEGER GENERATED ALWAYS AS (
    (SELECT SUM(value) FROM unnest(pattern[array_length(pattern,1)/2+1:array_length(pattern,1)]) AS value)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för skiftmönster
CREATE INDEX idx_shift_patterns_code ON shift_patterns(code);

-- Tabell för skiftscheman
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES swedish_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL, -- Denormaliserat för prestanda
  date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  department TEXT,
  location TEXT,
  start_time TIME NOT NULL DEFAULT '06:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  duration_hours DECIMAL GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ) STORED,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_weekend BOOLEAN GENERATED ALWAYS AS (
    EXTRACT(DOW FROM date) IN (0, 6) -- Söndag = 0, Lördag = 6
  ) STORED,
  week_number INTEGER GENERATED ALWAYS AS (
    EXTRACT(WEEK FROM date)
  ) STORED,
  year INTEGER GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM date)
  ) STORED,
  month INTEGER GENERATED ALWAYS AS (
    EXTRACT(MONTH FROM date)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för skiftscheman (viktiga för prestanda)
CREATE INDEX idx_shift_schedules_date ON shift_schedules(date);
CREATE INDEX idx_shift_schedules_company ON shift_schedules(company_name);
CREATE INDEX idx_shift_schedules_year ON shift_schedules(year);
CREATE INDEX idx_shift_schedules_month ON shift_schedules(year, month);
CREATE INDEX idx_shift_schedules_week ON shift_schedules(year, week_number);
CREATE INDEX idx_shift_schedules_location ON shift_schedules(location);
CREATE INDEX idx_shift_schedules_department ON shift_schedules(department);
CREATE INDEX idx_shift_schedules_shift_type ON shift_schedules(shift_type);

-- Sammansatt index för vanliga sökningar
CREATE INDEX idx_shift_schedules_company_date ON shift_schedules(company_name, date);
CREATE INDEX idx_shift_schedules_location_date ON shift_schedules(location, date);

-- Tabell för skottår och kalenderdata
CREATE TABLE IF NOT EXISTS swedish_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  is_leap_year BOOLEAN NOT NULL,
  days_in_year INTEGER NOT NULL,
  week_count INTEGER NOT NULL,
  easter_date DATE NOT NULL,
  midsummer_date DATE NOT NULL,
  all_saints_date DATE NOT NULL,
  dst_start_date DATE, -- Sommartid start
  dst_end_date DATE,   -- Sommartid slut
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för kalenderdata
CREATE INDEX idx_swedish_calendar_year ON swedish_calendar(year);
CREATE INDEX idx_swedish_calendar_leap ON swedish_calendar(is_leap_year);

-- Tabell för användarspecifika skiftscheman
CREATE TABLE IF NOT EXISTS user_shift_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  shift_type TEXT NOT NULL,
  location TEXT,
  department TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för användarscheman
CREATE INDEX idx_user_shift_schedules_user ON user_shift_schedules(user_id);
CREATE INDEX idx_user_shift_schedules_active ON user_shift_schedules(is_active);
CREATE INDEX idx_user_shift_schedules_dates ON user_shift_schedules(start_date, end_date);

-- RLS (Row Level Security) policies
ALTER TABLE swedish_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE swedish_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE swedish_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shift_schedules ENABLE ROW LEVEL SECURITY;

-- Policies för publika data (helgdagar, företag, skiftscheman)
CREATE POLICY "Svenska helgdagar är publika" ON swedish_holidays FOR SELECT USING (true);
CREATE POLICY "Svenska företag är publika" ON swedish_companies FOR SELECT USING (true);
CREATE POLICY "Skiftmönster är publika" ON shift_patterns FOR SELECT USING (true);
CREATE POLICY "Skiftscheman är publika" ON shift_schedules FOR SELECT USING (true);
CREATE POLICY "Svensk kalender är publik" ON swedish_calendar FOR SELECT USING (true);

-- Policies för användarspecifika scheman
CREATE POLICY "Användare kan se sina egna scheman" ON user_shift_schedules 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Användare kan skapa sina egna scheman" ON user_shift_schedules 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan uppdatera sina egna scheman" ON user_shift_schedules 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Användare kan radera sina egna scheman" ON user_shift_schedules 
  FOR DELETE USING (auth.uid() = user_id);

-- Funktioner för att beräkna skiftscheman
CREATE OR REPLACE FUNCTION calculate_shift_schedule(
  p_shift_pattern INTEGER[],
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  schedule_date DATE,
  is_work_day BOOLEAN,
  pattern_day INTEGER,
  cycle_day INTEGER
) AS $$
DECLARE
  current_date DATE := p_start_date;
  pattern_length INTEGER := array_length(p_shift_pattern, 1);
  cycle_length INTEGER := (SELECT SUM(unnest) FROM unnest(p_shift_pattern));
  cycle_day_counter INTEGER := 1;
  pattern_index INTEGER := 1;
  days_in_current_phase INTEGER := 0;
BEGIN
  WHILE current_date <= p_end_date LOOP
    -- Bestäm om det är arbetsdag
    schedule_date := current_date;
    pattern_day := pattern_index;
    cycle_day := cycle_day_counter;
    
    -- Första hälften av mönstret = arbetsdagar
    is_work_day := (pattern_index <= pattern_length / 2);
    
    RETURN NEXT;
    
    -- Uppdatera räknare
    days_in_current_phase := days_in_current_phase + 1;
    
    -- Kontrollera om vi ska byta fas
    IF days_in_current_phase >= p_shift_pattern[pattern_index] THEN
      pattern_index := pattern_index + 1;
      days_in_current_phase := 0;
      
      -- Starta om cykeln om vi nått slutet
      IF pattern_index > pattern_length THEN
        pattern_index := 1;
        cycle_day_counter := 1;
      END IF;
    END IF;
    
    cycle_day_counter := cycle_day_counter + 1;
    IF cycle_day_counter > cycle_length THEN
      cycle_day_counter := 1;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att hämta helgdagar för ett år
CREATE OR REPLACE FUNCTION get_swedish_holidays(p_year INTEGER)
RETURNS TABLE (
  holiday_date DATE,
  holiday_name TEXT,
  holiday_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT date, name, type
  FROM swedish_holidays
  WHERE year = p_year
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Funktion för att kontrollera om ett datum är helg
CREATE OR REPLACE FUNCTION is_swedish_holiday(p_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM swedish_holidays 
    WHERE date = p_date
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger för att uppdatera updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Lägg till triggers för alla tabeller
CREATE TRIGGER update_swedish_holidays_updated_at 
  BEFORE UPDATE ON swedish_holidays 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swedish_companies_updated_at 
  BEFORE UPDATE ON swedish_companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_patterns_updated_at 
  BEFORE UPDATE ON shift_patterns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_schedules_updated_at 
  BEFORE UPDATE ON shift_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swedish_calendar_updated_at 
  BEFORE UPDATE ON swedish_calendar 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_shift_schedules_updated_at 
  BEFORE UPDATE ON user_shift_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kommentarer för dokumentation
COMMENT ON TABLE swedish_holidays IS 'Svenska helgdagar och röda dagar';
COMMENT ON TABLE swedish_companies IS 'Svenska företag och organisationer med skiftarbete';
COMMENT ON TABLE shift_patterns IS 'Skiftmönster och schematyper';
COMMENT ON TABLE shift_schedules IS 'Genererade skiftscheman för alla företag och år';
COMMENT ON TABLE swedish_calendar IS 'Svensk kalenderdata inklusive skottår och helgdagar';
COMMENT ON TABLE user_shift_schedules IS 'Användarspecifika skiftscheman och inställningar';

COMMENT ON FUNCTION calculate_shift_schedule IS 'Beräknar skiftschema baserat på mönster och datumintervall';
COMMENT ON FUNCTION get_swedish_holidays IS 'Hämtar alla svenska helgdagar för ett specifikt år';
COMMENT ON FUNCTION is_swedish_holiday IS 'Kontrollerar om ett datum är svensk helgdag';