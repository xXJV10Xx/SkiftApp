-- SSAB Oxelösund 3-skift Lag 31-35 - Supabase Insert Script
-- Genererad: 2025-07-25T17:59:47.532Z

-- Sätt in företaget
INSERT INTO companies (name, slug, logo_url) VALUES 
  ('SSAB Oxelösund', 'ssab-oxelosund', null)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name;

-- Sätt in lag/teams
INSERT INTO teams (name, description, company_id) VALUES 
  ('Lag 31', '3-skift lag 31 - SSAB Oxelösund', (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'))
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, description, company_id) VALUES 
  ('Lag 32', '3-skift lag 32 - SSAB Oxelösund', (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'))
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, description, company_id) VALUES 
  ('Lag 33', '3-skift lag 33 - SSAB Oxelösund', (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'))
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, description, company_id) VALUES 
  ('Lag 34', '3-skift lag 34 - SSAB Oxelösund', (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'))
ON CONFLICT DO NOTHING;

INSERT INTO teams (name, description, company_id) VALUES 
  ('Lag 35', '3-skift lag 35 - SSAB Oxelösund', (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'))
ON CONFLICT DO NOTHING;

-- Sätt in exempelanställda för varje lag
INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-31-01', 'lag31.medlem1@ssab.se', 'Medlem', '31-1', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 31' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Stålverk', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-31-02', 'lag31.medlem2@ssab.se', 'Medlem', '31-2', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 31' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Varmvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-31-03', 'lag31.medlem3@ssab.se', 'Medlem', '31-3', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 31' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Kallvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-31-04', 'lag31.medlem4@ssab.se', 'Medlem', '31-4', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 31' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Underhåll', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-31-05', 'lag31.medlem5@ssab.se', 'Medlem', '31-5', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 31' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Råmaterial', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-32-01', 'lag32.medlem1@ssab.se', 'Medlem', '32-1', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 32' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Stålverk', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-32-02', 'lag32.medlem2@ssab.se', 'Medlem', '32-2', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 32' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Varmvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-32-03', 'lag32.medlem3@ssab.se', 'Medlem', '32-3', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 32' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Kallvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-32-04', 'lag32.medlem4@ssab.se', 'Medlem', '32-4', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 32' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Underhåll', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-32-05', 'lag32.medlem5@ssab.se', 'Medlem', '32-5', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 32' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Råmaterial', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-33-01', 'lag33.medlem1@ssab.se', 'Medlem', '33-1', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 33' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Stålverk', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-33-02', 'lag33.medlem2@ssab.se', 'Medlem', '33-2', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 33' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Varmvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-33-03', 'lag33.medlem3@ssab.se', 'Medlem', '33-3', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 33' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Kallvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-33-04', 'lag33.medlem4@ssab.se', 'Medlem', '33-4', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 33' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Underhåll', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-33-05', 'lag33.medlem5@ssab.se', 'Medlem', '33-5', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 33' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Råmaterial', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-34-01', 'lag34.medlem1@ssab.se', 'Medlem', '34-1', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 34' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Stålverk', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-34-02', 'lag34.medlem2@ssab.se', 'Medlem', '34-2', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 34' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Varmvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-34-03', 'lag34.medlem3@ssab.se', 'Medlem', '34-3', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 34' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Kallvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-34-04', 'lag34.medlem4@ssab.se', 'Medlem', '34-4', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 34' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Underhåll', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-34-05', 'lag34.medlem5@ssab.se', 'Medlem', '34-5', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 34' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Råmaterial', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-35-01', 'lag35.medlem1@ssab.se', 'Medlem', '35-1', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 35' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Stålverk', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-35-02', 'lag35.medlem2@ssab.se', 'Medlem', '35-2', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 35' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Varmvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-35-03', 'lag35.medlem3@ssab.se', 'Medlem', '35-3', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 35' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Kallvalsning', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-35-04', 'lag35.medlem4@ssab.se', 'Medlem', '35-4', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 35' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Underhåll', 'Operatör')
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (employee_id, email, first_name, last_name, company_id, team_id, department, position) VALUES 
  ('SSAB-OX-35-05', 'lag35.medlem5@ssab.se', 'Medlem', '35-5', 
   (SELECT id FROM companies WHERE slug = 'ssab-oxelosund'),
   (SELECT id FROM teams WHERE name = 'Lag 35' AND company_id = (SELECT id FROM companies WHERE slug = 'ssab-oxelosund')),
   'Råmaterial', 'Operatör')
ON CONFLICT (email) DO NOTHING;

