# 🗄️ Database Setup för Chatfunktion

## Tabeller som behöver skapas

Kör följande SQL-kommandon i din Supabase SQL Editor:

### 1. Companies Table
```sql
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies can be created by authenticated users" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies can be updated by authenticated users" ON companies
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 2. Teams Table
```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teams are viewable by authenticated users" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teams can be created by authenticated users" ON teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teams can be updated by authenticated users" ON teams
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3. Team Members Table
```sql
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

### 4. Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

### 5. Online Status Table
```sql
CREATE TABLE online_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

### 6. Update Profiles Table (om den inte redan finns)
```sql
-- Om profiles tabellen inte redan finns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

## 🧪 Testdata

För att testa chatfunktionen, lägg till lite testdata:

### 1. Skapa företag
```sql
INSERT INTO companies (name, description) VALUES
('TechCorp AB', 'Ett innovativt tech-företag'),
('Healthcare Solutions', 'Vårdlösningar för framtiden');
```

### 2. Skapa lag
```sql
INSERT INTO teams (name, color, company_id, description) VALUES
('Utvecklingsteam', '#007AFF', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'Huvudutvecklingsteam'),
('Design Team', '#FF6B6B', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'UX/UI Design'),
('Vårdteam A', '#4ECDC4', (SELECT id FROM companies WHERE name = 'Healthcare Solutions'), 'Primärvård'),
('Vårdteam B', '#45B7D1', (SELECT id FROM companies WHERE name = 'Healthcare Solutions'), 'Specialvård');
```

### 3. Lägg till användare i lag (efter att användare har registrerats)
```sql
-- Exempel (ersätt user_id med faktiska användar-ID:n)
INSERT INTO team_members (user_id, team_id, role) VALUES
('user-uuid-1', (SELECT id FROM teams WHERE name = 'Utvecklingsteam'), 'member'),
('user-uuid-2', (SELECT id FROM teams WHERE name = 'Design Team'), 'member');
```

## 🔧 Realtime Setup

För att aktivera real-time funktionalitet:

1. Gå till Supabase Dashboard
2. Navigera till Database > Replication
3. Aktivera real-time för följande tabeller:
   - `chat_messages`
   - `online_status`
   - `team_members`

## ✅ Verifiering

Efter att du har kört alla SQL-kommandon:

1. **Testa tabeller**: Kontrollera att alla tabeller skapades korrekt
2. **Testa policies**: Verifiera att RLS-policies fungerar
3. **Testa real-time**: Kontrollera att real-time är aktiverat
4. **Testa appen**: Starta appen och testa chatfunktionen

## 🚨 Viktigt

- **Backup**: Ta backup av din databas innan du kör dessa kommandon
- **Testmiljö**: Testa först i en utvecklingsmiljö
- **Säkerhet**: RLS-policies säkerställer att användare bara kan se relevant data
- **Performance**: Överväg att lägga till index för bättre prestanda vid stora datamängder 