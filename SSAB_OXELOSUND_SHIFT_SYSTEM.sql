-- 🏭 SSAB Oxelösund 3-Skift System Implementation
-- Lag 31-35 med komplex rotationslogik för 2023-2035

-- 1. Skapa SSAB Oxelösund företag och teams
INSERT INTO companies (name, description, industry, location, website, employee_count, founded_year) 
VALUES ('SSAB OXELÖSUND', 'Ståltillverkning Oxelösund', 'Stålindustri', 'Oxelösund', 'https://www.ssab.com/oxelosund', 800, 1917)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Skapa shift teams för SSAB Oxelösund
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Lag 31', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND'), '3-skift lag 31', '2F,2E,3N,4L,3F,3E,1N,5L,2F,2E,3N,5L,3F,2E,2N,4L', 16, 0),
('Lag 32', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND'), '3-skift lag 32', '2F,2E,3N,4L,3F,3E,1N,5L,2F,2E,3N,5L,3F,2E,2N,4L', 16, 1),
('Lag 33', '#45B7D1', (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND'), '3-skift lag 33', '2F,2E,3N,4L,3F,3E,1N,5L,2F,2E,3N,5L,3F,2E,2N,4L', 16, 2),
('Lag 34', '#96CEB4', (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND'), '3-skift lag 34', '2F,2E,3N,4L,3F,3E,1N,5L,2F,2E,3N,5L,3F,2E,2N,4L', 16, 3),
('Lag 35', '#FFEAA7', (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND'), '3-skift lag 35', '2F,2E,3N,4L,3F,3E,1N,5L,2F,2E,3N,5L,3F,2E,2N,4L', 16, 4);

-- 3. Funktion för att beräkna SSAB Oxelösund skiftschema
CREATE OR REPLACE FUNCTION generate_ssab_oxelosund_shifts(
  p_start_date DATE DEFAULT '2023-01-01',
  p_end_date DATE DEFAULT '2035-12-31'
)
RETURNS INTEGER AS $$
DECLARE
  current_date DATE;
  team_id UUID;
  shift_count INTEGER := 0;
  team_offset INTEGER;
  cycle_day INTEGER;
  shift_type TEXT;
  shift_title TEXT;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
  team_record RECORD;
  
  -- SSAB Oxelösund specifika konstanter
  shift_pattern TEXT[] := ARRAY['2F', '2E', '3N', '4L', '3F', '3E', '1N', '5L', '2F', '2E', '3N', '5L', '3F', '2E', '2N', '4L'];
  allowed_start_days INTEGER[] := ARRAY[1, 3, 5]; -- Måndag, Onsdag, Fredag (0=Sunday, 1=Monday, etc)
  
BEGIN
  -- Hämta alla SSAB Oxelösund teams
  FOR team_record IN 
    SELECT id, team_offset 
    FROM shift_teams 
    WHERE company_id = (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND')
    ORDER BY name
  LOOP
    team_id := team_record.id;
    team_offset := team_record.team_offset;
    
    current_date := p_start_date;
    
    -- Hitta första tillåtna startdag för detta lag
    WHILE current_date <= p_end_date LOOP
      -- Kontrollera om det är en tillåten startdag (måndag, onsdag, fredag)
      IF EXTRACT(DOW FROM current_date) = ANY(allowed_start_days) THEN
        
        -- Generera 7-dagars arbetsblock
        FOR day_offset IN 0..6 LOOP
          cycle_day := ((EXTRACT(EPOCH FROM (current_date + day_offset * INTERVAL '1 day' - DATE '2023-01-01')) / 86400) + team_offset) % array_length(shift_pattern, 1);
          shift_type := shift_pattern[cycle_day + 1];
          
          -- Bestäm skifttider baserat på typ
          CASE 
            WHEN shift_type LIKE 'F%' THEN
              shift_title := 'Förmiddagsskift';
              start_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '06:00:00';
              end_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '14:00:00';
            WHEN shift_type LIKE 'E%' THEN
              shift_title := 'Eftermiddagsskift';
              start_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '14:00:00';
              end_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '22:00:00';
            WHEN shift_type LIKE 'N%' THEN
              shift_title := 'Nattskift';
              start_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '22:00:00';
              end_time := current_date + (day_offset + 1) * INTERVAL '1 day' + INTERVAL '06:00:00';
            WHEN shift_type LIKE 'L%' THEN
              shift_title := 'Ledig';
              start_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '00:00:00';
              end_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '23:59:59';
            ELSE
              shift_title := 'Skift';
              start_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '06:00:00';
              end_time := current_date + day_offset * INTERVAL '1 day' + INTERVAL '14:00:00';
          END CASE;
          
          -- Skapa skift om det inte redan finns
          IF NOT EXISTS (
            SELECT 1 FROM shifts 
            WHERE shift_team_id = team_id 
              AND DATE(start_time) = current_date + day_offset * INTERVAL '1 day'
          ) THEN
            INSERT INTO shifts (
              title,
              start_time,
              end_time,
              shift_team_id,
              shift_type,
              cycle_day,
              is_generated
            ) VALUES (
              shift_title,
              start_time,
              end_time,
              team_id,
              CASE 
                WHEN shift_type LIKE 'F%' THEN 'F'
                WHEN shift_type LIKE 'E%' THEN 'E'
                WHEN shift_type LIKE 'N%' THEN 'N'
                WHEN shift_type LIKE 'L%' THEN 'L'
                ELSE 'F'
              END,
              cycle_day + 1,
              true
            );
            shift_count := shift_count + 1;
          END IF;
        END LOOP;
        
        -- Hoppa till nästa 7-dagars block (16 dagar framåt för full rotation)
        current_date := current_date + INTERVAL '16 days';
      ELSE
        current_date := current_date + INTERVAL '1 day';
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN shift_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Funktion för att hämta SSAB Oxelösund specifik data
CREATE OR REPLACE FUNCTION get_ssab_oxelosund_shifts(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
  p_team_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  shift_type TEXT,
  shift_team_id UUID,
  team_name TEXT,
  team_color TEXT,
  company_name TEXT,
  cycle_day INTEGER,
  is_generated BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.start_time,
    s.end_time,
    s.shift_type,
    s.shift_team_id,
    st.name as team_name,
    st.color_hex as team_color,
    c.name as company_name,
    s.cycle_day,
    s.is_generated,
    s.created_at
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  LEFT JOIN companies c ON st.company_id = c.id
  WHERE s.start_time >= p_start_date 
    AND s.start_time <= p_end_date
    AND c.name = 'SSAB OXELÖSUND'
    AND (
      p_team_filter = 'all' 
      OR p_team_filter = st.id::TEXT
      OR st.name = p_team_filter
    )
  ORDER BY s.start_time, st.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funktion för att beräkna SSAB Oxelösund statistik
CREATE OR REPLACE FUNCTION get_ssab_oxelosund_stats(
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE (
  team_name TEXT,
  total_shifts INTEGER,
  morning_shifts INTEGER,
  afternoon_shifts INTEGER,
  night_shifts INTEGER,
  free_days INTEGER,
  total_hours DECIMAL(10,2),
  average_shift_length DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.name as team_name,
    COUNT(s.id)::INTEGER as total_shifts,
    COUNT(CASE WHEN s.shift_type = 'F' THEN 1 END)::INTEGER as morning_shifts,
    COUNT(CASE WHEN s.shift_type = 'E' THEN 1 END)::INTEGER as afternoon_shifts,
    COUNT(CASE WHEN s.shift_type = 'N' THEN 1 END)::INTEGER as night_shifts,
    COUNT(CASE WHEN s.shift_type = 'L' THEN 1 END)::INTEGER as free_days,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0)::DECIMAL(10,2) as total_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0)::DECIMAL(5,2) as average_shift_length
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  LEFT JOIN companies c ON st.company_id = c.id
  WHERE s.start_time >= p_start_date 
    AND s.start_time <= p_end_date
    AND c.name = 'SSAB OXELÖSUND'
  GROUP BY st.name
  ORDER BY st.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Funktion för att validera SSAB Oxelösund regler
CREATE OR REPLACE FUNCTION validate_ssab_oxelosund_rules(
  p_start_date DATE DEFAULT '2023-01-01',
  p_end_date DATE DEFAULT '2025-12-31'
)
RETURNS TABLE (
  validation_rule TEXT,
  status TEXT,
  details TEXT
) AS $$
DECLARE
  rule_count INTEGER;
  invalid_start_days INTEGER;
  invalid_shift_sequences INTEGER;
  missing_teams INTEGER;
BEGIN
  -- Kontrollera att alla 5 lag finns
  SELECT COUNT(*) INTO rule_count
  FROM shift_teams st
  JOIN companies c ON st.company_id = c.id
  WHERE c.name = 'SSAB OXELÖSUND';
  
  IF rule_count = 5 THEN
    INSERT INTO validate_ssab_oxelosund_rules VALUES ('Alla 5 lag finns', 'PASS', 'Lag 31-35 är korrekt skapade');
  ELSE
    INSERT INTO validate_ssab_oxelosund_rules VALUES ('Alla 5 lag finns', 'FAIL', 'Saknar lag - förväntade 5, fann ' || rule_count);
  END IF;
  
  -- Kontrollera startdagar (måndag, onsdag, fredag)
  SELECT COUNT(*) INTO invalid_start_days
  FROM shifts s
  JOIN shift_teams st ON s.shift_team_id = st.id
  JOIN companies c ON st.company_id = c.id
  WHERE c.name = 'SSAB OXELÖSUND'
    AND s.start_time >= p_start_date
    AND s.start_time <= p_end_date
    AND EXTRACT(DOW FROM s.start_time) NOT IN (1, 3, 5);
  
  IF invalid_start_days = 0 THEN
    INSERT INTO validate_ssab_oxelosund_rules VALUES ('Startdagar', 'PASS', 'Alla skift börjar på måndag, onsdag eller fredag');
  ELSE
    INSERT INTO validate_ssab_oxelosund_rules VALUES ('Startdagar', 'FAIL', invalid_start_days || ' skift börjar på fel dag');
  END IF;
  
  -- Kontrollera 7-dagars arbetsblock
  SELECT COUNT(*) INTO invalid_shift_sequences
  FROM (
    SELECT 
      st.name,
      DATE(s.start_time) as work_date,
      COUNT(*) as shifts_in_block
    FROM shifts s
    JOIN shift_teams st ON s.shift_team_id = st.id
    JOIN companies c ON st.company_id = c.id
    WHERE c.name = 'SSAB OXELÖSUND'
      AND s.shift_type != 'L'
      AND s.start_time >= p_start_date
      AND s.start_time <= p_end_date
    GROUP BY st.name, DATE(s.start_time)
    HAVING COUNT(*) > 1
  ) invalid_blocks;
  
  IF invalid_shift_sequences = 0 THEN
    INSERT INTO validate_ssab_oxelosund_rules VALUES ('7-dagars block', 'PASS', 'Inga dubbla skift per dag');
  ELSE
    INSERT INTO validate_ssab_oxelosund_rules VALUES ('7-dagars block', 'FAIL', invalid_shift_sequences || ' dagar har dubbla skift');
  END IF;
  
  RETURN QUERY SELECT * FROM validate_ssab_oxelosund_rules;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Generera skift för SSAB Oxelösund 2023-2035
SELECT generate_ssab_oxelosund_shifts('2023-01-01', '2035-12-31');

-- 8. Kommentarer för dokumentation
COMMENT ON FUNCTION generate_ssab_oxelosund_shifts IS 'Genererar SSAB Oxelösund 3-skift schema för lag 31-35';
COMMENT ON FUNCTION get_ssab_oxelosund_shifts IS 'Hämtar SSAB Oxelösund skiftdata med team-filter';
COMMENT ON FUNCTION get_ssab_oxelosund_stats IS 'Hämtar statistik för SSAB Oxelösund teams';
COMMENT ON FUNCTION validate_ssab_oxelosund_rules IS 'Validerar SSAB Oxelösund skiftregler';

-- 9. Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_ssab_shifts_team ON shifts(shift_team_id) WHERE shift_team_id IN (
  SELECT id FROM shift_teams WHERE company_id = (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND')
);

CREATE INDEX IF NOT EXISTS idx_ssab_shifts_date ON shifts(start_time) WHERE shift_team_id IN (
  SELECT id FROM shift_teams WHERE company_id = (SELECT id FROM companies WHERE name = 'SSAB OXELÖSUND')
); 