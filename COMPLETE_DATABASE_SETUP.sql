-- 🏢 Komplett Database Setup för Skiftappen (2020-2030)

-- 1. Rensa befintliga tabeller (om de finns)
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS online_status CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Skapa Companies tabell
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skapa Teams tabell
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skapa Team Members tabell
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- 5. Skapa Chat Messages tabell
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Skapa Online Status tabell
CREATE TABLE online_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 7. Skapa Profiles tabell
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Skapa Shifts tabell
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

-- 9. Skapa index för bättre prestanda
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_team_id ON shifts(team_id);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type);
CREATE INDEX idx_teams_company_id ON teams(company_id);

-- 10. Enable RLS för alla tabeller
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 11. Skapa RLS policies för Companies
CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies can be created by authenticated users" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies can be updated by authenticated users" ON companies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 12. Skapa RLS policies för Teams
CREATE POLICY "Teams are viewable by authenticated users" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teams can be created by authenticated users" ON teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teams can be updated by authenticated users" ON teams
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 13. Skapa RLS policies för Team Members
CREATE POLICY "Team members can view their own memberships" ON team_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join teams" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Team members can view other members in their teams" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- 14. Skapa RLS policies för Chat Messages
CREATE POLICY "Team members can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = chat_messages.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = chat_messages.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- 15. Skapa RLS policies för Online Status
CREATE POLICY "Users can view online status of team members" ON online_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = online_status.user_id
    )
  );

CREATE POLICY "Users can update their own online status" ON online_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own online status" ON online_status
  FOR UPDATE USING (auth.uid() = user_id);

-- 16. Skapa RLS policies för Profiles
CREATE POLICY "Users can view profiles of team members" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 17. Skapa RLS policies för Shifts
CREATE POLICY "Users can view shifts for their teams" ON shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = shifts.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shifts for their teams" ON shifts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = shifts.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts" ON shifts
  FOR DELETE USING (auth.uid() = user_id);

-- 18. Skapa trigger för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_status_updated_at 
    BEFORE UPDATE ON online_status 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at 
    BEFORE UPDATE ON shifts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 19. Lägg till företag
INSERT INTO companies (name, description) VALUES
('TechCorp AB', 'Ett innovativt tech-företag med fokus på AI och maskininlärning'),
('Healthcare Solutions', 'Vårdlösningar för framtiden med digitala innovationer'),
('Green Energy Co', 'Hållbara energilösningar för en grönare framtid'),
('Digital Marketing Pro', 'Digital marknadsföring och webbutveckling'),
('Construction Plus', 'Byggföretag med fokus på hållbara material'),
('Food & Beverage Ltd', 'Restaurangkedja med fokus på lokal mat'),
('Transport Solutions', 'Logistik och transportlösningar'),
('Education First', 'Digitala utbildningslösningar'),
('Finance Forward', 'Fintech-lösningar för framtiden'),
('Retail Revolution', 'E-handel och fysiska butiker');

-- 20. Lägg till team för varje företag
INSERT INTO teams (name, color, company_id, description) VALUES
-- TechCorp AB
('Utvecklingsteam', '#007AFF', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'Huvudutvecklingsteam för AI-projekt'),
('Design Team', '#FF6B6B', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'UX/UI Design och användarupplevelse'),
('QA Team', '#4ECDC4', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'Kvalitetssäkring och testning'),
('DevOps Team', '#45B7D1', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'Infrastruktur och deployment'),

-- Healthcare Solutions
('Vårdteam A', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Healthcare Solutions'), 'Primärvård och akutvård'),
('Vårdteam B', '#45B7D1', (SELECT id FROM companies WHERE name = 'Healthcare Solutions'), 'Specialvård och specialistbehandling'),
('IT Support', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Healthcare Solutions'), 'IT-stöd för vårdsystem'),
('Administration', '#007AFF', (SELECT id FROM companies WHERE name = 'Healthcare Solutions'), 'Administrativt team'),

-- Green Energy Co
('Solarteam', '#FFD93D', (SELECT id FROM companies WHERE name = 'Green Energy Co'), 'Solenergi-installationer'),
('Vindteam', '#6BCF7F', (SELECT id FROM companies WHERE name = 'Green Energy Co'), 'Vindkraft-projekt'),
('Tekniskt Team', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Green Energy Co'), 'Teknisk support'),
('Säljteam', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Green Energy Co'), 'Försäljning och kundservice'),

-- Digital Marketing Pro
('Kreativt Team', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Digital Marketing Pro'), 'Grafisk design och kreativt arbete'),
('Webbutveckling', '#007AFF', (SELECT id FROM companies WHERE name = 'Digital Marketing Pro'), 'Webb- och apputveckling'),
('SEO Team', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Digital Marketing Pro'), 'SEO och digital marknadsföring'),
('Kundservice', '#45B7D1', (SELECT id FROM companies WHERE name = 'Digital Marketing Pro'), 'Kundsupport och kommunikation'),

-- Construction Plus
('Byggteam A', '#8B4513', (SELECT id FROM companies WHERE name = 'Construction Plus'), 'Huvudbyggteam'),
('Byggteam B', '#D2691E', (SELECT id FROM companies WHERE name = 'Construction Plus'), 'Specialiserat byggteam'),
('Elektriker', '#FFD700', (SELECT id FROM companies WHERE name = 'Construction Plus'), 'Elektriska installationer'),
('VVS-team', '#4169E1', (SELECT id FROM companies WHERE name = 'Construction Plus'), 'Värmesystem och ventilation'),

-- Food & Beverage Ltd
('Köksteam A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Food & Beverage Ltd'), 'Huvudkök'),
('Köksteam B', '#FF8C00', (SELECT id FROM companies WHERE name = 'Food & Beverage Ltd'), 'Specialkök'),
('Serviceteam', '#32CD32', (SELECT id FROM companies WHERE name = 'Food & Beverage Ltd'), 'Kundservice och servering'),
('Administration', '#007AFF', (SELECT id FROM companies WHERE name = 'Food & Beverage Ltd'), 'Restaurangadministration'),

-- Transport Solutions
('Chaufförer A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Transport Solutions'), 'Huvudchaufförer'),
('Chaufförer B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Transport Solutions'), 'Specialtransporter'),
('Logistikteam', '#45B7D1', (SELECT id FROM companies WHERE name = 'Transport Solutions'), 'Logistik och planering'),
('Tekniskt Support', '#007AFF', (SELECT id FROM companies WHERE name = 'Transport Solutions'), 'Fordonsteknik'),

-- Education First
('Lärarteam A', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Education First'), 'Huvudlärare'),
('Lärarteam B', '#45B7D1', (SELECT id FROM companies WHERE name = 'Education First'), 'Speciallärare'),
('IT Support', '#007AFF', (SELECT id FROM companies WHERE name = 'Education First'), 'Digitala lösningar'),
('Administration', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Education First'), 'Skoladministration'),

-- Finance Forward
('Analysteam', '#007AFF', (SELECT id FROM companies WHERE name = 'Finance Forward'), 'Finansiell analys'),
('Kundservice', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Finance Forward'), 'Kundsupport'),
('IT Development', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Finance Forward'), 'Fintech-utveckling'),
('Compliance', '#45B7D1', (SELECT id FROM companies WHERE name = 'Finance Forward'), 'Regelverk och compliance'),

-- Retail Revolution
('Butiksteam A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Retail Revolution'), 'Huvudbutik'),
('Butiksteam B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Retail Revolution'), 'Specialbutik'),
('E-handel', '#007AFF', (SELECT id FROM companies WHERE name = 'Retail Revolution'), 'Online-försäljning'),
('Lagerteam', '#45B7D1', (SELECT id FROM companies WHERE name = 'Retail Revolution'), 'Lager och logistik');

-- 21. Funktion för att generera skift för ett team under en period
CREATE OR REPLACE FUNCTION generate_shifts_for_team(
    p_team_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS VOID AS $$
DECLARE
    current_date DATE;
    shift_pattern TEXT[];
    shift_index INTEGER;
    shift_type TEXT;
    start_time TIME;
    end_time TIME;
    hours_worked DECIMAL(4,2);
BEGIN
    -- Definiera skiftmönster för olika team
    CASE 
        WHEN p_team_id IN (SELECT id FROM teams WHERE name LIKE '%Utvecklingsteam%' OR name LIKE '%Design Team%' OR name LIKE '%QA Team%' OR name LIKE '%DevOps Team%') THEN
            shift_pattern := ARRAY['morgon', 'morgon', 'morgon', 'morgon', 'morgon', 'ledig', 'ledig'];
        WHEN p_team_id IN (SELECT id FROM teams WHERE name LIKE '%Vårdteam%') THEN
            shift_pattern := ARRAY['morgon', 'kväll', 'natt', 'morgon', 'kväll', 'helg', 'ledig'];
        WHEN p_team_id IN (SELECT id FROM teams WHERE name LIKE '%Köksteam%' OR name LIKE '%Serviceteam%') THEN
            shift_pattern := ARRAY['morgon', 'kväll', 'kväll', 'morgon', 'kväll', 'helg', 'ledig'];
        WHEN p_team_id IN (SELECT id FROM teams WHERE name LIKE '%Chaufförer%') THEN
            shift_pattern := ARRAY['morgon', 'kväll', 'morgon', 'kväll', 'morgon', 'ledig', 'ledig'];
        WHEN p_team_id IN (SELECT id FROM teams WHERE name LIKE '%Lärarteam%') THEN
            shift_pattern := ARRAY['morgon', 'morgon', 'morgon', 'morgon', 'morgon', 'ledig', 'ledig'];
        ELSE
            shift_pattern := ARRAY['morgon', 'morgon', 'morgon', 'morgon', 'morgon', 'ledig', 'ledig'];
    END CASE;

    current_date := p_start_date;
    shift_index := 1;

    WHILE current_date <= p_end_date LOOP
        -- Hoppa över helger för vissa team
        IF EXTRACT(DOW FROM current_date) IN (6, 0) AND 
           p_team_id NOT IN (SELECT id FROM teams WHERE name LIKE '%Vårdteam%' OR name LIKE '%Köksteam%' OR name LIKE '%Serviceteam%') THEN
            shift_type := 'ledig';
            start_time := NULL;
            end_time := NULL;
            hours_worked := 0.0;
        ELSE
            shift_type := shift_pattern[shift_index];
            
            -- Sätt tider baserat på skifttyp
            CASE shift_type
                WHEN 'morgon' THEN
                    start_time := '08:00';
                    end_time := '16:00';
                    hours_worked := 8.0;
                WHEN 'kväll' THEN
                    start_time := '16:00';
                    end_time := '00:00';
                    hours_worked := 8.0;
                WHEN 'natt' THEN
                    start_time := '00:00';
                    end_time := '08:00';
                    hours_worked := 8.0;
                WHEN 'helg' THEN
                    start_time := '08:00';
                    end_time := '16:00';
                    hours_worked := 8.0;
                ELSE -- ledig
                    start_time := NULL;
                    end_time := NULL;
                    hours_worked := 0.0;
            END CASE;
        END IF;

        -- Lägg till skift
        INSERT INTO shifts (date, shift_type, team_id, start_time, end_time, hours_worked, notes)
        VALUES (current_date, shift_type, p_team_id, start_time, end_time, hours_worked, 
                CASE 
                    WHEN shift_type = 'ledig' THEN 'Ledig dag'
                    ELSE 'Arbetsdag'
                END);

        current_date := current_date + INTERVAL '1 day';
        shift_index := (shift_index % array_length(shift_pattern, 1)) + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 22. Generera skift för alla team från 2020-2030
DO $$
DECLARE
    team_record RECORD;
    start_date DATE := '2020-01-01';
    end_date DATE := '2030-12-31';
BEGIN
    FOR team_record IN SELECT id FROM teams LOOP
        PERFORM generate_shifts_for_team(team_record.id, start_date, end_date);
    END LOOP;
END $$;

-- 23. Aktivera real-time för alla tabeller
-- Gå till Supabase Dashboard -> Database -> Replication
-- Aktivera real-time för alla tabeller: companies, teams, team_members, chat_messages, online_status, profiles, shifts

-- 24. Verifiering
-- Kör denna query för att kontrollera att allt fungerar:
-- SELECT 
--   c.name as company_name,
--   t.name as team_name,
--   COUNT(s.id) as total_shifts,
--   MIN(s.date) as first_shift,
--   MAX(s.date) as last_shift
-- FROM companies c
-- JOIN teams t ON c.id = t.company_id
-- LEFT JOIN shifts s ON t.id = s.team_id
-- GROUP BY c.name, t.name
-- ORDER BY c.name, t.name; 