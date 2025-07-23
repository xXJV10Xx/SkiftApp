-- 🇸🇪 Svenska Företag och Skiftscheman Setup

-- 1. Rensa befintliga tabeller
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
  industry TEXT,
  location TEXT,
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
  shift_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skapa Shifts tabell
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

-- 5. Enable RLS och skapa policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 6. Lägg till svenska företag
INSERT INTO companies (name, description, industry, location) VALUES
-- Stål och Metall
('SSAB', 'Stålproduktion och stålprodukter', 'Stålindustri', 'Stockholm'),
('Outokumpu', 'Rostfritt stål och speciallegeringar', 'Stålindustri', 'Helsingborg'),
('Sandvik', 'Verktyg, maskiner och material', 'Verktygsindustri', 'Sandviken'),

-- Biltillverkning
('Volvo Cars', 'Biltillverkning', 'Bilindustri', 'Göteborg'),
('Volvo Trucks', 'Lastbilstillverkning', 'Bilindustri', 'Göteborg'),
('Scania', 'Lastbilar och bussar', 'Bilindustri', 'Södertälje'),

-- IT och Telekom
('Ericsson', 'Telekommunikation och nätverk', 'IT/Telekom', 'Stockholm'),
('Spotify', 'Musikstreaming och digital media', 'IT/Media', 'Stockholm'),
('Klarna', 'Digital betalningslösningar', 'Fintech', 'Stockholm'),

-- Skogsindustri
('SCA', 'Skogsindustri och pappersprodukter', 'Skogsindustri', 'Sundsvall'),
('Stora Enso', 'Förpackningar och biomaterial', 'Skogsindustri', 'Helsingfors'),
('Holmen', 'Papper och förpackningar', 'Skogsindustri', 'Stockholm'),

-- Kemisk industri
('AkzoNobel', 'Färger och beläggningar', 'Kemisk industri', 'Amsterdam'),
('Perstorp', 'Specialkemikalier', 'Kemisk industri', 'Perstorp'),
('Nouryon', 'Kemikalier för industrier', 'Kemisk industri', 'Amsterdam'),

-- Energi
('Vattenfall', 'Elproduktion och energilösningar', 'Energi', 'Stockholm'),
('E.ON', 'El- och gasdistribution', 'Energi', 'Malmö'),
('Fortum', 'Energi och värmeproduktion', 'Energi', 'Stockholm'),

-- Sjukvård
('Karolinska Universitetssjukhuset', 'Akademiskt sjukhus', 'Sjukvård', 'Stockholm'),
('Sahlgrenska Universitetssjukhuset', 'Universitetssjukhus', 'Sjukvård', 'Göteborg'),
('Skåne Universitetssjukhus', 'Universitetssjukhus', 'Sjukvård', 'Lund'),

-- Transport
('SJ', 'Tågtrafik', 'Transport', 'Stockholm'),
('SL', 'Kollektivtrafik Stockholm', 'Transport', 'Stockholm'),
('Skånetrafiken', 'Kollektivtrafik Skåne', 'Transport', 'Malmö'),

-- Livsmedel
('Arla Foods', 'Mjölkprodukter', 'Livsmedel', 'Stockholm'),
('ICA', 'Matvarukedja', 'Livsmedel', 'Solna'),
('Lantmännen', 'Jordbruk och livsmedel', 'Livsmedel', 'Stockholm'),

-- Bygg
('Skanska', 'Bygg och fastigheter', 'Bygg', 'Stockholm'),
('NCC', 'Bygg och fastigheter', 'Bygg', 'Solna'),
('Peab', 'Bygg och anläggning', 'Bygg', 'Försäljningskontor'),

-- Bank och Finans
('SEB', 'Bank och finans', 'Bank', 'Stockholm'),
('Handelsbanken', 'Bank och finans', 'Bank', 'Stockholm'),
('Nordea', 'Bank och finans', 'Bank', 'Stockholm'),

-- Telekom
('Telia', 'Telekommunikation', 'Telekom', 'Stockholm'),
('Tele2', 'Telekommunikation', 'Telekom', 'Stockholm'),
('Telenor', 'Telekommunikation', 'Telekom', 'Stockholm'),

-- Försäkring
('Folksam', 'Försäkring', 'Försäkring', 'Stockholm'),
('Länsförsäkringar', 'Försäkring', 'Försäkring', 'Stockholm'),
('Trygg-Hansa', 'Försäkring', 'Försäkring', 'Stockholm'),

-- Media
('SVT', 'Public service TV', 'Media', 'Stockholm'),
('Sveriges Radio', 'Public service radio', 'Media', 'Stockholm'),
('Dagens Nyheter', 'Dagstidning', 'Media', 'Stockholm');

-- 7. Lägg till team för varje företag med riktiga skiftscheman
INSERT INTO teams (name, color, company_id, description, shift_pattern) VALUES
-- SSAB - 3-skift system
('Produktion A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion morgon', '3-skift'),
('Produktion B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion kväll', '3-skift'),
('Produktion C', '#45B7D1', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion natt', '3-skift'),
('Underhåll', '#007AFF', (SELECT id FROM companies WHERE name = 'SSAB'), 'Tekniskt underhåll', 'dagskift'),

-- Volvo Cars - 2-skift system
('Montering A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Montering morgon', '2-skift'),
('Montering B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Montering kväll', '2-skift'),
('Kvalitet', '#45B7D1', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Kvalitetskontroll', 'dagskift'),
('Logistik', '#007AFF', (SELECT id FROM companies WHERE name = 'Volvo Cars'), 'Materialhantering', 'dagskift'),

-- Ericsson - Flexibelt system
('Utveckling', '#007AFF', (SELECT id FROM companies WHERE name = 'Ericsson'), 'Mjukvaruutveckling', 'flexibelt'),
('Testning', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Ericsson'), 'Systemtestning', 'flexibelt'),
('Support', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Ericsson'), 'Kundsupport', '24/7'),
('Nätverk', '#45B7D1', (SELECT id FROM companies WHERE name = 'Ericsson'), 'Nätverksövervakning', '24/7'),

-- SCA - Skogsindustri
('Pappersmaskin A', '#8B4513', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion morgon', '3-skift'),
('Pappersmaskin B', '#D2691E', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion kväll', '3-skift'),
('Pappersmaskin C', '#FFD700', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion natt', '3-skift'),
('Skogsbruk', '#228B22', (SELECT id FROM companies WHERE name = 'SCA'), 'Skogsarbete', 'dagskift'),

-- Vattenfall - Energi
('Kraftverk A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Kraftproduktion morgon', '3-skift'),
('Kraftverk B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Kraftproduktion kväll', '3-skift'),
('Kraftverk C', '#45B7D1', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Kraftproduktion natt', '3-skift'),
('Underhåll', '#007AFF', (SELECT id FROM companies WHERE name = 'Vattenfall'), 'Tekniskt underhåll', 'dagskift'),

-- Karolinska - Sjukvård
('Akutmottagning', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'Akutvård', '24/7'),
('Intensivvård', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'Intensivvård', '24/7'),
('Kirurgi', '#45B7D1', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'Kirurgisk vård', 'dagskift'),
('Laboratorium', '#007AFF', (SELECT id FROM companies WHERE name = 'Karolinska Universitetssjukhuset'), 'Laboratoriearbete', 'dagskift'),

-- SJ - Transport
('Lokförare A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SJ'), 'Lokförare morgon', '3-skift'),
('Lokförare B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SJ'), 'Lokförare kväll', '3-skift'),
('Lokförare C', '#45B7D1', (SELECT id FROM companies WHERE name = 'SJ'), 'Lokförare natt', '3-skift'),
('Underhåll', '#007AFF', (SELECT id FROM companies WHERE name = 'SJ'), 'Fordonunderhåll', 'dagskift'),

-- Arla - Livsmedel
('Produktion A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Mjölkproduktion morgon', '3-skift'),
('Produktion B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Mjölkproduktion kväll', '3-skift'),
('Produktion C', '#45B7D1', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Mjölkproduktion natt', '3-skift'),
('Kvalitet', '#007AFF', (SELECT id FROM companies WHERE name = 'Arla Foods'), 'Kvalitetskontroll', 'dagskift'),

-- Skanska - Bygg
('Byggteam A', '#8B4513', (SELECT id FROM companies WHERE name = 'Skanska'), 'Byggarbete morgon', 'dagskift'),
('Byggteam B', '#D2691E', (SELECT id FROM companies WHERE name = 'Skanska'), 'Byggarbete kväll', 'kvällsskift'),
('Elektriker', '#FFD700', (SELECT id FROM companies WHERE name = 'Skanska'), 'Elektriska installationer', 'dagskift'),
('VVS', '#4169E1', (SELECT id FROM companies WHERE name = 'Skanska'), 'Värmesystem', 'dagskift'),

-- Telia - Telekom
('Nätverk A', '#007AFF', (SELECT id FROM companies WHERE name = 'Telia'), 'Nätverksövervakning morgon', '3-skift'),
('Nätverk B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Telia'), 'Nätverksövervakning kväll', '3-skift'),
('Nätverk C', '#45B7D1', (SELECT id FROM companies WHERE name = 'Telia'), 'Nätverksövervakning natt', '3-skift'),
('Kundservice', '#FF6B6B', (SELECT id FROM companies WHERE name = 'Telia'), 'Kundsupport', '24/7');

-- 8. Funktion för att generera skift baserat på mönster
CREATE OR REPLACE FUNCTION generate_swedish_shifts(
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
    day_of_week INTEGER;
BEGIN
    -- Hämta skiftmönster för teamet
    SELECT t.shift_pattern INTO shift_pattern FROM teams t WHERE t.id = p_team_id;
    
    current_date := p_start_date;
    
    WHILE current_date <= p_end_date LOOP
        day_of_week := EXTRACT(DOW FROM current_date);
        
        -- Bestäm skifttyp baserat på mönster
        CASE shift_pattern
            WHEN '3-skift' THEN
                -- Roterande 3-skift: Morgon, Kväll, Natt, Ledig, Ledig, Ledig, Ledig
                CASE (day_of_week + 1) % 7
                    WHEN 1 THEN shift_type := 'morgon'; start_time := '06:00'; end_time := '14:00';
                    WHEN 2 THEN shift_type := 'kväll'; start_time := '14:00'; end_time := '22:00';
                    WHEN 3 THEN shift_type := 'natt'; start_time := '22:00'; end_time := '06:00';
                    ELSE shift_type := 'ledig'; start_time := NULL; end_time := NULL;
                END CASE;
                
            WHEN '2-skift' THEN
                -- Roterande 2-skift: Morgon, Kväll, Ledig, Ledig, Ledig, Ledig, Ledig
                CASE (day_of_week + 1) % 7
                    WHEN 1 THEN shift_type := 'morgon'; start_time := '06:00'; end_time := '14:00';
                    WHEN 2 THEN shift_type := 'kväll'; start_time := '14:00'; end_time := '22:00';
                    ELSE shift_type := 'ledig'; start_time := NULL; end_time := NULL;
                END CASE;
                
            WHEN 'dagskift' THEN
                -- Måndag-Fredag 08:00-17:00
                IF day_of_week BETWEEN 1 AND 5 THEN
                    shift_type := 'morgon'; start_time := '08:00'; end_time := '17:00';
                ELSE
                    shift_type := 'ledig'; start_time := NULL; end_time := NULL;
                END IF;
                
            WHEN '24/7' THEN
                -- Roterande 24/7: Morgon, Kväll, Natt, Morgon, Kväll, Natt, Ledig
                CASE (day_of_week + 1) % 7
                    WHEN 1 THEN shift_type := 'morgon'; start_time := '06:00'; end_time := '14:00';
                    WHEN 2 THEN shift_type := 'kväll'; start_time := '14:00'; end_time := '22:00';
                    WHEN 3 THEN shift_type := 'natt'; start_time := '22:00'; end_time := '06:00';
                    WHEN 4 THEN shift_type := 'morgon'; start_time := '06:00'; end_time := '14:00';
                    WHEN 5 THEN shift_type := 'kväll'; start_time := '14:00'; end_time := '22:00';
                    WHEN 6 THEN shift_type := 'natt'; start_time := '22:00'; end_time := '06:00';
                    ELSE shift_type := 'ledig'; start_time := NULL; end_time := NULL;
                END CASE;
                
            WHEN 'flexibelt' THEN
                -- Flexibelt: Måndag-Fredag 09:00-17:00
                IF day_of_week BETWEEN 1 AND 5 THEN
                    shift_type := 'morgon'; start_time := '09:00'; end_time := '17:00';
                ELSE
                    shift_type := 'ledig'; start_time := NULL; end_time := NULL;
                END IF;
                
            ELSE
                -- Standard: Måndag-Fredag 08:00-16:00
                IF day_of_week BETWEEN 1 AND 5 THEN
                    shift_type := 'morgon'; start_time := '08:00'; end_time := '16:00';
                ELSE
                    shift_type := 'ledig'; start_time := NULL; end_time := NULL;
                END IF;
        END CASE;
        
        -- Sätt arbetade timmar
        IF shift_type = 'ledig' THEN
            hours_worked := 0.0;
        ELSE
            hours_worked := 8.0;
        END IF;
        
        -- Lägg till skift
        INSERT INTO shifts (date, shift_type, team_id, start_time, end_time, hours_worked, notes)
        VALUES (current_date, shift_type, p_team_id, start_time, end_time, hours_worked, 
                CASE 
                    WHEN shift_type = 'ledig' THEN 'Ledig dag'
                    ELSE 'Arbetsdag - ' || shift_type
                END);
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Generera skift för alla team från 2020-2030
DO $$
DECLARE
    team_record RECORD;
    start_date DATE := '2020-01-01';
    end_date DATE := '2030-12-31';
BEGIN
    FOR team_record IN SELECT id FROM teams LOOP
        PERFORM generate_swedish_shifts(team_record.id, start_date, end_date);
    END LOOP;
END $$;

-- 10. Aktivera real-time
-- Gå till Supabase Dashboard -> Database -> Replication
-- Aktivera real-time för: companies, teams, shifts

-- 11. Verifiering
-- Kör denna query för att se statistik:
-- SELECT 
--   c.name as company_name,
--   t.name as team_name,
--   t.shift_pattern,
--   COUNT(s.id) as total_shifts,
--   MIN(s.date) as first_shift,
--   MAX(s.date) as last_shift
-- FROM companies c
-- JOIN teams t ON c.id = t.company_id
-- LEFT JOIN shifts s ON t.id = s.team_id
-- GROUP BY c.name, t.name, t.shift_pattern
-- ORDER BY c.name, t.name; 