# 🚀 Supabase Integration Guide - Skiftappen

## 📍 Repository Status: ✅ UPPDATERAD

**GitHub Repository**: `https://github.com/xXJV10Xx/SkiftApp`  
**Senaste commit**: `0ba17e2` - Komplett deployment-paket  
**Status**: Alla uppdateringar är pushade till main branch

---

## 🗄️ Supabase Project Setup

### 1. Supabase Project Information
```
Project URL: https://fsefeherdbtsddqimjco.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk
Status: ✅ Aktivt och konfigurerat
```

### 2. GitHub Integration för Supabase
För att koppla GitHub-repository till Supabase:

1. **Gå till Supabase Dashboard** → Settings → Integrations
2. **Koppla GitHub**: Välj repository `xXJV10Xx/SkiftApp`
3. **Auto-deploy**: Aktivera automatisk deployment från main branch
4. **Environment Variables**: Konfigurera från `.env` filen

---

## 🔄 Database Schema (Komplett Setup)

### Kör följande SQL i Supabase SQL Editor:

```sql
-- 0. Users Table (for Stripe integration)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  calendar_export_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add calendar_export_paid column if users table already exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_export_paid BOOLEAN DEFAULT FALSE;

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shifts Table (NYA FUNKTIONER)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  shift_type TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Profiles Table (Auth Integration)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'sv',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Aktivera Row Level Security:
```sql
-- Aktivera RLS för alla tabeller
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Skapa säkerhetspolicies:
```sql
-- Companies policies
CREATE POLICY "Anyone can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage companies" ON companies FOR ALL USING (auth.role() = 'authenticated');

-- Employees policies
CREATE POLICY "Users can view employees in same company" ON employees 
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);

-- Shifts policies (NYA)
CREATE POLICY "Users can view company shifts" ON shifts 
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employees 
    WHERE company_id = (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "Users can manage own shifts" ON shifts 
FOR ALL USING (
  employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view team messages" ON messages 
FOR SELECT USING (
  team_id IN (
    SELECT team_id FROM employees 
    WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can send messages" ON messages 
FOR INSERT WITH CHECK (
  sender_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
```

---

## 🔄 Real-time Setup

### Aktivera real-time för tabeller:
```sql
-- Aktivera real-time publikationer
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
```

---

## 🔧 Functions och Triggers

### Auto-update timestamps:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Lägg till triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📱 Edge Functions (För API-endpoints)

### Skapa Edge Function för shifts:
```sql
-- I Supabase Dashboard → Edge Functions
-- Skapa ny function: get-shifts

-- get-shifts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { employee_id } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('employee_id', employee_id)
    .order('date', { ascending: true })

  return new Response(
    JSON.stringify({ data, error }),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

---

## 🌐 För Loveable Integration

### Så här hämtar Loveable uppdateringarna:

1. **GitHub Repository**: `https://github.com/xXJV10Xx/SkiftApp`
2. **Senaste branch**: `main`
3. **Environment Variables** (från GitHub repository):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_APP_NAME=Skiftappen
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

### Loveable Setup:
1. **Importera från GitHub**: Använd repository URL
2. **Välj main branch**: Senaste uppdateringar
3. **Auto-sync**: Aktivera automatisk synkning
4. **Environment**: Kopiera variabler från `.env`

---

## 📊 Testdata för utveckling

### Lägg till testdata:
```sql
-- Testföretag
INSERT INTO companies (name, slug) VALUES 
  ('Test AB', 'test-ab'),
  ('Demo Corp', 'demo-corp');

-- Testteam
INSERT INTO teams (name, company_id, description) VALUES 
  ('Utvecklingsteam', (SELECT id FROM companies WHERE slug = 'test-ab'), 'Frontend och backend utveckling'),
  ('Support Team', (SELECT id FROM companies WHERE slug = 'test-ab'), 'Kundsupport och teknisk hjälp');

-- Testanvändare (lägg till efter registrering via appen)
-- Detta skapas automatiskt när användare registrerar sig
```

---

## ✅ Deployment Checklist

### Supabase Setup:
- [ ] Databas-schema skapat (kör SQL ovan)
- [ ] RLS policies aktiverade
- [ ] Real-time publikationer aktiverade
- [ ] Edge Functions deployade (om behövs)
- [ ] GitHub integration konfigurerad
- [ ] Environment variables satta

### För Loveable:
- [ ] Repository URL: `https://github.com/xXJV10Xx/SkiftApp`
- [ ] Branch: `main`
- [ ] Environment variables kopierade
- [ ] Auto-sync aktiverat

---

## 🚀 SAMMANFATTNING

**✅ ALLT ÄR KLART FÖR SUPABASE!**

1. **GitHub Repository** är uppdaterad med alla senaste ändringar
2. **Supabase Database** kan konfigureras med SQL-skripten ovan
3. **Loveable** kan hämta all kod från GitHub-repositoryn
4. **Environment Variables** finns i `.env` filen i repositoryn

**Nästa steg**: 
- Kör SQL-skripten i Supabase
- Konfigurera GitHub-integration i Supabase
- Låt Loveable importera från GitHub-repositoryn

**Repository**: `https://github.com/xXJV10Xx/SkiftApp` (main branch) 🚀