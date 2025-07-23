-- RPC Function för att hämta skift för kalender med team-filtering
CREATE OR REPLACE FUNCTION get_calendar_shifts(team_filter_id TEXT DEFAULT 'all')
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  shift_team_id UUID,
  team_name TEXT,
  color_hex TEXT,
  user_id UUID,
  shift_type TEXT,
  notes TEXT
) AS $$
BEGIN
  -- Validera input
  IF team_filter_id IS NULL THEN
    team_filter_id := 'all';
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.start_time,
    s.end_time,
    s.shift_team_id,
    COALESCE(st.name, 'Okänt team') as team_name,
    COALESCE(st.color_hex, '#6B7280') as color_hex,
    s.user_id,
    s.shift_type,
    s.notes
  FROM shifts s
  LEFT JOIN shift_teams st ON s.shift_team_id = st.id
  WHERE 
    CASE 
      WHEN team_filter_id = 'all' THEN TRUE
      WHEN team_filter_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN s.shift_team_id::TEXT = team_filter_id
      ELSE FALSE
    END
  ORDER BY s.start_time ASC;
  
  -- Returnera tom resultat om inga matchningar
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 