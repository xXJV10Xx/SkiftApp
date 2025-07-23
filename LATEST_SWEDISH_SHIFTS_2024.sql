-- 🇸🇪 LATEST SWEDISH SHIFTS 2024-2025 - Complete Database Setup
-- This script contains the most up-to-date Swedish companies and shift patterns

-- 1. Clean existing tables
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS online_status CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create Companies table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  location TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT,
  shift_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Shifts table
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morgon', 'kväll', 'natt', 'helg', 'ledig', 'övertid')),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIME,
  end_time TIME,
  hours_worked DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Team Members table
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- 7. Create Chat Messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Online Status table
CREATE TABLE online_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 9. Enable RLS for all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
-- Companies policies
CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies can be created by authenticated users" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Teams policies
CREATE POLICY "Teams are viewable by authenticated users" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teams can be created by authenticated users" ON teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Shifts policies
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
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = shifts.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Profiles policies
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

-- Team Members policies
CREATE POLICY "Team members can view their own memberships" ON team_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join teams" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members
  FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages policies
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

-- Online Status policies
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

-- 11. Insert latest Swedish companies (2024-2025)
INSERT INTO companies (name, description, industry, location) VALUES
-- Stål och Metall (2024)
('SSAB', 'Stålproduktion och stålprodukter - H2 Green Steel partner', 'Stålindustri', 'Stockholm'),
('Outokumpu', 'Rostfritt stål och speciallegeringar - Hållbar produktion', 'Stålindustri', 'Helsingborg'),
('Sandvik', 'Verktyg, maskiner och material - Digital transformation', 'Verktygsindustri', 'Sandviken'),
('Höganäs', 'Metallpulver och komponenter - Additiv tillverkning', 'Metallindustri', 'Höganäs'),

-- Biltillverkning (2024)
('Volvo Cars', 'Biltillverkning - Elektriska fordon', 'Bilindustri', 'Göteborg'),
('Volvo Trucks', 'Lastbilstillverkning - Autonoma fordon', 'Bilindustri', 'Göteborg'),
('Scania', 'Lastbilar och bussar - Elektrifiering', 'Bilindustri', 'Södertälje'),
('Polestar', 'Premium elektriska bilar', 'Bilindustri', 'Göteborg'),

-- IT och Tech (2024)
('Ericsson', '5G och 6G nätverk - AI och IoT', 'IT/Telekom', 'Stockholm'),
('Spotify', 'Musikstreaming och podcast - AI-rekommendationer', 'IT/Media', 'Stockholm'),
('Klarna', 'Buy now pay later - Fintech innovation', 'Fintech', 'Stockholm'),
('Northvolt', 'Batteritillverkning - Grön energi', 'Batteriindustri', 'Skellefteå'),
('Tink', 'Open banking - Fintech', 'Fintech', 'Stockholm'),

-- Skogsindustri (2024)
('SCA', 'Skogsindustri och pappersprodukter - Hållbart skogsbruk', 'Skogsindustri', 'Sundsvall'),
('Stora Enso', 'Förpackningar och biomaterial - Cirkulär ekonomi', 'Skogsindustri', 'Helsingfors'),
('Holmen', 'Papper och förpackningar - FSC-certifierat', 'Skogsindustri', 'Stockholm'),
('Södra', 'Skogsägare kooperativ - Bioekonomi', 'Skogsindustri', 'Växjö'),

-- Kemisk industri (2024)
('AkzoNobel', 'Färger och beläggningar - Hållbara lösningar', 'Kemisk industri', 'Amsterdam'),
('Perstorp', 'Specialkemikalier - Cirkulära material', 'Kemisk industri', 'Perstorp'),
('Nouryon', 'Kemikalier för industrier - Grön kemi', 'Kemisk industri', 'Amsterdam'),
('Borealis', 'Polymerer och kemikalier - Cirkulär ekonomi', 'Kemisk industri', 'Stenungsund'),

-- Energi (2024)
('Vattenfall', 'Elproduktion och energilösningar - Fossilfri energi', 'Energi', 'Stockholm'),
('E.ON', 'El- och gasdistribution - Smart grid', 'Energi', 'Malmö'),
('Fortum', 'Energi och värmeproduktion - Cirkulär energi', 'Energi', 'Stockholm'),
('Svea Solar', 'Solenergi installationer - Grön energi', 'Solenergi', 'Stockholm'),

-- Sjukvård (2024)
('Karolinska Universitetssjukhuset', 'Akademiskt sjukhus - AI i vården', 'Sjukvård', 'Stockholm'),
('Sahlgrenska Universitetssjukhuset', 'Universitetssjukhus - Digital vård', 'Sjukvård', 'Göteborg'),
('Skåne Universitetssjukhus', 'Universitetssjukhus - Telemedicin', 'Sjukvård', 'Lund'),
('Region Stockholm', 'Primärvård - Digital vårdplattform', 'Sjukvård', 'Stockholm'),

-- Transport (2024)
('SJ', 'Tågtrafik - Elektrifierade tåg', 'Transport', 'Stockholm'),
('SL', 'Kollektivtrafik Stockholm - Hållbar mobilitet', 'Transport', 'Stockholm'),
('Skånetrafiken', 'Kollektivtrafik Skåne - Elektrifiering', 'Transport', 'Malmö'),
('MTR', 'Tunnelbanan Stockholm - Automatisering', 'Transport', 'Stockholm'),

-- Livsmedel (2024)
('Arla Foods', 'Mjölkprodukter - Hållbar mjölkproduktion', 'Livsmedel', 'Stockholm'),
('ICA', 'Matvarukedja - Digital handel', 'Livsmedel', 'Solna'),
('Lantmännen', 'Jordbruk och livsmedel - Hållbart jordbruk', 'Livsmedel', 'Stockholm'),
('Oatly', 'Havredrycker - Plant-based produkter', 'Livsmedel', 'Malmö'),

-- Bygg (2024)
('Skanska', 'Bygg och fastigheter - Hållbart byggande', 'Bygg', 'Stockholm'),
('NCC', 'Bygg och fastigheter - Digital byggprocess', 'Bygg', 'Solna'),
('Peab', 'Bygg och anläggning - Grön byggnad', 'Bygg', 'Försäljningskontor'),
('Veidekke', 'Bygg och anläggning - Hållbar utveckling', 'Bygg', 'Stockholm'),

-- Bank och Finans (2024)
('SEB', 'Bank och finans - Digital banking', 'Bank', 'Stockholm'),
('Handelsbanken', 'Bank och finans - Hållbar finans', 'Bank', 'Stockholm'),
('Nordea', 'Bank och finans - Green finance', 'Bank', 'Stockholm'),
('Swedbank', 'Bank och finans - Digital transformation', 'Bank', 'Stockholm'),

-- Telekom (2024)
('Telia', 'Telekommunikation - 5G utbyggnad', 'Telekom', 'Stockholm'),
('Tele2', 'Telekommunikation - Fiber nätverk', 'Telekom', 'Stockholm'),
('Telenor', 'Telekommunikation - IoT lösningar', 'Telekom', 'Stockholm'),
('Com Hem', 'Kabel-TV och internet - Gigabit nätverk', 'Telekom', 'Stockholm'),

-- Försäkring (2024)
('Folksam', 'Försäkring - Digital försäkring', 'Försäkring', 'Stockholm'),
('Länsförsäkringar', 'Försäkring - Hållbar försäkring', 'Försäkring', 'Stockholm'),
('Trygg-Hansa', 'Försäkring - Digital transformation', 'Försäkring', 'Stockholm'),
('If', 'Försäkring - Smart försäkring', 'Försäkring', 'Stockholm'),

-- Media (2024)
('SVT', 'Public service TV - Digital media', 'Media', 'Stockholm'),
('Sveriges Radio', 'Public service radio - Podcast', 'Media', 'Stockholm'),
('Dagens Nyheter', 'Dagstidning - Digital journalism', 'Media', 'Stockholm'),
('Aftonbladet', 'Dagstidning - Digital media', 'Media', 'Stockholm');

-- 12. Insert teams for each company with modern shift patterns
INSERT INTO teams (name, color, company_id, description, shift_pattern) VALUES
-- SSAB - Modern 3-shift system with sustainability focus
('Produktion A - Morgon', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SSAB'), 'H2 Green Steel produktion morgon', '3-skift'),
('Produktion B - Kväll', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SSAB'), 'H2 Green Steel produktion kväll', '3-skift'),
('Produktion C - Natt', '#45B7D1', (SELECT id FROM companies WHERE name = 'SSAB'), 'H2 Green Steel produktion natt', '3-skift'),
('Underhåll - Digital', '#007AFF', (SELECT id FROM companies WHERE name = 'SSAB'), 'Predictive maintenance', 'dagskift'),

-- Volvo Cars - Electric vehicle production
('Montering A - EV', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Elektrisk biltillverkning morgon', '2-skift'),
('Montering B - EV', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Elektrisk biltillverkning kväll', '2-skift'),
('Kvalitet - Digital', '#45B7D1', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'AI-driven kvalitetskontroll', 'dagskift'),
('Logistik - Smart', '#007AFF', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Automatiserad logistik', 'dagskift'),

-- Ericsson - 5G and AI focus
('5G Utveckling', '#007AFF', (SELECT id FROM companies WHERE name = 'Ericsson'), '5G/6G nätverksutveckling', 'flexibelt'),
('AI/ML Team', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Ericsson'), 'AI och maskininlärning', 'flexibelt'),
('Support - Global', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Ericsson'), 'Global kundsupport', '24/7'),
('Nätverk - IoT', '#45B7D1', (SELECT id FROM companies WHERE name = 'Ericsson'), 'IoT och edge computing', '24/7'),

-- Northvolt - Battery production
('Batteriproduktion A', '#8B4513', (SELECT id FROM companies WHERE name = 'Northvolt'), 'Battericeller morgon', '3-skift'),
('Batteriproduktion B', '#D2691E', (SELECT id FROM companies WHERE name = 'Northvolt'), 'Battericeller kväll', '3-skift'),
('Batteriproduktion C', '#FFD700', (SELECT id FROM companies WHERE name = 'Northvolt'), 'Battericeller natt', '3-skift'),
('R&D - Grön Teknik', '#228B22', (SELECT id FROM companies WHERE name = 'Northvolt'), 'Hållbar batteriteknik', 'dagskift'),

-- SCA - Sustainable forestry
('Pappersmaskin A - Hållbar', '#8B4513', (SELECT id FROM companies WHERE name = 'SCA'), 'Hållbar pappersproduktion morgon', '3-skift'),
('Pappersmaskin B - Hållbar', '#D2691E', (SELECT id FROM companies WHERE name = 'SCA'), 'Hållbar pappersproduktion kväll', '3-skift'),
('Pappersmaskin C - Hållbar', '#FFD700', (SELECT id FROM companies WHERE name = 'SCA'), 'Hållbar pappersproduktion natt', '3-skift'),
('Skogsbruk - Digital', '#228B22', (SELECT id FROM companies WHERE name = 'SCA'), 'Digital skogsplanering', 'dagskift'),

-- Vattenfall - Fossil-free energy
('Kraftverk A - Fossilfri', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Vindkraft produktion morgon', '3-skift'),
('Kraftverk B - Fossilfri', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Vindkraft produktion kväll', '3-skift'),
('Kraftverk C - Fossilfri', '#45B7D1', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Vindkraft produktion natt', '3-skift'),
('Underhåll - Smart Grid', '#007AFF', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Smart grid underhåll', 'dagskift'),

-- Karolinska - AI in healthcare
('Akutmottagning - AI', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'AI-driven akutvård', '24/7'),
('Intensivvård - Digital', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'Digital intensivvård', '24/7'),
('Kirurgi - Robotik', '#45B7D1', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'Robotassisterad kirurgi', 'dagskift'),
('Laboratorium - AI', '#007AFF', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'AI-driven diagnostik', 'dagskift'),

-- SJ - Electric trains
('Lokförare A - El', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SJ'), 'Elektriska tåg morgon', '3-skift'),
('Lokförare B - El', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SJ'), 'Elektriska tåg kväll', '3-skift'),
('Lokförare C - El', '#45B7D1', (SELECT id FROM companies WHERE name = 'SJ'), 'Elektriska tåg natt', '3-skift'),
('Underhåll - Digital', '#007AFF', (SELECT id FROM companies WHERE name = 'SJ'), 'Predictive maintenance', 'dagskift'),

-- Arla - Sustainable dairy
('Produktion A - Hållbar', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Hållbar mjölkproduktion morgon', '3-skift'),
('Produktion B - Hållbar', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Hållbar mjölkproduktion kväll', '3-skift'),
('Produktion C - Hållbar', '#45B7D1', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Hållbar mjölkproduktion natt', '3-skift'),
('Kvalitet - Digital', '#007AFF', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Digital kvalitetskontroll', 'dagskift'),

-- Skanska - Sustainable building
('Byggteam A - Hållbart', '#8B4513', (SELECT id FROM companies WHERE name = 'Skanska'), 'Hållbart byggande morgon', 'dagskift'),
('Byggteam B - Hållbart', '#D2691E', (SELECT id FROM companies WHERE name = 'Skanska'), 'Hållbart byggande kväll', 'kvällsskift'),
('Elektriker - Smart', '#FFD700', (SELECT id FROM companies WHERE name = 'Skanska'), 'Smart elektriska system', 'dagskift'),
('VVS - Grön', '#4169E1', (SELECT id FROM companies WHERE name = 'Skanska'), 'Gröna värmesystem', 'dagskift'),

-- Telia - 5G and IoT
('Nätverk A - 5G', '#007AFF', (SELECT id FROM companies WHERE name = 'Telia'), '5G nätverksövervakning morgon', '3-skift'),
('Nätverk B - 5G', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Telia'), '5G nätverksövervakning kväll', '3-skift'),
('Nätverk C - 5G', '#45B7D1', (SELECT id FROM companies WHERE name = 'Telia'), '5G nätverksövervakning natt', '3-skift'),
('Kundservice - AI', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Telia'), 'AI-driven kundsupport', '24/7');

-- 13. Create function to generate modern Swedish shifts (2024-2025)
CREATE OR REPLACE FUNCTION generate_modern_swedish_shifts(
    p_team_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS VOID AS $$
DECLARE
    current_date DATE;
    shift_pattern TEXT;
    shift_type TEXT;
    start_time TIME;
    end_time TIME;
    hours_worked DECIMAL(4,2);
BEGIN
    -- Get team shift pattern
    SELECT shift_pattern INTO shift_pattern FROM teams WHERE id = p_team_id;
    
    current_date := p_start_date;
    
    WHILE current_date <= p_end_date LOOP
        -- Determine shift type based on pattern and day of week
        CASE shift_pattern
            WHEN '3-skift' THEN
                -- 3-shift system: Morgon (06:00-14:00), Kväll (14:00-22:00), Natt (22:00-06:00)
                CASE EXTRACT(DOW FROM current_date)
                    WHEN 0 THEN -- Sunday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    WHEN 6 THEN -- Saturday
                        shift_type := 'helg';
                        start_time := '08:00';
                        end_time := '16:00';
                        hours_worked := 8.0;
                    ELSE -- Monday-Friday
                        CASE (EXTRACT(DAY FROM current_date) % 3)
                            WHEN 0 THEN
                                shift_type := 'morgon';
                                start_time := '06:00';
                                end_time := '14:00';
                                hours_worked := 8.0;
                            WHEN 1 THEN
                                shift_type := 'kväll';
                                start_time := '14:00';
                                end_time := '22:00';
                                hours_worked := 8.0;
                            ELSE
                                shift_type := 'natt';
                                start_time := '22:00';
                                end_time := '06:00';
                                hours_worked := 8.0;
                        END CASE;
                END CASE;
                
            WHEN '2-skift' THEN
                -- 2-shift system: Morgon (06:00-14:00), Kväll (14:00-22:00)
                CASE EXTRACT(DOW FROM current_date)
                    WHEN 0 THEN -- Sunday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    WHEN 6 THEN -- Saturday
                        shift_type := 'helg';
                        start_time := '08:00';
                        end_time := '16:00';
                        hours_worked := 8.0;
                    ELSE -- Monday-Friday
                        CASE (EXTRACT(DAY FROM current_date) % 2)
                            WHEN 0 THEN
                                shift_type := 'morgon';
                                start_time := '06:00';
                                end_time := '14:00';
                                hours_worked := 8.0;
                            ELSE
                                shift_type := 'kväll';
                                start_time := '14:00';
                                end_time := '22:00';
                                hours_worked := 8.0;
                        END CASE;
                END CASE;
                
            WHEN 'flexibelt' THEN
                -- Flexible schedule for IT/office work
                CASE EXTRACT(DOW FROM current_date)
                    WHEN 0 THEN -- Sunday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    WHEN 6 THEN -- Saturday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    ELSE -- Monday-Friday
                        shift_type := 'morgon';
                        start_time := '09:00';
                        end_time := '17:00';
                        hours_worked := 8.0;
                END CASE;
                
            WHEN '24/7' THEN
                -- 24/7 operations (healthcare, emergency services)
                CASE (EXTRACT(DAY FROM current_date) % 3)
                    WHEN 0 THEN
                        shift_type := 'morgon';
                        start_time := '08:00';
                        end_time := '16:00';
                        hours_worked := 8.0;
                    WHEN 1 THEN
                        shift_type := 'kväll';
                        start_time := '16:00';
                        end_time := '00:00';
                        hours_worked := 8.0;
                    ELSE
                        shift_type := 'natt';
                        start_time := '00:00';
                        end_time := '08:00';
                        hours_worked := 8.0;
                END CASE;
                
            WHEN 'dagskift' THEN
                -- Day shift only
                CASE EXTRACT(DOW FROM current_date)
                    WHEN 0 THEN -- Sunday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    WHEN 6 THEN -- Saturday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    ELSE -- Monday-Friday
                        shift_type := 'morgon';
                        start_time := '08:00';
                        end_time := '17:00';
                        hours_worked := 9.0;
                END CASE;
                
            WHEN 'kvällsskift' THEN
                -- Evening shift only
                CASE EXTRACT(DOW FROM current_date)
                    WHEN 0 THEN -- Sunday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    WHEN 6 THEN -- Saturday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    ELSE -- Monday-Friday
                        shift_type := 'kväll';
                        start_time := '16:00';
                        end_time := '00:00';
                        hours_worked := 8.0;
                END CASE;
                
            ELSE
                -- Default to day shift
                CASE EXTRACT(DOW FROM current_date)
                    WHEN 0 THEN -- Sunday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    WHEN 6 THEN -- Saturday
                        shift_type := 'ledig';
                        start_time := NULL;
                        end_time := NULL;
                        hours_worked := 0;
                    ELSE -- Monday-Friday
                        shift_type := 'morgon';
                        start_time := '08:00';
                        end_time := '17:00';
                        hours_worked := 9.0;
                END CASE;
        END CASE;
        
        -- Insert shift
        INSERT INTO shifts (date, shift_type, team_id, start_time, end_time, hours_worked)
        VALUES (current_date, shift_type, p_team_id, start_time, end_time, hours_worked);
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 14. Generate shifts for all teams for 2024-2025
-- This will create shifts for the next 12 months
SELECT generate_modern_swedish_shifts(
    id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '12 months'
) FROM teams;

-- 15. Create indexes for better performance
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_team_id ON shifts(team_id);
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type);
CREATE INDEX idx_teams_company_id ON teams(company_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_chat_messages_team_id ON chat_messages(team_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- 16. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at 
    BEFORE UPDATE ON shifts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
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

-- 17. Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE online_status;

-- 18. Insert sample profiles for testing
INSERT INTO profiles (id, email, full_name) VALUES
('00000000-0000-0000-0000-000000000001', 'test@skiftappen.se', 'Test Användare'),
('00000000-0000-0000-0000-000000000002', 'admin@skiftappen.se', 'Admin Användare');

-- 19. Insert sample team members for testing
INSERT INTO team_members (user_id, team_id, role) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM teams LIMIT 1), 'member'),
('00000000-0000-0000-0000-000000000002', (SELECT id FROM teams LIMIT 1), 'admin');

-- 20. Insert sample chat messages for testing
INSERT INTO chat_messages (team_id, user_id, message) VALUES
((SELECT id FROM teams LIMIT 1), '00000000-0000-0000-0000-000000000001', 'Hej alla! 👋'),
((SELECT id FROM teams LIMIT 1), '00000000-0000-0000-0000-000000000002', 'Välkommen till laget! 🚀');

-- 21. Insert sample online status for testing
INSERT INTO online_status (user_id, is_online, last_seen) VALUES
('00000000-0000-0000-0000-000000000001', true, NOW()),
('00000000-0000-0000-0000-000000000002', false, NOW() - INTERVAL '1 hour');

-- Success message
SELECT '✅ Database setup complete! Swedish shifts 2024-2025 loaded successfully.' as status; 