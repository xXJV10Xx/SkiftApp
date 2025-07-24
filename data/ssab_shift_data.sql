-- data.sql

-- Antag att vi känner till UUID:erna efter att ha skapat dem
-- I praktiken görs detta programmatiskt

-- 1. Infoga själva schemat och dess regler
INSERT INTO schedules (id, name, work_block_length, valid_start_weekdays, default_leave_days, special_leave_days, special_leave_trigger_n_count)
VALUES ('uuid-for-ssab-schedule', 'Anpassat SSAB-skift', 7, '{1,3,5}', 5, 4, 3);

-- 2. Infoga de två typerna av arbetsveckor
INSERT INTO work_patterns (id, schedule_id, name, composition, n_count) VALUES
('uuid-for-standard-pattern', 'uuid-for-ssab-schedule', 'standard_pattern', '{"F","F","F","E","E","N","N"}', 2),
('uuid-for-compact-pattern', 'uuid-for-ssab-schedule', 'compact_pattern', '{"F","F","E","E","N","N","N"}', 3);

-- 3. Infoga de fem skiftlagen
INSERT INTO teams (id, schedule_id, name, alias) VALUES
('uuid-for-team-1', 'uuid-for-ssab-schedule', 'Lag 1', 'Lag 31'),
('uuid-for-team-2', 'uuid-for-ssab-schedule', 'Lag 2', 'Lag 32'),
('uuid-for-team-3', 'uuid-for-ssab-schedule', 'Lag 3', 'Lag 33'),
('uuid-for-team-4', 'uuid-for-ssab-schedule', 'Lag 4', 'Lag 34'),
('uuid-for-team-5', 'uuid-for-ssab-schedule', 'Lag 5', 'Lag 35');

-- 4. Infoga starttillstånden
INSERT INTO team_states (team_id, state_date, block_type, day_in_block, work_pattern_id) VALUES
('uuid-for-team-1', '2025-01-03', 'WORK', 1, 'uuid-for-standard-pattern'),
('uuid-for-team-2', '2025-01-06', 'WORK', 1, 'uuid-for-compact-pattern'),
('uuid-for-team-3', '2025-01-08', 'WORK', 1, 'uuid-for-standard-pattern'),
('uuid-for-team-4', '2025-01-10', 'WORK', 1, 'uuid-for-compact-pattern'),
('uuid-for-team-5', '2025-01-13', 'WORK', 1, 'uuid-for-standard-pattern');

-- 5. Infoga skiftdefinitioner för SSAB-systemet
INSERT INTO shift_definitions (schedule_id, shift_code, shift_name, start_time, end_time, duration_hours, is_work_shift) VALUES
('uuid-for-ssab-schedule', 'F', 'Förmiddag', '06:00', '14:00', 8.0, true),
('uuid-for-ssab-schedule', 'E', 'Eftermiddag', '14:00', '22:00', 8.0, true),
('uuid-for-ssab-schedule', 'N', 'Natt', '22:00', '06:00', 8.0, true),
('uuid-for-ssab-schedule', 'L', 'Ledig', NULL, NULL, 0.0, false);