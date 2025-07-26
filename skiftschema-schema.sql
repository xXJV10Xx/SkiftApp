-- Skiftschema.se Database Schema
-- Generated on 2025-01-17

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table  
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table for storing schedule data
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    date DATE NOT NULL,
    shift_type VARCHAR(10), -- F, E, N, L
    start_time TIME,
    end_time TIME,
    raw_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, date)
);

-- Insert companies
INSERT INTO companies (id, name) VALUES (1, 'ABB') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (2, 'Aga') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (3, 'Arctic Paper') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (4, 'Avesta') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (5, 'Barilla') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (6, 'Billerudkorsnäs') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (7, 'Boliden') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (8, 'SSAB') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (9, 'LKAB') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (10, 'Stora Enso') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (11, 'Holmen') ON CONFLICT (name) DO NOTHING;
INSERT INTO companies (id, name) VALUES (12, 'Sandvik') ON CONFLICT (name) DO NOTHING;

-- Insert departments
INSERT INTO departments (id, company_id, name) VALUES (1, 1, 'HVC');
INSERT INTO departments (id, company_id, name) VALUES (2, 2, 'Avesta');
INSERT INTO departments (id, company_id, name) VALUES (3, 3, 'Grycksbo');
INSERT INTO departments (id, company_id, name) VALUES (4, 4, '6v Natt');
INSERT INTO departments (id, company_id, name) VALUES (5, 5, 'Filipstad');
INSERT INTO departments (id, company_id, name) VALUES (6, 6, 'Gruvön Grums');
INSERT INTO departments (id, company_id, name) VALUES (7, 7, 'Aitik Gruva');
INSERT INTO departments (id, company_id, name) VALUES (8, 8, 'Borlänge');
INSERT INTO departments (id, company_id, name) VALUES (9, 8, 'Oxelösund');
INSERT INTO departments (id, company_id, name) VALUES (10, 9, 'Kiruna');
INSERT INTO departments (id, company_id, name) VALUES (11, 9, 'Malmberget');
INSERT INTO departments (id, company_id, name) VALUES (12, 10, 'Nymölla');
INSERT INTO departments (id, company_id, name) VALUES (13, 10, 'Fors');
INSERT INTO departments (id, company_id, name) VALUES (14, 11, 'Hallsta');
INSERT INTO departments (id, company_id, name) VALUES (15, 12, 'Sandviken');

-- Insert teams
INSERT INTO teams (id, department_id, name, url) VALUES (1, 1, 'Skift 1', 'https://www.skiftschema.se/schema/abb_hvc_5skift/1');
INSERT INTO teams (id, department_id, name, url) VALUES (2, 1, 'Skift 2', 'https://www.skiftschema.se/schema/abb_hvc_5skift/2');
INSERT INTO teams (id, department_id, name, url) VALUES (3, 1, 'Skift 3', 'https://www.skiftschema.se/schema/abb_hvc_5skift/3');
INSERT INTO teams (id, department_id, name, url) VALUES (4, 1, 'Skift 4', 'https://www.skiftschema.se/schema/abb_hvc_5skift/4');
INSERT INTO teams (id, department_id, name, url) VALUES (5, 1, 'Skift 5', 'https://www.skiftschema.se/schema/abb_hvc_5skift/5');
INSERT INTO teams (id, department_id, name, url) VALUES (6, 2, 'A-lag', 'https://www.skiftschema.se/schema/aga_avesta_6skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (7, 2, 'B-lag', 'https://www.skiftschema.se/schema/aga_avesta_6skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (8, 2, 'C-lag', 'https://www.skiftschema.se/schema/aga_avesta_6skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (9, 2, 'D-lag', 'https://www.skiftschema.se/schema/aga_avesta_6skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (10, 2, 'E-lag', 'https://www.skiftschema.se/schema/aga_avesta_6skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (11, 2, 'F-lag', 'https://www.skiftschema.se/schema/aga_avesta_6skift/F');
INSERT INTO teams (id, department_id, name, url) VALUES (12, 3, 'Lag-1', 'https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/1');
INSERT INTO teams (id, department_id, name, url) VALUES (13, 3, 'Lag-2', 'https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/2');
INSERT INTO teams (id, department_id, name, url) VALUES (14, 3, 'Lag-3', 'https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/3');
INSERT INTO teams (id, department_id, name, url) VALUES (15, 3, 'Lag-4', 'https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/4');
INSERT INTO teams (id, department_id, name, url) VALUES (16, 3, 'Lag-5', 'https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/5');
INSERT INTO teams (id, department_id, name, url) VALUES (17, 4, 'Grupp 1', 'https://www.skiftschema.se/schema/avesta_6v_nattschema/1');
INSERT INTO teams (id, department_id, name, url) VALUES (18, 4, 'Grupp 2', 'https://www.skiftschema.se/schema/avesta_6v_nattschema/2');
INSERT INTO teams (id, department_id, name, url) VALUES (19, 4, 'Grupp 3', 'https://www.skiftschema.se/schema/avesta_6v_nattschema/3');
INSERT INTO teams (id, department_id, name, url) VALUES (20, 4, 'Grupp 4', 'https://www.skiftschema.se/schema/avesta_6v_nattschema/4');
INSERT INTO teams (id, department_id, name, url) VALUES (21, 4, 'Grupp 5', 'https://www.skiftschema.se/schema/avesta_6v_nattschema/5');
INSERT INTO teams (id, department_id, name, url) VALUES (22, 4, 'Grupp 6', 'https://www.skiftschema.se/schema/avesta_6v_nattschema/6');
INSERT INTO teams (id, department_id, name, url) VALUES (23, 5, 'Lag 1', 'https://www.skiftschema.se/schema/barilla_sverige_filipstad/1');
INSERT INTO teams (id, department_id, name, url) VALUES (24, 5, 'Lag 2', 'https://www.skiftschema.se/schema/barilla_sverige_filipstad/2');
INSERT INTO teams (id, department_id, name, url) VALUES (25, 5, 'Lag 3', 'https://www.skiftschema.se/schema/barilla_sverige_filipstad/3');
INSERT INTO teams (id, department_id, name, url) VALUES (26, 5, 'Lag 4', 'https://www.skiftschema.se/schema/barilla_sverige_filipstad/4');
INSERT INTO teams (id, department_id, name, url) VALUES (27, 5, 'Lag 5', 'https://www.skiftschema.se/schema/barilla_sverige_filipstad/5');
INSERT INTO teams (id, department_id, name, url) VALUES (28, 6, 'Lag A', 'https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/A');
INSERT INTO teams (id, department_id, name, url) VALUES (29, 6, 'Lag B', 'https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/B');
INSERT INTO teams (id, department_id, name, url) VALUES (30, 6, 'Lag C', 'https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/C');
INSERT INTO teams (id, department_id, name, url) VALUES (31, 6, 'Lag D', 'https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/D');
INSERT INTO teams (id, department_id, name, url) VALUES (32, 6, 'Lag E', 'https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/E');
INSERT INTO teams (id, department_id, name, url) VALUES (33, 7, 'Lag 1', 'https://www.skiftschema.se/schema/boliden_aitik_gruva_k3/1');
INSERT INTO teams (id, department_id, name, url) VALUES (34, 7, 'Lag 2', 'https://www.skiftschema.se/schema/boliden_aitik_gruva_k3/2');
INSERT INTO teams (id, department_id, name, url) VALUES (35, 7, 'Lag 3', 'https://www.skiftschema.se/schema/boliden_aitik_gruva_k3/3');
INSERT INTO teams (id, department_id, name, url) VALUES (36, 8, 'A-skift', 'https://www.skiftschema.se/schema/ssab_borlange_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (37, 8, 'B-skift', 'https://www.skiftschema.se/schema/ssab_borlange_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (38, 8, 'C-skift', 'https://www.skiftschema.se/schema/ssab_borlange_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (39, 8, 'D-skift', 'https://www.skiftschema.se/schema/ssab_borlange_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (40, 8, 'E-skift', 'https://www.skiftschema.se/schema/ssab_borlange_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (41, 9, 'A-skift', 'https://www.skiftschema.se/schema/ssab_oxelosund_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (42, 9, 'B-skift', 'https://www.skiftschema.se/schema/ssab_oxelosund_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (43, 9, 'C-skift', 'https://www.skiftschema.se/schema/ssab_oxelosund_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (44, 9, 'D-skift', 'https://www.skiftschema.se/schema/ssab_oxelosund_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (45, 9, 'E-skift', 'https://www.skiftschema.se/schema/ssab_oxelosund_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (46, 10, 'A-skift', 'https://www.skiftschema.se/schema/lkab_kiruna_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (47, 10, 'B-skift', 'https://www.skiftschema.se/schema/lkab_kiruna_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (48, 10, 'C-skift', 'https://www.skiftschema.se/schema/lkab_kiruna_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (49, 10, 'D-skift', 'https://www.skiftschema.se/schema/lkab_kiruna_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (50, 10, 'E-skift', 'https://www.skiftschema.se/schema/lkab_kiruna_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (51, 11, 'A-skift', 'https://www.skiftschema.se/schema/lkab_malmberget_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (52, 11, 'B-skift', 'https://www.skiftschema.se/schema/lkab_malmberget_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (53, 11, 'C-skift', 'https://www.skiftschema.se/schema/lkab_malmberget_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (54, 11, 'D-skift', 'https://www.skiftschema.se/schema/lkab_malmberget_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (55, 11, 'E-skift', 'https://www.skiftschema.se/schema/lkab_malmberget_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (56, 12, 'A-lag', 'https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (57, 12, 'B-lag', 'https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (58, 12, 'C-lag', 'https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (59, 12, 'D-lag', 'https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (60, 12, 'E-lag', 'https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (61, 13, 'A-lag', 'https://www.skiftschema.se/schema/stora_enso_fors_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (62, 13, 'B-lag', 'https://www.skiftschema.se/schema/stora_enso_fors_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (63, 13, 'C-lag', 'https://www.skiftschema.se/schema/stora_enso_fors_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (64, 13, 'D-lag', 'https://www.skiftschema.se/schema/stora_enso_fors_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (65, 13, 'E-lag', 'https://www.skiftschema.se/schema/stora_enso_fors_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (66, 14, 'A-lag', 'https://www.skiftschema.se/schema/holmen_hallsta_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (67, 14, 'B-lag', 'https://www.skiftschema.se/schema/holmen_hallsta_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (68, 14, 'C-lag', 'https://www.skiftschema.se/schema/holmen_hallsta_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (69, 14, 'D-lag', 'https://www.skiftschema.se/schema/holmen_hallsta_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (70, 14, 'E-lag', 'https://www.skiftschema.se/schema/holmen_hallsta_5skift/E');
INSERT INTO teams (id, department_id, name, url) VALUES (71, 15, 'A-skift', 'https://www.skiftschema.se/schema/sandvik_sandviken_5skift/A');
INSERT INTO teams (id, department_id, name, url) VALUES (72, 15, 'B-skift', 'https://www.skiftschema.se/schema/sandvik_sandviken_5skift/B');
INSERT INTO teams (id, department_id, name, url) VALUES (73, 15, 'C-skift', 'https://www.skiftschema.se/schema/sandvik_sandviken_5skift/C');
INSERT INTO teams (id, department_id, name, url) VALUES (74, 15, 'D-skift', 'https://www.skiftschema.se/schema/sandvik_sandviken_5skift/D');
INSERT INTO teams (id, department_id, name, url) VALUES (75, 15, 'E-skift', 'https://www.skiftschema.se/schema/sandvik_sandviken_5skift/E');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_team_date ON shifts(team_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_type ON shifts(shift_type);

-- Create views for easier querying
CREATE OR REPLACE VIEW team_schedules AS
SELECT 
    c.name as company,
    d.name as department,
    t.name as team,
    s.date,
    s.shift_type,
    s.start_time,
    s.end_time,
    s.raw_data
FROM companies c
JOIN departments d ON c.id = d.company_id
JOIN teams t ON d.id = t.department_id
JOIN shifts s ON t.id = s.team_id
ORDER BY c.name, d.name, t.name, s.date;