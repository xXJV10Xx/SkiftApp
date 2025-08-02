-- Skapa tabeller för skiftappen
-- Kör detta i Supabase SQL Editor

-- Företag tabell
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orter tabell
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skiftlag tabell
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#95A5A6',
    location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skift tabell
CREATE TABLE IF NOT EXISTS shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type TEXT NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unik constraint för att förhindra dubbletter
    UNIQUE(team_id, date)
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_locations_company_id ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_location_id ON teams(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_team_id ON shifts(team_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_team_date ON shifts(team_id, date);

-- RLS (Row Level Security) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Tillåt läsning för alla autentiserade användare
CREATE POLICY "Allow read access for authenticated users" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON teams
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON shifts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Tillåt alla operationer för service_role (för scraping)
CREATE POLICY "Allow all operations for service role" ON companies
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all operations for service role" ON locations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all operations for service role" ON teams
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all operations for service role" ON shifts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Funktioner för updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers för updated_at
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
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

-- Skapa en view för komplett skiftdata
CREATE OR REPLACE VIEW shift_details AS
SELECT 
    s.id,
    s.date,
    s.shift_type,
    s.start_time,
    s.end_time,
    s.notes,
    t.name as team_name,
    t.color as team_color,
    l.name as location_name,
    c.name as company_name,
    s.created_at,
    s.updated_at
FROM shifts s
JOIN teams t ON s.team_id = t.id
JOIN locations l ON t.location_id = l.id
JOIN companies c ON l.company_id = c.id
ORDER BY s.date DESC, t.name;