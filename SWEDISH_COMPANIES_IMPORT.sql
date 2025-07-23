-- 🇸🇪 Svenska Företag Import för Loveable Skiftappen
-- Importerar alla företag från scraping data till det nya schemat

-- 1. Rensa befintliga data (idempotent)
DELETE FROM companies WHERE id IS NOT NULL;
DELETE FROM shift_teams WHERE id IS NOT NULL;

-- 2. Importera svenska företag från scraping data
INSERT INTO companies (name, description, industry, location, website, employee_count, founded_year) VALUES
-- Stål och Metallindustri
('SSAB', 'Stålproduktion och stålprodukter', 'Stålindustri', 'Stockholm', 'https://www.ssab.com', 15000, 1978),
('BOLIDEN', 'Gruvdrift och metallproduktion', 'Gruvindustri', 'Stockholm', 'https://www.boliden.com', 5500, 1891),
('SANDVIK', 'Verktyg, maskiner och material', 'Verktygsindustri', 'Sandviken', 'https://www.sandvik.com', 40000, 1862),
('OUTOKUMPU', 'Rostfritt stål och speciallegeringar', 'Stålindustri', 'Helsingborg', 'https://www.outokumpu.com', 10000, 1932),
('OVAKO', 'Ståltillverkning och stålprodukter', 'Stålindustri', 'Hofors', 'https://www.ovako.com', 3000, 1917),
('SKF', 'Lager och lagersystem', 'Verktygsindustri', 'Göteborg', 'https://www.skf.com', 44000, 1907),

-- Biltillverkning
('VOLVO CARS', 'Biltillverkning', 'Bilindustri', 'Göteborg', 'https://www.volvocars.com', 41000, 1927),
('VOLVO TRUCKS', 'Lastbilstillverkning', 'Bilindustri', 'Göteborg', 'https://www.volvotrucks.com', 100000, 1928),
('SCANIA', 'Lastbilar och bussar', 'Bilindustri', 'Södertälje', 'https://www.scania.com', 50000, 1891),

-- Skogsindustri
('SCA', 'Skogsindustri och pappersprodukter', 'Skogsindustri', 'Sundsvall', 'https://www.sca.com', 4000, 1929),
('STORA ENSO', 'Förpackningar och biomaterial', 'Skogsindustri', 'Helsingfors', 'https://www.storaenso.com', 22000, 1998),
('BILLERUD', 'Förpackningsmaterial', 'Skogsindustri', 'Solna', 'https://www.billerud.com', 3000, 2012),
('NORDIC PAPER', 'Pappersproduktion', 'Skogsindustri', 'Göteborg', 'https://www.nordic-paper.com', 800, 2017),
('SÖDRA CELL', 'Cellulosaproduktion', 'Skogsindustri', 'Väröbacka', 'https://www.sodra.com', 3500, 1938),
('ARCTIC PAPER GRYCKSBO', 'Pappersproduktion', 'Skogsindustri', 'Grycksbo', 'https://www.arcticpaper.com', 500, 1990),

-- Kemisk industri
('AGA AVESTA', 'Industrigaser och kemikalier', 'Kemisk industri', 'Avesta', 'https://www.aga.com', 2000, 1904),
('PERSTORP', 'Specialkemikalier', 'Kemisk industri', 'Perstorp', 'https://www.perstorp.com', 1500, 1881),
('CAMBREX', 'Farmaceutiska råvaror', 'Kemisk industri', 'Karlskoga', 'https://www.cambrex.com', 3000, 1981),
('ORICA', 'Sprengämnen och kemikalier', 'Kemisk industri', 'Stockholm', 'https://www.orica.com', 12000, 1874),

-- Energi
('BORLÄNGE ENERGI', 'Energiproduktion och distribution', 'Energi', 'Borlänge', 'https://www.borlange-energi.se', 200, 1900),
('VATTENFALL', 'Elproduktion och energilösningar', 'Energi', 'Stockholm', 'https://www.vattenfall.se', 20000, 1909),
('E.ON', 'El- och gasdistribution', 'Energi', 'Malmö', 'https://www.eon.se', 80000, 2000),
('FORTUM', 'Energi och värmeproduktion', 'Energi', 'Stockholm', 'https://www.fortum.se', 8000, 1998),

-- Kommunal verksamhet
('AVESTA KOMMUN', 'Kommunal verksamhet', 'Kommun', 'Avesta', 'https://www.avesta.se', 1000, 1863),
('BORLÄNGE KOMMUN', 'Kommunal verksamhet', 'Kommun', 'Borlänge', 'https://www.borlange.se', 1200, 1944),
('LANDSTINGET DALARNA', 'Sjukvård', 'Sjukvård', 'Falun', 'https://www.regiondalarna.se', 8000, 1862),

-- Livsmedel
('BARILLA SVERIGE', 'Pastaproduktion', 'Livsmedel', 'Filipstad', 'https://www.barilla.com', 8000, 1877),
('ARLA FOODS', 'Mjölkprodukter', 'Livsmedel', 'Stockholm', 'https://www.arla.se', 19000, 1881),
('ICA', 'Matvarukedja', 'Livsmedel', 'Solna', 'https://www.ica.se', 21000, 1938),

-- Bygg
('SKANSKA', 'Bygg och fastigheter', 'Bygg', 'Stockholm', 'https://www.skanska.se', 32000, 1887),

-- IT och Telekom
('ERICSSON', 'Telekommunikation och nätverk', 'IT/Telekom', 'Stockholm', 'https://www.ericsson.com', 100000, 1876),
('SPOTIFY', 'Musikstreaming och digital media', 'IT/Media', 'Stockholm', 'https://www.spotify.com', 9000, 2006),
('KLARNA', 'Digital betalningslösningar', 'Fintech', 'Stockholm', 'https://www.klarna.com', 5000, 2005),

-- Sjukvård
('KAROLINSKA UNIVERSITETSSJUKHUSET', 'Akademiskt sjukhus', 'Sjukvård', 'Stockholm', 'https://www.karolinska.se', 15000, 1810),
('SAHLGRENSKA UNIVERSITETSSJUKHUSET', 'Universitetssjukhus', 'Sjukvård', 'Göteborg', 'https://www.sahlgrenska.se', 17000, 1900),
('SKÅNE UNIVERSITETSSJUKHUS', 'Universitetssjukhus', 'Sjukvård', 'Lund', 'https://www.skane.se', 13000, 1850),

-- Transport
('SJ', 'Tågtrafik', 'Transport', 'Stockholm', 'https://www.sj.se', 7000, 2001),
('SL', 'Kollektivtrafik Stockholm', 'Transport', 'Stockholm', 'https://www.sl.se', 14000, 1967),
('SKÅNETRAFIKEN', 'Kollektivtrafik Skåne', 'Transport', 'Malmö', 'https://www.skanetrafiken.se', 2000, 1999);

-- 3. Skapa shift teams för varje företag
-- SSAB Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Produktion A', '#FF6B6B', (SELECT id FROM companies WHERE name = 'SSAB'), 'Huvudproduktion', 'M,A,N,L,M,A,N,L', 8, 0),
('Produktion B', '#4ECDC4', (SELECT id FROM companies WHERE name = 'SSAB'), 'Sekundärproduktion', 'A,N,L,M,A,N,L,M', 8, 1),
('Underhåll', '#45B7D1', (SELECT id FROM companies WHERE name = 'SSAB'), 'Tekniskt underhåll', 'N,L,M,A,N,L,M,A', 8, 2),
('Kvalitet', '#96CEB4', (SELECT id FROM companies WHERE name = 'SSAB'), 'Kvalitetskontroll', 'L,M,A,N,L,M,A,N', 8, 3);

-- Volvo Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Montering A', '#FF8A80', (SELECT id FROM companies WHERE name = 'VOLVO CARS'), 'Bilmontering', 'M,A,N,L,M,A,N,L', 8, 0),
('Montering B', '#FFD180', (SELECT id FROM companies WHERE name = 'VOLVO CARS'), 'Bilmontering', 'A,N,L,M,A,N,L,M', 8, 1),
('Logistik', '#CCFF90', (SELECT id FROM companies WHERE name = 'VOLVO CARS'), 'Materialhantering', 'N,L,M,A,N,L,M,A', 8, 2),
('Kvalitet', '#A7FFEB', (SELECT id FROM companies WHERE name = 'VOLVO CARS'), 'Kvalitetskontroll', 'L,M,A,N,L,M,A,N', 8, 3);

-- Scania Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Montering', '#FF9E80', (SELECT id FROM companies WHERE name = 'SCANIA'), 'Lastbilsmontering', 'M,A,N,L,M,A,N,L', 8, 0),
('Motor', '#FFAB91', (SELECT id FROM companies WHERE name = 'SCANIA'), 'Motortillverkning', 'A,N,L,M,A,N,L,M', 8, 1),
('Chassi', '#FFCC02', (SELECT id FROM companies WHERE name = 'SCANIA'), 'Chassitillverkning', 'N,L,M,A,N,L,M,A', 8, 2),
('Test', '#FF6F00', (SELECT id FROM companies WHERE name = 'SCANIA'), 'Test och kvalitet', 'L,M,A,N,L,M,A,N', 8, 3);

-- SCA Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Produktion A', '#4CAF50', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion', 'M,A,N,L,M,A,N,L', 8, 0),
('Produktion B', '#8BC34A', (SELECT id FROM companies WHERE name = 'SCA'), 'Pappersproduktion', 'A,N,L,M,A,N,L,M', 8, 1),
('Skogsbruk', '#CDDC39', (SELECT id FROM companies WHERE name = 'SCA'), 'Skogsarbete', 'N,L,M,A,N,L,M,A', 8, 2),
('Transport', '#FFEB3B', (SELECT id FROM companies WHERE name = 'SCA'), 'Transport och logistik', 'L,M,A,N,L,M,A,N', 8, 3);

-- Ericsson Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Utveckling A', '#2196F3', (SELECT id FROM companies WHERE name = 'ERICSSON'), 'Softwareutveckling', 'M,A,N,L,M,A,N,L', 8, 0),
('Utveckling B', '#03A9F4', (SELECT id FROM companies WHERE name = 'ERICSSON'), 'Softwareutveckling', 'A,N,L,M,A,N,L,M', 8, 1),
('Test', '#00BCD4', (SELECT id FROM companies WHERE name = 'ERICSSON'), 'Test och QA', 'N,L,M,A,N,L,M,A', 8, 2),
('Support', '#009688', (SELECT id FROM companies WHERE name = 'ERICSSON'), 'Teknisk support', 'L,M,A,N,L,M,A,N', 8, 3);

-- Karolinska Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Akutmottagning', '#F44336', (SELECT id FROM companies WHERE name = 'KAROLINSKA UNIVERSITETSSJUKHUSET'), 'Akutsjukvård', 'M,A,N,L,M,A,N,L', 8, 0),
('Intensivvård', '#E91E63', (SELECT id FROM companies WHERE name = 'KAROLINSKA UNIVERSITETSSJUKHUSET'), 'Intensivvård', 'A,N,L,M,A,N,L,M', 8, 1),
('Kirurgi', '#9C27B0', (SELECT id FROM companies WHERE name = 'KAROLINSKA UNIVERSITETSSJUKHUSET'), 'Kirurgisk vård', 'N,L,M,A,N,L,M,A', 8, 2),
('Laboratorium', '#673AB7', (SELECT id FROM companies WHERE name = 'KAROLINSKA UNIVERSITETSSJUKHUSET'), 'Laboratoriearbete', 'L,M,A,N,L,M,A,N', 8, 3);

-- SJ Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Lokförare A', '#3F51B5', (SELECT id FROM companies WHERE name = 'SJ'), 'Tågförning', 'M,A,N,L,M,A,N,L', 8, 0),
('Lokförare B', '#5C6BC0', (SELECT id FROM companies WHERE name = 'SJ'), 'Tågförning', 'A,N,L,M,A,N,L,M', 8, 1),
('Kundtjänst', '#7986CB', (SELECT id FROM companies WHERE name = 'SJ'), 'Kundservice', 'N,L,M,A,N,L,M,A', 8, 2),
('Underhåll', '#9FA8DA', (SELECT id FROM companies WHERE name = 'SJ'), 'Tekniskt underhåll', 'L,M,A,N,L,M,A,N', 8, 3);

-- SL Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Tunnelbana A', '#FF5722', (SELECT id FROM companies WHERE name = 'SL'), 'Tunnelbaneförning', 'M,A,N,L,M,A,N,L', 8, 0),
('Tunnelbana B', '#FF7043', (SELECT id FROM companies WHERE name = 'SL'), 'Tunnelbaneförning', 'A,N,L,M,A,N,L,M', 8, 1),
('Buss A', '#FF8A65', (SELECT id FROM companies WHERE name = 'SL'), 'Busskörning', 'N,L,M,A,N,L,M,A', 8, 2),
('Buss B', '#FFAB91', (SELECT id FROM companies WHERE name = 'SL'), 'Busskörning', 'L,M,A,N,L,M,A,N', 8, 3);

-- Arla Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Produktion A', '#4CAF50', (SELECT id FROM companies WHERE name = 'ARLA FOODS'), 'Mjölkproduktion', 'M,A,N,L,M,A,N,L', 8, 0),
('Produktion B', '#8BC34A', (SELECT id FROM companies WHERE name = 'ARLA FOODS'), 'Mjölkproduktion', 'A,N,L,M,A,N,L,M', 8, 1),
('Kvalitet', '#CDDC39', (SELECT id FROM companies WHERE name = 'ARLA FOODS'), 'Kvalitetskontroll', 'N,L,M,A,N,L,M,A', 8, 2),
('Logistik', '#FFEB3B', (SELECT id FROM companies WHERE name = 'ARLA FOODS'), 'Transport och logistik', 'L,M,A,N,L,M,A,N', 8, 3);

-- Skanska Teams
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset) VALUES
('Bygg A', '#795548', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'Byggarbete', 'M,A,N,L,M,A,N,L', 8, 0),
('Bygg B', '#8D6E63', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'Byggarbete', 'A,N,L,M,A,N,L,M', 8, 1),
('Elektriker', '#A1887F', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'Elektriska installationer', 'N,L,M,A,N,L,M,A', 8, 2),
('VVS', '#BCAAA4', (SELECT id FROM companies WHERE name = 'SKANSKA'), 'VVS-installationer', 'L,M,A,N,L,M,A,N', 8, 3);

-- 4. Skapa generiska teams för mindre företag
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset)
SELECT 
  'Team ' || CASE 
    WHEN c.industry = 'Stålindustri' THEN 'Produktion'
    WHEN c.industry = 'Bilindustri' THEN 'Montering'
    WHEN c.industry = 'Skogsindustri' THEN 'Produktion'
    WHEN c.industry = 'Kemisk industri' THEN 'Produktion'
    WHEN c.industry = 'Energi' THEN 'Drift'
    WHEN c.industry = 'Kommun' THEN 'Administration'
    WHEN c.industry = 'Sjukvård' THEN 'Vård'
    WHEN c.industry = 'Transport' THEN 'Trafik'
    WHEN c.industry = 'Livsmedel' THEN 'Produktion'
    WHEN c.industry = 'Bygg' THEN 'Bygg'
    ELSE 'Huvudteam'
  END,
  CASE 
    WHEN c.industry = 'Stålindustri' THEN '#FF6B6B'
    WHEN c.industry = 'Bilindustri' THEN '#FF8A80'
    WHEN c.industry = 'Skogsindustri' THEN '#4CAF50'
    WHEN c.industry = 'Kemisk industri' THEN '#FF9800'
    WHEN c.industry = 'Energi' THEN '#FFC107'
    WHEN c.industry = 'Kommun' THEN '#2196F3'
    WHEN c.industry = 'Sjukvård' THEN '#F44336'
    WHEN c.industry = 'Transport' THEN '#3F51B5'
    WHEN c.industry = 'Livsmedel' THEN '#4CAF50'
    WHEN c.industry = 'Bygg' THEN '#795548'
    ELSE '#9C27B0'
  END,
  c.id,
  'Huvudteam för ' || c.name,
  'M,A,N,L,M,A,N,L',
  8,
  0
FROM companies c
WHERE c.name NOT IN (
  'SSAB', 'VOLVO CARS', 'SCANIA', 'SCA', 'ERICSSON', 
  'KAROLINSKA UNIVERSITETSSJUKHUSET', 'SJ', 'SL', 'ARLA FOODS', 'SKANSKA'
);

-- 5. Skapa sekundära teams för större företag
INSERT INTO shift_teams (name, color_hex, company_id, description, shift_pattern, cycle_length, team_offset)
SELECT 
  'Team ' || CASE 
    WHEN c.industry = 'Stålindustri' THEN 'Underhåll'
    WHEN c.industry = 'Bilindustri' THEN 'Kvalitet'
    WHEN c.industry = 'Skogsindustri' THEN 'Transport'
    WHEN c.industry = 'Kemisk industri' THEN 'Kvalitet'
    WHEN c.industry = 'Energi' THEN 'Underhåll'
    WHEN c.industry = 'Kommun' THEN 'Service'
    WHEN c.industry = 'Sjukvård' THEN 'Laboratorium'
    WHEN c.industry = 'Transport' THEN 'Underhåll'
    WHEN c.industry = 'Livsmedel' THEN 'Kvalitet'
    WHEN c.industry = 'Bygg' THEN 'Planering'
    ELSE 'Sekundärt team'
  END,
  CASE 
    WHEN c.industry = 'Stålindustri' THEN '#4ECDC4'
    WHEN c.industry = 'Bilindustri' THEN '#FFD180'
    WHEN c.industry = 'Skogsindustri' THEN '#8BC34A'
    WHEN c.industry = 'Kemisk industri' THEN '#FFB74D'
    WHEN c.industry = 'Energi' THEN '#FFD54F'
    WHEN c.industry = 'Kommun' THEN '#64B5F6'
    WHEN c.industry = 'Sjukvård' THEN '#E91E63'
    WHEN c.industry = 'Transport' THEN '#5C6BC0'
    WHEN c.industry = 'Livsmedel' THEN '#8BC34A'
    WHEN c.industry = 'Bygg' THEN '#8D6E63'
    ELSE '#BA68C8'
  END,
  c.id,
  'Sekundärt team för ' || c.name,
  'A,N,L,M,A,N,L,M',
  8,
  1
FROM companies c
WHERE c.employee_count > 1000;

-- 6. Uppdatera företagsinformation med mer detaljer
UPDATE companies SET 
  description = CASE 
    WHEN name = 'SSAB' THEN 'Ledande ståltillverkare med fokus på hållbar stålproduktion'
    WHEN name = 'VOLVO CARS' THEN 'Premium biltillverkare med fokus på säkerhet och hållbarhet'
    WHEN name = 'SCANIA' THEN 'Världsledande inom tunga fordon och bussar'
    WHEN name = 'ERICSSON' THEN 'Global telekommunikationsleverantör för 5G och nätverk'
    WHEN name = 'KAROLINSKA UNIVERSITETSSJUKHUSET' THEN 'Sveriges ledande akademiska sjukhus'
    WHEN name = 'SJ' THEN 'Sveriges nationella tågoperatör'
    WHEN name = 'SL' THEN 'Stockholms kollektivtrafik'
    WHEN name = 'ARLA FOODS' THEN 'Nordens största mejerikoncern'
    WHEN name = 'SKANSKA' THEN 'Sveriges största byggföretag'
    ELSE description
  END,
  employee_count = CASE 
    WHEN name = 'SSAB' THEN 15000
    WHEN name = 'VOLVO CARS' THEN 41000
    WHEN name = 'SCANIA' THEN 50000
    WHEN name = 'ERICSSON' THEN 100000
    WHEN name = 'KAROLINSKA UNIVERSITETSSJUKHUSET' THEN 15000
    WHEN name = 'SJ' THEN 7000
    WHEN name = 'SL' THEN 14000
    WHEN name = 'ARLA FOODS' THEN 19000
    WHEN name = 'SKANSKA' THEN 32000
    ELSE employee_count
  END
WHERE name IN (
  'SSAB', 'VOLVO CARS', 'SCANIA', 'ERICSSON', 
  'KAROLINSKA UNIVERSITETSSJUKHUSET', 'SJ', 'SL', 'ARLA FOODS', 'SKANSKA'
);

-- 7. Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(location);
CREATE INDEX IF NOT EXISTS idx_shift_teams_company_name ON shift_teams(name);

-- 8. Kommentarer för dokumentation
COMMENT ON TABLE companies IS 'Svenska företag från scraping data - Loveable optimerad';
COMMENT ON TABLE shift_teams IS 'Team och lag för skiftarbete - Loveable optimerad';
COMMENT ON COLUMN companies.employee_count IS 'Antal anställda (uppskattat)';
COMMENT ON COLUMN companies.founded_year IS 'År företaget grundades';
COMMENT ON COLUMN shift_teams.shift_pattern IS 'Skiftmönster: M=Morgon, A=Afternoon, N=Natt, L=Ledig';
COMMENT ON COLUMN shift_teams.cycle_length IS 'Antal dagar i skiftcykeln';
COMMENT ON COLUMN shift_teams.team_offset IS 'Offset för team-rotation';

-- 9. Statistik
SELECT 
  'Import slutförd' as status,
  COUNT(*) as total_companies,
  COUNT(DISTINCT industry) as total_industries,
  COUNT(DISTINCT location) as total_locations
FROM companies;

SELECT 
  'Team statistik' as status,
  COUNT(*) as total_teams,
  COUNT(DISTINCT company_id) as companies_with_teams
FROM shift_teams; 