# 🗄️ Supabase Deployment Guide - Skiftappen

## 📊 Nuvarande Supabase-konfiguration

### Projekt Information:
- **URL**: `https://fsefeherdbtsddqimjco.supabase.co`
- **Anon Key**: Se `.env` fil
- **Status**: ✅ Aktivt och konfigurerat

## 🗃️ Databas Schema (Uppdaterad)

### Huvudtabeller:

#### 1. companies
```sql
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. employees
```sql
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  team_id UUID REFERENCES teams(id),
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. teams
```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. shifts (NYA UPPDATERINGAR)
```sql
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
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
```

#### 5. messages
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES employees(id),
  team_id UUID REFERENCES teams(id),
  message_type TEXT DEFAULT 'text',
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. profiles (Auth Integration)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'sv',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 Row Level Security (RLS) Policies

### Aktivera RLS för alla tabeller:
```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Säkerhetspolicies:

#### Companies
```sql
CREATE POLICY "Users can view companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Employees
```sql
CREATE POLICY "Users can view employees in same company" ON employees
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update own employee record" ON employees
  FOR UPDATE USING (
    id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );
```

#### Shifts (NYA POLICIES)
```sql
CREATE POLICY "Users can view shifts in same company" ON shifts
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
```

#### Messages
```sql
CREATE POLICY "Users can view messages in their teams" ON messages
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their teams" ON messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND team_id IN (
      SELECT team_id FROM employees 
      WHERE id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );
```

#### Profiles
```sql
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
```

## 🔄 Real-time Subscriptions

### Aktivera real-time för tabeller:
```sql
-- Aktivera real-time för meddelanden
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Aktivera real-time för scheman
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;

-- Aktivera real-time för medarbetarstatus
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
```

## 🔧 Funktioner och Triggers

### Auto-update timestamps:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Lägg till triggers för alla tabeller
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📱 Auth Configuration

### Email/Password Auth:
- ✅ Aktiverat
- ✅ Email-bekräftelse konfigurerad
- ✅ Lösenordsåterställning fungerar

### Google OAuth:
- ✅ Konfigurerat
- **Redirect URLs**:
  - `skiftappen://auth/callback` (mobil)
  - `http://localhost:8081` (development)

## 🔍 API Endpoints

### Supabase Client Configuration:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 📊 Testdata (Utveckling)

### Skapa testföretag:
```sql
INSERT INTO companies (name, slug) VALUES 
  ('Test AB', 'test-ab'),
  ('Demo Corp', 'demo-corp');
```

### Skapa testteam:
```sql
INSERT INTO teams (name, company_id) VALUES 
  ('Utvecklingsteam', (SELECT id FROM companies WHERE slug = 'test-ab')),
  ('Support Team', (SELECT id FROM companies WHERE slug = 'test-ab'));
```

## 🚀 Deployment Checklist

### Före deployment:
- [ ] Verifiera alla tabeller är skapade
- [ ] Kontrollera RLS-policies
- [ ] Testa auth-funktionalitet
- [ ] Aktivera real-time subscriptions
- [ ] Konfigurera Google OAuth
- [ ] Lägg till testdata

### Efter deployment:
- [ ] Testa mobilapp-anslutning
- [ ] Verifiera real-time chat
- [ ] Testa schemahantering
- [ ] Kontrollera säkerhetspolicies
- [ ] Övervaka prestanda

## 🔧 Maintenance

### Regelbundna uppgifter:
1. **Backup**: Automatisk backup är aktiverad
2. **Monitoring**: Övervaka API-användning
3. **Security**: Granska RLS-policies regelbundet
4. **Performance**: Optimera queries vid behov

---
**Supabase är redo!** ✅
Backend är komplett konfigurerat och redo för produktion.