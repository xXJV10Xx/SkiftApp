-- SQL INSERT statements for shift scheduling tables

-- 1. INSERT into schedules table
-- Adding 'Anpassat SSAB-skift' schedule with known rules
INSERT INTO schedules (name, description, company, rules) VALUES 
('Anpassat SSAB-skift', 'Anpassat skiftschema för SSAB med kontinuerligt 3-skift', 'SSAB', 
 '{"cycle_length": 14, "shift_codes": {"M": "Morgon (06:00-14:00)", "A": "Kväll (14:00-22:00)", "N": "Natt (22:00-06:00)", "L": "Ledig"}, "base_pattern": ["M", "M", "M", "A", "A", "A", "N", "N", "N", "L", "L", "L", "L", "L"]}');

-- 2. INSERT into work_patterns table
-- Adding standard_pattern (3F, 2E, 2N) and compact_pattern (2F, 2E, 3N)
INSERT INTO work_patterns (name, description, pattern_code, cycle_length) VALUES 
('standard_pattern', 'Standard arbetsmönster med 3 förmiddagar, 2 eftermiddagar, 2 nätter', '3F,2E,2N', 7),
('compact_pattern', 'Kompakt arbetsmönster med 2 förmiddagar, 2 eftermiddagar, 3 nätter', '2F,2E,3N', 7);

-- 3. INSERT into teams table
-- Adding 5 teams (Lag 1-5 with aliases Lag 31-35)
INSERT INTO teams (name, alias, description, color) VALUES 
('Lag 1', 'Lag 31', 'Första skiftlaget', '#FF6B35'),
('Lag 2', 'Lag 32', 'Andra skiftlaget', '#004E89'),
('Lag 3', 'Lag 33', 'Tredje skiftlaget', '#1A936F'),
('Lag 4', 'Lag 34', 'Fjärde skiftlaget', '#C6426E'),
('Lag 5', 'Lag 35', 'Femte skiftlaget', '#6F1E51');

-- 4. INSERT into team_states table
-- Adding initial states for teams based on specified start dates
INSERT INTO team_states (team_id, work_pattern_id, start_date, current_position, status) VALUES 
((SELECT id FROM teams WHERE name = 'Lag 1'), (SELECT id FROM work_patterns WHERE name = 'standard_pattern'), '2025-01-03', 0, 'active'),
((SELECT id FROM teams WHERE name = 'Lag 2'), (SELECT id FROM work_patterns WHERE name = 'compact_pattern'), '2025-01-06', 0, 'active'),
((SELECT id FROM teams WHERE name = 'Lag 3'), (SELECT id FROM work_patterns WHERE name = 'standard_pattern'), '2025-01-08', 0, 'active'),
((SELECT id FROM teams WHERE name = 'Lag 4'), NULL, NULL, NULL, 'inactive'),
((SELECT id FROM teams WHERE name = 'Lag 5'), NULL, NULL, NULL, 'inactive');

-- Optional: Add some additional context data for better functionality

-- Add shift type definitions that match the patterns
INSERT INTO shift_types (code, name, start_time, end_time, description) VALUES 
('F', 'Förmiddag', '06:00', '14:00', 'Förmiddagsskift'),
('E', 'Eftermiddag', '14:00', '22:00', 'Eftermiddagsskift'),
('N', 'Natt', '22:00', '06:00', 'Nattskift'),
('L', 'Ledig', NULL, NULL, 'Ledig dag');

-- Add schedule assignments linking teams to the SSAB schedule
INSERT INTO schedule_assignments (team_id, schedule_id, assigned_date, notes) VALUES 
((SELECT id FROM teams WHERE name = 'Lag 1'), (SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), '2025-01-03', 'Initial assignment for Lag 31'),
((SELECT id FROM teams WHERE name = 'Lag 2'), (SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), '2025-01-06', 'Initial assignment for Lag 32'),
((SELECT id FROM teams WHERE name = 'Lag 3'), (SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), '2025-01-08', 'Initial assignment for Lag 33'),
((SELECT id FROM teams WHERE name = 'Lag 4'), (SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), NULL, 'Not yet assigned'),
((SELECT id FROM teams WHERE name = 'Lag 5'), (SELECT id FROM schedules WHERE name = 'Anpassat SSAB-skift'), NULL, 'Not yet assigned');