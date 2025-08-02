-- Skapa tabell för skiftdata
CREATE TABLE IF NOT EXISTS shifts (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  department TEXT,
  team TEXT NOT NULL,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  time TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_shifts_company ON shifts(company);
CREATE INDEX IF NOT EXISTS idx_shifts_team ON shifts(team);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_scraped_at ON shifts(scraped_at);

-- Skapa unique constraint för att undvika dubbletter
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_unique 
ON shifts(company, team, date, shift);

-- Aktivera Row Level Security (RLS)
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Skapa policy för att tillåta läsning för alla autentiserade användare
CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" 
ON shifts FOR SELECT 
TO authenticated 
USING (true);

-- Skapa policy för att tillåta insert för service role
CREATE POLICY IF NOT EXISTS "Enable insert for service role" 
ON shifts FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Skapa policy för att tillåta update för service role
CREATE POLICY IF NOT EXISTS "Enable update for service role" 
ON shifts FOR UPDATE 
TO service_role 
USING (true);

-- Funktion för att uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger för att automatiskt uppdatera updated_at
CREATE TRIGGER IF NOT EXISTS update_shifts_updated_at 
BEFORE UPDATE ON shifts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();