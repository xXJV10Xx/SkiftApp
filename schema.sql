-- Supabase Schema för Chat-app
-- Skapad för företags-/avdelnings-baserad chat med formulär

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    profile_image TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    has_calendar_export BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    accepted BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'form_response', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shift forms table
CREATE TABLE shift_forms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('skiftöverlämning', 'jobba extra', 'haveri')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(50), -- 'dag', 'kväll', 'natt', etc.
    description TEXT,
    status VARCHAR(50) DEFAULT 'öppen' CHECK (status IN ('öppen', 'besvarad')),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    interested_users UUID[], -- Array of user IDs who are interested
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table (för kalender-export)
CREATE TABLE payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL, -- Amount in öre (99 kr = 9900)
    currency VARCHAR(3) DEFAULT 'SEK',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'succeeded', 'failed'
    feature_type VARCHAR(50) NOT NULL, -- 'calendar_export'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_is_online ON users(is_online);
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_shift_forms_type ON shift_forms(type);
CREATE INDEX idx_shift_forms_status ON shift_forms(status);
CREATE INDEX idx_shift_forms_date ON shift_forms(date);
CREATE INDEX idx_shift_forms_company_id ON shift_forms(company_id);

-- Row Level Security (RLS) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only see data from their company)
CREATE POLICY "Users can view their company data" ON companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view their department data" ON departments
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view their team data" ON teams
    FOR SELECT USING (department_id IN (
        SELECT department_id FROM departments WHERE company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can view company users" ON users
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view company groups" ON groups
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create groups in their company" ON groups
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view group memberships" ON group_members
    FOR SELECT USING (group_id IN (
        SELECT id FROM groups WHERE company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can join groups" ON group_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view group messages" ON messages
    FOR SELECT USING (group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid() AND accepted = true
    ));

CREATE POLICY "Users can send messages to joined groups" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid() AND accepted = true
        )
    );

CREATE POLICY "Users can view company shift forms" ON shift_forms
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create shift forms" ON shift_forms
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shift forms" ON shift_forms
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_forms_updated_at BEFORE UPDATE ON shift_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data för testning
INSERT INTO companies (name, location) VALUES 
('TechCorp AB', 'Stockholm'),
('HealthCare Inc', 'Göteborg');

INSERT INTO departments (company_id, name) VALUES 
((SELECT id FROM companies WHERE name = 'TechCorp AB'), 'IT'),
((SELECT id FROM companies WHERE name = 'TechCorp AB'), 'HR'),
((SELECT id FROM companies WHERE name = 'HealthCare Inc'), 'Sjukvård');

INSERT INTO teams (department_id, name) VALUES 
((SELECT id FROM departments WHERE name = 'IT'), 'Frontend'),
((SELECT id FROM departments WHERE name = 'IT'), 'Backend'),
((SELECT id FROM departments WHERE name = 'HR'), 'Rekrytering');