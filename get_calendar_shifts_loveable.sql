-- 🏢 Loveable Skiftappen - RPC Funktion för Kalender
-- Optimized för svenska företag och skiftscheman

CREATE OR REPLACE FUNCTION get_calendar_shifts(
  p_team_filter_id TEXT DEFAULT 'all',
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
  p_user_id UUID DEFAULT auth.uid()
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
  user_id UUID,
  user_name TEXT,
  notes TEXT,
  cycle_day INTEGER,
  is_generated BOOLEAN,
  is_my_shift BOOLEAN,
  is_available_for_trade BOOLEAN,
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
    s.user_id,
    p.full_name as user_name,
    s.notes,
    s.cycle_day,
    s.is_generated,
    (s.user_id = p_user_id) as is_my_shift,
    (s.user_id IS NOT NULL AND s.user_id != p_user_id) as is_available_for_trade,
    s.created_at
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  LEFT JOIN companies c ON st.company_id = c.id
  LEFT JOIN profiles p ON s.user_id = p.id
  WHERE s.start_time >= p_start_date 
    AND s.start_time <= p_end_date
    AND (
      p_team_filter_id = 'all' 
      OR p_team_filter_id = st.id::TEXT
      OR (p_team_filter_id = 'my_team' AND st.id IN (
        SELECT shift_team_id FROM profiles WHERE id = p_user_id AND shift_team_id IS NOT NULL
      ))
    )
  ORDER BY s.start_time, st.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att hämta användarens nästa skift (för widgets)
CREATE OR REPLACE FUNCTION get_next_shift(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  shift_type TEXT,
  team_name TEXT,
  team_color TEXT,
  company_name TEXT,
  hours_until_shift INTEGER,
  minutes_until_shift INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.start_time,
    s.end_time,
    s.shift_type,
    st.name as team_name,
    st.color_hex as team_color,
    c.name as company_name,
    EXTRACT(EPOCH FROM (s.start_time - NOW())) / 3600::INTEGER as hours_until_shift,
    EXTRACT(EPOCH FROM (s.start_time - NOW())) / 60::INTEGER as minutes_until_shift
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  LEFT JOIN companies c ON st.company_id = c.id
  WHERE s.user_id = p_user_id 
    AND s.start_time > NOW()
  ORDER BY s.start_time
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att hämta team-statistik
CREATE OR REPLACE FUNCTION get_team_stats(
  p_team_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE (
  total_shifts INTEGER,
  morning_shifts INTEGER,
  afternoon_shifts INTEGER,
  night_shifts INTEGER,
  free_days INTEGER,
  total_hours DECIMAL(10,2),
  team_member_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(s.id)::INTEGER as total_shifts,
    COUNT(CASE WHEN s.shift_type IN ('M', 'morgon') THEN 1 END)::INTEGER as morning_shifts,
    COUNT(CASE WHEN s.shift_type IN ('A', 'kväll') THEN 1 END)::INTEGER as afternoon_shifts,
    COUNT(CASE WHEN s.shift_type IN ('N', 'natt') THEN 1 END)::INTEGER as night_shifts,
    COUNT(CASE WHEN s.shift_type IN ('L', 'ledig') THEN 1 END)::INTEGER as free_days,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0)::DECIMAL(10,2) as total_hours,
    COUNT(DISTINCT tm.user_id)::INTEGER as team_member_count
  FROM shifts s
  LEFT JOIN team_members tm ON s.shift_team_id = tm.team_id
  WHERE s.shift_team_id = p_team_id
    AND s.start_time >= p_start_date 
    AND s.start_time <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att generera skift automatiskt baserat på mönster
CREATE OR REPLACE FUNCTION generate_shifts_from_pattern(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_pattern TEXT[] DEFAULT ARRAY['M', 'A', 'N', 'L', 'M', 'A', 'N', 'L']::TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  current_date DATE;
  pattern_index INTEGER;
  shift_type TEXT;
  shift_count INTEGER := 0;
  team_record RECORD;
BEGIN
  -- Hämta team-information
  SELECT * INTO team_record FROM shift_teams WHERE id = p_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  current_date := p_start_date;
  
  WHILE current_date <= p_end_date LOOP
    -- Beräkna vilket skift som ska genereras baserat på mönster
    pattern_index := ((EXTRACT(EPOCH FROM (current_date - DATE '2024-01-01')) / 86400) + team_record.team_offset) % array_length(p_pattern, 1);
    shift_type := p_pattern[pattern_index + 1];
    
    -- Skapa skift om det inte redan finns
    IF NOT EXISTS (
      SELECT 1 FROM shifts 
      WHERE shift_team_id = p_team_id 
        AND DATE(start_time) = current_date
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
        CASE 
          WHEN shift_type = 'M' THEN 'Morgonskift'
          WHEN shift_type = 'A' THEN 'Eftermiddagsskift'
          WHEN shift_type = 'N' THEN 'Nattskift'
          WHEN shift_type = 'L' THEN 'Ledig'
          ELSE 'Skift'
        END,
        CASE 
          WHEN shift_type = 'M' THEN current_date + team_record.start_time_morning
          WHEN shift_type = 'A' THEN current_date + team_record.start_time_afternoon
          WHEN shift_type = 'N' THEN current_date + team_record.start_time_night
          ELSE current_date + '00:00:00'
        END,
        CASE 
          WHEN shift_type = 'M' THEN current_date + team_record.end_time_morning
          WHEN shift_type = 'A' THEN current_date + team_record.end_time_afternoon
          WHEN shift_type = 'N' THEN 
            CASE 
              WHEN team_record.end_time_night < team_record.start_time_night 
              THEN current_date + INTERVAL '1 day' + team_record.end_time_night
              ELSE current_date + team_record.end_time_night
            END
          ELSE current_date + '23:59:59'
        END,
        p_team_id,
        shift_type,
        pattern_index + 1,
        true
      );
      shift_count := shift_count + 1;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN shift_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att hämta tillgängliga skiftbyten
CREATE OR REPLACE FUNCTION get_available_trades(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  shift_id UUID,
  shift_title TEXT,
  shift_start_time TIMESTAMP WITH TIME ZONE,
  shift_end_time TIMESTAMP WITH TIME ZONE,
  shift_type TEXT,
  team_name TEXT,
  team_color TEXT,
  user_name TEXT,
  trade_request_id UUID,
  trade_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as shift_id,
    s.title as shift_title,
    s.start_time as shift_start_time,
    s.end_time as shift_end_time,
    s.shift_type,
    st.name as team_name,
    st.color_hex as team_color,
    p.full_name as user_name,
    str.id as trade_request_id,
    str.status as trade_status
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  LEFT JOIN profiles p ON s.user_id = p.id
  LEFT JOIN shift_trade_requests str ON s.id = str.shift_id AND str.requester_id = p_user_id
  WHERE s.user_id IS NOT NULL 
    AND s.user_id != p_user_id
    AND s.start_time > NOW()
    AND s.shift_type NOT IN ('L', 'ledig')
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentarer för dokumentation
COMMENT ON FUNCTION get_calendar_shifts IS 'Hämtar skift för kalendervy med team-filter';
COMMENT ON FUNCTION get_next_shift IS 'Hämtar användarens nästa skift för widgets';
COMMENT ON FUNCTION get_team_stats IS 'Hämtar statistik för ett team';
COMMENT ON FUNCTION generate_shifts_from_pattern IS 'Genererar skift automatiskt baserat på mönster';
COMMENT ON FUNCTION get_available_trades IS 'Hämtar tillgängliga skiftbyten'; 