-- 🕐 Shifts Table Setup för Skiftappen

-- 1. Skapa Shifts tabell
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morgon', 'kväll', 'natt', 'helg', 'ledig')),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIME,
  end_time TIME,
  hours_worked DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Skapa index för bättre prestanda
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_team_id ON shifts(team_id);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 4. Skapa RLS policies
-- Användare kan se skift för sina team
CREATE POLICY "Users can view shifts for their teams" ON shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = shifts.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Användare kan skapa skift för sina team
CREATE POLICY "Users can create shifts for their teams" ON shifts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = shifts.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Användare kan uppdatera sina egna skift
CREATE POLICY "Users can update their own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = user_id);

-- Användare kan ta bort sina egna skift
CREATE POLICY "Users can delete their own shifts" ON shifts
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Skapa trigger för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shifts_updated_at 
    BEFORE UPDATE ON shifts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Lägg till testdata
-- Först, hämta team IDs
DO $$
DECLARE
    dev_team_id UUID;
    design_team_id UUID;
    vard_team_a_id UUID;
    vard_team_b_id UUID;
BEGIN
    -- Hämta team IDs
    SELECT id INTO dev_team_id FROM teams WHERE name = 'Utvecklingsteam';
    SELECT id INTO design_team_id FROM teams WHERE name = 'Design Team';
    SELECT id INTO vard_team_a_id FROM teams WHERE name = 'Vårdteam A';
    SELECT id INTO vard_team_b_id FROM teams WHERE name = 'Vårdteam B';

    -- Lägg till testskift för januari 2025
    INSERT INTO shifts (date, shift_type, team_id, start_time, end_time, hours_worked, notes) VALUES
    -- Utvecklingsteam
    ('2025-01-06', 'morgon', dev_team_id, '08:00', '16:00', 8.0, 'Måndag morgon'),
    ('2025-01-07', 'kväll', dev_team_id, '16:00', '00:00', 8.0, 'Tisdag kväll'),
    ('2025-01-08', 'morgon', dev_team_id, '08:00', '16:00', 8.0, 'Onsdag morgon'),
    ('2025-01-09', 'natt', dev_team_id, '00:00', '08:00', 8.0, 'Torsdag natt'),
    ('2025-01-10', 'helg', dev_team_id, '08:00', '16:00', 8.0, 'Fredag helg'),
    ('2025-01-11', 'ledig', dev_team_id, NULL, NULL, 0.0, 'Lördag ledig'),
    ('2025-01-12', 'ledig', dev_team_id, NULL, NULL, 0.0, 'Söndag ledig'),
    
    -- Design Team
    ('2025-01-06', 'morgon', design_team_id, '09:00', '17:00', 8.0, 'Måndag design'),
    ('2025-01-07', 'morgon', design_team_id, '09:00', '17:00', 8.0, 'Tisdag design'),
    ('2025-01-08', 'kväll', design_team_id, '17:00', '01:00', 8.0, 'Onsdag kväll'),
    ('2025-01-09', 'morgon', design_team_id, '09:00', '17:00', 8.0, 'Torsdag design'),
    ('2025-01-10', 'helg', design_team_id, '10:00', '18:00', 8.0, 'Fredag helg'),
    ('2025-01-11', 'ledig', design_team_id, NULL, NULL, 0.0, 'Lördag ledig'),
    ('2025-01-12', 'ledig', design_team_id, NULL, NULL, 0.0, 'Söndag ledig'),
    
    -- Vårdteam A
    ('2025-01-06', 'morgon', vard_team_a_id, '07:00', '15:00', 8.0, 'Måndag vård'),
    ('2025-01-07', 'kväll', vard_team_a_id, '15:00', '23:00', 8.0, 'Tisdag kväll'),
    ('2025-01-08', 'natt', vard_team_a_id, '23:00', '07:00', 8.0, 'Onsdag natt'),
    ('2025-01-09', 'morgon', vard_team_a_id, '07:00', '15:00', 8.0, 'Torsdag vård'),
    ('2025-01-10', 'kväll', vard_team_a_id, '15:00', '23:00', 8.0, 'Fredag kväll'),
    ('2025-01-11', 'helg', vard_team_a_id, '08:00', '16:00', 8.0, 'Lördag helg'),
    ('2025-01-12', 'ledig', vard_team_a_id, NULL, NULL, 0.0, 'Söndag ledig'),
    
    -- Vårdteam B
    ('2025-01-06', 'kväll', vard_team_b_id, '15:00', '23:00', 8.0, 'Måndag kväll'),
    ('2025-01-07', 'natt', vard_team_b_id, '23:00', '07:00', 8.0, 'Tisdag natt'),
    ('2025-01-08', 'morgon', vard_team_b_id, '07:00', '15:00', 8.0, 'Onsdag vård'),
    ('2025-01-09', 'kväll', vard_team_b_id, '15:00', '23:00', 8.0, 'Torsdag kväll'),
    ('2025-01-10', 'natt', vard_team_b_id, '23:00', '07:00', 8.0, 'Fredag natt'),
    ('2025-01-11', 'ledig', vard_team_b_id, NULL, NULL, 0.0, 'Lördag ledig'),
    ('2025-01-12', 'helg', vard_team_b_id, '08:00', '16:00', 8.0, 'Söndag helg');
END $$;

-- 7. Aktivera real-time för shifts tabellen
-- Gå till Supabase Dashboard -> Database -> Replication
-- Aktivera real-time för 'shifts' tabellen

-- 8. Verifiering
-- Kör denna query för att kontrollera att allt fungerar:
-- SELECT 
--   s.date,
--   s.shift_type,
--   t.name as team_name,
--   s.start_time,
--   s.end_time,
--   s.hours_worked,
--   s.notes
-- FROM shifts s
-- JOIN teams t ON s.team_id = t.id
-- ORDER BY s.date, t.name; 