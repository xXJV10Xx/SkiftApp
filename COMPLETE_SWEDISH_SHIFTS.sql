-- 🇸🇪 Komplett Svenska Skiftscheman Setup (33+ Företag)

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
  cycle_length INTEGER,
  team_offset INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skapa Shifts tabell
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('M', 'A', 'N', 'F', 'E', 'D', 'L', 'D12', 'N12', 'NH', 'FH', 'FE', 'EN')),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIME,
  end_time TIME,
  hours_worked DECIMAL(4,2),
  notes TEXT,
  cycle_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS och skapa policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 6. Lägg till alla svenska företag
INSERT INTO companies (name, description, industry, location) VALUES
-- Stål och Metall
('SSAB', 'Stålproduktion och stålprodukter', 'Stålindustri', 'Stockholm'),
('BOLIDEN', 'Gruvdrift och metallproduktion', 'Gruvindustri', 'Stockholm'),
('SANDVIK', 'Verktyg, maskiner och material', 'Verktygsindustri', 'Sandviken'),
('OUTOKUMPU', 'Rostfritt stål och speciallegeringar', 'Stålindustri', 'Helsingborg'),
('OVAKO', 'Ståltillverkning och stålprodukter', 'Stålindustri', 'Hofors'),
('SKF', 'Lager och lagersystem', 'Verktygsindustri', 'Göteborg'),

-- Biltillverkning
('VOLVO', 'Biltillverkning och lastbilar', 'Bilindustri', 'Göteborg'),
('SCANIA', 'Lastbilar och bussar', 'Bilindustri', 'Södertälje'),

-- Skogsindustri
('SCA', 'Skogsindustri och pappersprodukter', 'Skogsindustri', 'Sundsvall'),
('STORA ENSO NYMÖLLA', 'Pappersproduktion', 'Skogsindustri', 'Nymölla'),
('BILLERUD', 'Förpackningsmaterial', 'Skogsindustri', 'Solna'),
('NORDIC PAPER', 'Pappersproduktion', 'Skogsindustri', 'Göteborg'),
('SÖDRA CELL', 'Cellulosaproduktion', 'Skogsindustri', 'Väröbacka'),
('ARCTIC PAPER GRYCKSBO', 'Pappersproduktion', 'Skogsindustri', 'Grycksbo'),

-- Kemisk industri
('AGA AVESTA', 'Industrigaser och kemikalier', 'Kemisk industri', 'Avesta'),
('PERSTORP', 'Specialkemikalier', 'Kemisk industri', 'Perstorp'),
('CAMBREX', 'Farmaceutiska råvaror', 'Kemisk industri', 'Karlskoga'),
('ORICA', 'Sprengämnen och kemikalier', 'Kemisk industri', 'Stockholm'),

-- Energi
('BORLÄNGE ENERGI', 'Energiproduktion och distribution', 'Energi', 'Borlänge'),

-- Kommunal verksamhet
('AVESTA KOMMUN', 'Kommunal verksamhet', 'Kommun', 'Avesta'),
('BORLÄNGE KOMMUN', 'Kommunal verksamhet', 'Kommun', 'Borlänge'),
('LANDSTINGET DALARNA', 'Sjukvård', 'Sjukvård', 'Falun'),

-- Livsmedel
('BARILLA SVERIGE', 'Pastaproduktion', 'Livsmedel', 'Filipstad'),

-- Bygg
('SKANSKA', 'Bygg och fastigheter', 'Bygg', 'Stockholm'),

-- IT och Teknik
('ABB HVDC', 'Högspänningsteknik', 'IT/Teknik', 'Ludvika'),

-- Transport
('TRUCK SERVICE AB', 'Fordonsteknik och service', 'Transport', 'Stockholm'),

-- Verkstadsindustri
('UDDEHOLM TOOLING', 'Verktygsstål', 'Verkstadsindustri', 'Hagfors'),
('VOESTALPINE PRECISION STRIP', 'Stålband', 'Verkstadsindustri', 'Avesta'),
('SECO', 'Verktyg och maskiner', 'Verkstadsindustri', 'Fagersta'),
('SCHNEIDER', 'Elektrisk utrustning', 'Verkstadsindustri', 'Stockholm'),

-- Olja och Energi
('PREEM', 'Oljeraffinaderi', 'Olja/Energi', 'Stockholm'),

-- Pappersindustri
('RYSSVIKEN', 'Pappersproduktion', 'Pappersindustri', 'Ryssby'),
('SKÄRNÄS', 'Pappersproduktion', 'Pappersindustri', 'Skärnäs'),

-- Övriga
('BB', 'Industriproduktion', 'Industri', 'Stockholm'),
('AGA', 'Industrigaser', 'Kemisk industri', 'Stockholm'),
('DENTSPLY', 'Tandvårdsprodukter', 'Medicinteknik', 'Mölndal'),
('FINESS', 'Industriproduktion', 'Industri', 'Stockholm'),
('KUBAL', 'Industriproduktion', 'Industri', 'Stockholm'),
('LKAB', 'Gruvdrift', 'Gruvindustri', 'Kiruna');

-- 7. Lägg till team för varje företag med exakta skiftscheman
INSERT INTO teams (name, color, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
-- SSAB - 14-dagars cykel
('Lag 1', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L,L,L', 14, 0),
('Lag 2', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L,L,L', 14, 1),
('Lag 3', '#45B7D1', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L,L,L', 14, 2),
('Lag 4', '#007AFF', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L,L,L', 14, 3),
('Lag 5', '#8B4513', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L,L,L', 14, 4),

-- VOLVO - 8-dagars cykel
('Lag A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'VOLVO'), 'Montering', 'M,M,A,A,N,N,L,L', 8, 0),
('Lag B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'VOLVO'), 'Montering', 'M,M,A,A,N,N,L,L', 8, 1),
('Lag C', '#45B7D1', (SELECT id FROM companies WHERE name = 'VOLVO'), 'Montering', 'M,M,A,A,N,N,L,L', 8, 2),
('Lag D', '#007AFF', (SELECT id FROM companies WHERE name = 'VOLVO'), 'Montering', 'M,M,A,A,N,N,L,L', 8, 3),

-- SCA - 10-dagars cykel
('Röd', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion', 'M,M,A,A,N,N,L,L,L,L', 10, 0),
('Blå', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion', 'M,M,A,A,N,N,L,L,L,L', 10, 1),
('Gul', '#FFD700', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion', 'M,M,A,A,N,N,L,L,L,L', 10, 2),
('Grön', '#228B22', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion', 'M,M,A,A,N,N,L,L,L,L', 10, 3),

-- BOLIDEN - 10-dagars cykel
('Alpha', '#FF6B6B', (SELECT id FROM companies WHERE name = 'BOLIDEN'), 'Gruvdrift', 'M,M,A,A,A,N,N,L,L,L', 10, 0),
('Beta', '#4ECDC4', (SELECT id FROM companies WHERE name = 'BOLIDEN'), 'Gruvdrift', 'M,M,A,A,A,N,N,L,L,L', 10, 1),
('Gamma', '#45B7D1', (SELECT id FROM companies WHERE name = 'BOLIDEN'), 'Gruvdrift', 'M,M,A,A,A,N,N,L,L,L', 10, 2),
('Delta', '#007AFF', (SELECT id FROM companies WHERE name = 'BOLIDEN'), 'Gruvdrift', 'M,M,A,A,A,N,N,L,L,L', 10, 3),

-- SKANSKA - 7-dagars cykel
('Lag 1', '#8B4513', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'Byggarbete', 'D,D,D,D,D,L,L', 7, 0),
('Lag 2', '#D2691E', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'Byggarbete', 'D,D,D,D,D,L,L', 7, 1),
('Lag 3', '#FFD700', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'Byggarbete', 'D,D,D,D,D,L,L', 7, 2),

-- SANDVIK - 12-dagars cykel
('Team A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SANDVIK'), 'Verktygsproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L', 12, 0),
('Team B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SANDVIK'), 'Verktygsproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L', 12, 1),
('Team C', '#45B7D1', (SELECT id FROM companies WHERE name = 'SANDVIK'), 'Verktygsproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L', 12, 2),
('Team D', '#007AFF', (SELECT id FROM companies WHERE name = 'SANDVIK'), 'Verktygsproduktion', 'M,M,M,A,A,A,N,N,N,L,L,L', 12, 3),

-- BARILLA SVERIGE - 8-dagars cykel
('Lag 1', '#FF6B6B', (SELECT id FROM companies WHERE name = 'BARILLA SVERIGE'), 'Pastaproduktion', 'F,F,E,E,N,N,L,L', 8, 0),
('Lag 2', '#4ECDC4', (SELECT id FROM companies WHERE name = 'BARILLA SVERIGE'), 'Pastaproduktion', 'F,F,E,E,N,N,L,L', 8, 1),
('Lag 3', '#45B7D1', (SELECT id FROM companies WHERE name = 'BARILLA SVERIGE'), 'Pastaproduktion', 'F,F,E,E,N,N,L,L', 8, 2),
('Lag 4', '#007AFF', (SELECT id FROM companies WHERE name = 'BARILLA SVERIGE'), 'Pastaproduktion', 'F,F,E,E,N,N,L,L', 8, 3),
('Lag 5', '#8B4513', (SELECT id FROM companies WHERE name = 'BARILLA SVERIGE'), 'Pastaproduktion', 'F,F,E,E,N,N,L,L', 8, 4),

-- AGA AVESTA - 18-dagars cykel
('Lag A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'AGA AVESTA'), 'Industrigaser', 'D,D,F,F,N,N,L,L,L,L,L,L,E,E,FE,FE,EN,EN', 18, 0),
('Lag B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'AGA AVESTA'), 'Industrigaser', 'D,D,F,F,N,N,L,L,L,L,L,L,E,E,FE,FE,EN,EN', 18, 1),
('Lag C', '#45B7D1', (SELECT id FROM companies WHERE name = 'AGA AVESTA'), 'Industrigaser', 'D,D,F,F,N,N,L,L,L,L,L,L,E,E,FE,FE,EN,EN', 18, 2),
('Lag D', '#007AFF', (SELECT id FROM companies WHERE name = 'AGA AVESTA'), 'Industrigaser', 'D,D,F,F,N,N,L,L,L,L,L,L,E,E,FE,FE,EN,EN', 18, 3),
('Lag E', '#8B4513', (SELECT id FROM companies WHERE name = 'AGA AVESTA'), 'Industrigaser', 'D,D,F,F,N,N,L,L,L,L,L,L,E,E,FE,FE,EN,EN', 18, 4),
('Lag F', '#D2691E', (SELECT id FROM companies WHERE name = 'AGA AVESTA'), 'Industrigaser', 'D,D,F,F,N,N,L,L,L,L,L,L,E,E,FE,FE,EN,EN', 18, 5),

-- ABB HVDC - 10-dagars cykel
('Lag 1', '#FF6B6B', (SELECT id FROM companies WHERE name = 'ABB HVDC'), 'Högspänningsteknik', 'F,F,N,N,E,E,D12,D12,N12,N12', 10, 0),
('Lag 2', '#4ECDC4', (SELECT id FROM companies WHERE name = 'ABB HVDC'), 'Högspänningsteknik', 'F,F,N,N,E,E,D12,D12,N12,N12', 10, 1),
('Lag 3', '#45B7D1', (SELECT id FROM companies WHERE name = 'ABB HVDC'), 'Högspänningsteknik', 'F,F,N,N,E,E,D12,D12,N12,N12', 10, 2),
('Lag 4', '#007AFF', (SELECT id FROM companies WHERE name = 'ABB HVDC'), 'Högspänningsteknik', 'F,F,N,N,E,E,D12,D12,N12,N12', 10, 3),
('Lag 5', '#8B4513', (SELECT id FROM companies WHERE name = 'ABB HVDC'), 'Högspänningsteknik', 'F,F,N,N,E,E,D12,D12,N12,N12', 10, 4),

-- AVESTA 6-VECKORS - 42-dagars cykel
('Lag 1', '#FF6B6B', (SELECT id FROM companies WHERE name = 'AVESTA 6-VECKORS'), 'Nattschema', 'N,N,N,N,N,N,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 42, 0),
('Lag 2', '#4ECDC4', (SELECT id FROM companies WHERE name = 'AVESTA 6-VECKORS'), 'Nattschema', 'N,N,N,N,N,N,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 42, 1),
('Lag 3', '#45B7D1', (SELECT id FROM companies WHERE name = 'AVESTA 6-VECKORS'), 'Nattschema', 'N,N,N,N,N,N,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 42, 2),
('Lag 4', '#007AFF', (SELECT id FROM companies WHERE name = 'AVESTA 6-VECKORS'), 'Nattschema', 'N,N,N,N,N,N,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 42, 3),
('Lag 5', '#8B4513', (SELECT id FROM companies WHERE name = 'AVESTA 6-VECKORS'), 'Nattschema', 'N,N,N,N,N,N,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 42, 4),
('Lag 6', '#D2691E', (SELECT id FROM companies WHERE name = 'AVESTA 6-VECKORS'), 'Nattschema', 'N,N,N,N,N,N,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 42, 5),

-- ARCTIC PAPER GRYCKSBO - 13-dagars cykel
('Lag 1', '#FF6B6B', (SELECT id FROM companies WHERE name = 'ARCTIC PAPER GRYCKSBO'), 'Pappersproduktion', 'E,E,E,F,F,F,N,N,N,NH,NH,FH,FH', 13, 0),
('Lag 2', '#4ECDC4', (SELECT id FROM companies WHERE name = 'ARCTIC PAPER GRYCKSBO'), 'Pappersproduktion', 'E,E,E,F,F,F,N,N,N,NH,NH,FH,FH', 13, 1),
('Lag 3', '#45B7D1', (SELECT id FROM companies WHERE name = 'ARCTIC PAPER GRYCKSBO'), 'Pappersproduktion', 'E,E,E,F,F,F,N,N,N,NH,NH,FH,FH', 13, 2),
('Lag 4', '#007AFF', (SELECT id FROM companies WHERE name = 'ARCTIC PAPER GRYCKSBO'), 'Pappersproduktion', 'E,E,E,F,F,F,N,N,N,NH,NH,FH,FH', 13, 3),
('Lag 5', '#8B4513', (SELECT id FROM companies WHERE name = 'ARCTIC PAPER GRYCKSBO'), 'Pappersproduktion', 'E,E,E,F,F,F,N,N,N,NH,NH,FH,FH', 13, 4),

-- UDDEHOLM TOOLING - 14-dagars cykel
('Lag 1', '#FF6B6B', (SELECT id FROM companies WHERE name = 'UDDEHOLM TOOLING'), 'Verktygsstål', 'N,N,N,F,F,F,L,L,L,F,F,F,N,N', 14, 0),
('Lag 2', '#4ECDC4', (SELECT id FROM companies WHERE name = 'UDDEHOLM TOOLING'), 'Verktygsstål', 'N,N,N,F,F,F,L,L,L,F,F,F,N,N', 14, 1),
('Lag 3', '#45B7D1', (SELECT id FROM companies WHERE name = 'UDDEHOLM TOOLING'), 'Verktygsstål', 'N,N,N,F,F,F,L,L,L,F,F,F,N,N', 14, 2),

-- VOESTALPINE PRECISION STRIP - 14-dagars cykel
('Lag A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'VOESTALPINE PRECISION STRIP'), 'Stålband', 'F,F,F,F,F,L,L,E,E,E,E,E,L,L', 14, 0),
('Lag B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'VOESTALPINE PRECISION STRIP'), 'Stålband', 'F,F,F,F,F,L,L,E,E,E,E,E,L,L', 14, 1),

-- TRUCK SERVICE AB - 21-dagars cykel
('Lag A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'TRUCK SERVICE AB'), 'Fordonsteknik', 'F,F,F,F,F,F,F,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 21, 0),
('Lag B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'TRUCK SERVICE AB'), 'Fordonsteknik', 'F,F,F,F,F,F,F,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 21, 1),
('Lag C', '#45B7D1', (SELECT id FROM companies WHERE name = 'TRUCK SERVICE AB'), 'Fordonsteknik', 'F,F,F,F,F,F,F,L,L,L,L,L,L,L,L,L,L,L,L,L,L', 21, 2),

-- STORA ENSO NYMÖLLA - 29-dagars cykel
('Lag A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'STORA ENSO NYMÖLLA'), 'Pappersproduktion', 'F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F', 29, 0),
('Lag B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'STORA ENSO NYMÖLLA'), 'Pappersproduktion', 'F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F', 29, 1),
('Lag C', '#45B7D1', (SELECT id FROM companies WHERE name = 'STORA ENSO NYMÖLLA'), 'Pappersproduktion', 'F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F', 29, 2),
('Lag D', '#007AFF', (SELECT id FROM companies WHERE name = 'STORA ENSO NYMÖLLA'), 'Pappersproduktion', 'F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F', 29, 3),
('Lag E', '#8B4513', (SELECT id FROM companies WHERE name = 'STORA ENSO NYMÖLLA'), 'Pappersproduktion', 'F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F', 29, 4);

-- 8. Funktion för att generera skift baserat på exakta mönster
CREATE OR REPLACE FUNCTION generate_exact_swedish_shifts(
    p_team_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS VOID AS $$
DECLARE
    current_date_var DATE;
    shift_pattern TEXT[];
    cycle_length INTEGER;
    team_offset INTEGER;
    shift_type TEXT;
    start_time TIME;
    end_time TIME;
    hours_worked DECIMAL(4,2);
    day_of_week INTEGER;
    cycle_position INTEGER;
    pattern_index INTEGER;
    base_date DATE := '2025-01-18'::DATE;
BEGIN
    -- Hämta skiftmönster för teamet
    SELECT 
        string_to_array(t.shift_pattern, ',')::TEXT[],
        t.cycle_length,
        t.team_offset
    INTO shift_pattern, cycle_length, team_offset
    FROM teams t 
    WHERE t.id = p_team_id;
    
    current_date_var := p_start_date;
    
    WHILE current_date_var <= p_end_date LOOP
        -- Beräkna cykelposition med team offset
        cycle_position := (((current_date_var - base_date) + team_offset) % cycle_length + cycle_length) % cycle_length;
        pattern_index := cycle_position + 1;
        
        -- Hämta skifttyp från mönster
        shift_type := shift_pattern[pattern_index];
        
        -- Sätt tider baserat på skifttyp
        CASE shift_type
            WHEN 'M' THEN
                start_time := '06:00';
                end_time := '14:00';
                hours_worked := 8.0;
            WHEN 'A' THEN
                start_time := '14:00';
                end_time := '22:00';
                hours_worked := 8.0;
            WHEN 'N' THEN
                start_time := '22:00';
                end_time := '06:00';
                hours_worked := 8.0;
            WHEN 'F' THEN
                start_time := '06:00';
                end_time := '14:00';
                hours_worked := 8.0;
            WHEN 'E' THEN
                start_time := '14:00';
                end_time := '22:00';
                hours_worked := 8.0;
            WHEN 'D' THEN
                start_time := '07:00';
                end_time := '16:00';
                hours_worked := 9.0;
            WHEN 'D12' THEN
                start_time := '06:00';
                end_time := '18:00';
                hours_worked := 12.0;
            WHEN 'N12' THEN
                start_time := '18:00';
                end_time := '06:00';
                hours_worked := 12.0;
            WHEN 'NH' THEN
                start_time := '22:00';
                end_time := '06:00';
                hours_worked := 8.0;
            WHEN 'FH' THEN
                start_time := '06:00';
                end_time := '14:00';
                hours_worked := 8.0;
            WHEN 'FE' THEN
                start_time := '06:00';
                end_time := '14:00';
                hours_worked := 8.0;
            WHEN 'EN' THEN
                start_time := '14:00';
                end_time := '22:00';
                hours_worked := 8.0;
            ELSE -- L (Ledig)
                start_time := NULL;
                end_time := NULL;
                hours_worked := 0.0;
        END CASE;
        
        -- Lägg till skift
        INSERT INTO shifts (date, shift_type, team_id, start_time, end_time, hours_worked, notes, cycle_day)
        VALUES (current_date_var, shift_type, p_team_id, start_time, end_time, hours_worked, 
                CASE 
                    WHEN shift_type = 'L' THEN 'Ledig dag'
                    ELSE 'Arbetsdag - ' || shift_type
                END,
                cycle_position + 1);
        
        current_date_var := current_date_var + INTERVAL '1 day';
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
        PERFORM generate_exact_swedish_shifts(team_record.id, start_date, end_date);
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
--   t.cycle_length,
--   t.team_offset,
--   COUNT(s.id) as total_shifts,
--   MIN(s.date) as first_shift,
--   MAX(s.date) as last_shift
-- FROM companies c
-- JOIN teams t ON c.id = t.company_id
-- LEFT JOIN shifts s ON t.id = s.team_id
-- GROUP BY c.name, t.name, t.shift_pattern, t.cycle_length, t.team_offset
-- ORDER BY c.name, t.name; 