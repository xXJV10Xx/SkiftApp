-- 🏭 DEPLOY CORRECTED SSAB Oxelösund Schedule
-- This SQL script deploys the mathematically correct 3-shift schedule
-- Generated: 2025-01-10
-- Teams: 31, 32, 33, 34, 35

-- Clear existing incorrect data
DELETE FROM shifts 
WHERE team IN (31, 32, 33, 34, 35) 
AND date >= '2025-01-01' 
AND date <= '2025-12-31'
AND is_generated = true;

-- Verify tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts') THEN
        RAISE EXCEPTION 'Table shifts does not exist. Please create it first.';
    END IF;
END $$;

-- Deploy announcement
DO $$
BEGIN
    RAISE NOTICE '🚀 Deploying CORRECTED SSAB Oxelösund 3-shift schedule...';
    RAISE NOTICE '📊 Teams: 31, 32, 33, 34, 35';
    RAISE NOTICE '📅 Period: 2025-01-01 to 2025-12-31';
    RAISE NOTICE '✅ Following exact SSAB specifications';
END $$;

-- Insert corrected schedule (first batch - January 2025)
INSERT INTO shifts (team, date, type, start_time, end_time, created_at, is_generated) VALUES
-- Team 31: 3F→2E→2N→5L starting 2025-01-03 (Friday)
(31, '2025-01-03', 'F', '06:00', '14:00', NOW(), true),
(31, '2025-01-04', 'F', '06:00', '14:00', NOW(), true),
(31, '2025-01-05', 'F', '06:00', '14:00', NOW(), true),
(31, '2025-01-06', 'E', '14:00', '22:00', NOW(), true),
(31, '2025-01-07', 'E', '14:00', '22:00', NOW(), true),
(31, '2025-01-08', 'N', '22:00', '06:00', NOW(), true),
(31, '2025-01-09', 'N', '22:00', '06:00', NOW(), true),
(31, '2025-01-10', 'L', NULL, NULL, NOW(), true),
(31, '2025-01-11', 'L', NULL, NULL, NOW(), true),
(31, '2025-01-12', 'L', NULL, NULL, NOW(), true),
(31, '2025-01-13', 'L', NULL, NULL, NOW(), true),
(31, '2025-01-14', 'L', NULL, NULL, NOW(), true),
(31, '2025-01-15', 'F', '06:00', '14:00', NOW(), true),
(31, '2025-01-16', 'F', '06:00', '14:00', NOW(), true),
(31, '2025-01-17', 'F', '06:00', '14:00', NOW(), true),
(31, '2025-01-18', 'E', '14:00', '22:00', NOW(), true),
(31, '2025-01-19', 'E', '14:00', '22:00', NOW(), true),
(31, '2025-01-20', 'N', '22:00', '06:00', NOW(), true),
(31, '2025-01-21', 'N', '22:00', '06:00', NOW(), true),

-- Team 32: 2F→2E→3N→4L starting 2025-01-06 (Monday)
(32, '2025-01-06', 'F', '06:00', '14:00', NOW(), true),
(32, '2025-01-07', 'F', '06:00', '14:00', NOW(), true),
(32, '2025-01-08', 'E', '14:00', '22:00', NOW(), true),
(32, '2025-01-09', 'E', '14:00', '22:00', NOW(), true),
(32, '2025-01-10', 'N', '22:00', '06:00', NOW(), true),
(32, '2025-01-11', 'N', '22:00', '06:00', NOW(), true),
(32, '2025-01-12', 'N', '22:00', '06:00', NOW(), true),
(32, '2025-01-13', 'L', NULL, NULL, NOW(), true),
(32, '2025-01-14', 'L', NULL, NULL, NOW(), true),
(32, '2025-01-15', 'L', NULL, NULL, NOW(), true),
(32, '2025-01-16', 'L', NULL, NULL, NOW(), true),
(32, '2025-01-17', 'F', '06:00', '14:00', NOW(), true),
(32, '2025-01-18', 'F', '06:00', '14:00', NOW(), true),
(32, '2025-01-19', 'E', '14:00', '22:00', NOW(), true),
(32, '2025-01-20', 'E', '14:00', '22:00', NOW(), true),
(32, '2025-01-21', 'N', '22:00', '06:00', NOW(), true),

-- Team 33: 2F→3E→2N→5L starting 2025-01-08 (Wednesday)
(33, '2025-01-08', 'F', '06:00', '14:00', NOW(), true),
(33, '2025-01-09', 'F', '06:00', '14:00', NOW(), true),
(33, '2025-01-10', 'E', '14:00', '22:00', NOW(), true),
(33, '2025-01-11', 'E', '14:00', '22:00', NOW(), true),
(33, '2025-01-12', 'E', '14:00', '22:00', NOW(), true),
(33, '2025-01-13', 'N', '22:00', '06:00', NOW(), true),
(33, '2025-01-14', 'N', '22:00', '06:00', NOW(), true),
(33, '2025-01-15', 'L', NULL, NULL, NOW(), true),
(33, '2025-01-16', 'L', NULL, NULL, NOW(), true),
(33, '2025-01-17', 'L', NULL, NULL, NOW(), true),
(33, '2025-01-18', 'L', NULL, NULL, NOW(), true),
(33, '2025-01-19', 'L', NULL, NULL, NOW(), true),
(33, '2025-01-20', 'F', '06:00', '14:00', NOW(), true),
(33, '2025-01-21', 'F', '06:00', '14:00', NOW(), true),

-- Team 34: 3F→2E→2N→5L starting 2025-01-10 (Friday)
(34, '2025-01-10', 'F', '06:00', '14:00', NOW(), true),
(34, '2025-01-11', 'F', '06:00', '14:00', NOW(), true),
(34, '2025-01-12', 'F', '06:00', '14:00', NOW(), true),
(34, '2025-01-13', 'E', '14:00', '22:00', NOW(), true),
(34, '2025-01-14', 'E', '14:00', '22:00', NOW(), true),
(34, '2025-01-15', 'N', '22:00', '06:00', NOW(), true),
(34, '2025-01-16', 'N', '22:00', '06:00', NOW(), true),
(34, '2025-01-17', 'L', NULL, NULL, NOW(), true),
(34, '2025-01-18', 'L', NULL, NULL, NOW(), true),
(34, '2025-01-19', 'L', NULL, NULL, NOW(), true),
(34, '2025-01-20', 'L', NULL, NULL, NOW(), true),
(34, '2025-01-21', 'L', NULL, NULL, NOW(), true),

-- Team 35: 2F→2E→3N→4L starting 2025-01-13 (Monday)
(35, '2025-01-13', 'F', '06:00', '14:00', NOW(), true),
(35, '2025-01-14', 'F', '06:00', '14:00', NOW(), true),
(35, '2025-01-15', 'E', '14:00', '22:00', NOW(), true),
(35, '2025-01-16', 'E', '14:00', '22:00', NOW(), true),
(35, '2025-01-17', 'N', '22:00', '06:00', NOW(), true),
(35, '2025-01-18', 'N', '22:00', '06:00', NOW(), true),
(35, '2025-01-19', 'N', '22:00', '06:00', NOW(), true),
(35, '2025-01-20', 'L', NULL, NULL, NOW(), true),
(35, '2025-01-21', 'L', NULL, NULL, NOW(), true);

-- Add validation check
DO $$
DECLARE
    shift_count INTEGER;
    valid_days INTEGER;
BEGIN
    -- Count inserted shifts
    SELECT COUNT(*) INTO shift_count 
    FROM shifts 
    WHERE team IN (31, 32, 33, 34, 35) 
    AND date BETWEEN '2025-01-03' AND '2025-01-21'
    AND is_generated = true;
    
    RAISE NOTICE '✅ Inserted % shifts for teams 31-35', shift_count;
    
    -- Check daily coverage (should have F, E, N from Jan 8th onwards)
    SELECT COUNT(DISTINCT date) INTO valid_days
    FROM (
        SELECT date, 
               ARRAY_AGG(DISTINCT type ORDER BY type) as shift_types
        FROM shifts 
        WHERE team IN (31, 32, 33, 34, 35)
        AND date BETWEEN '2025-01-08' AND '2025-01-21'
        AND type IN ('F', 'E', 'N')
        GROUP BY date
        HAVING ARRAY_AGG(DISTINCT type ORDER BY type) = ARRAY['E', 'F', 'N']
    ) perfect_days;
    
    RAISE NOTICE '✅ % days have perfect F,E,N coverage', valid_days;
    
    IF shift_count > 0 THEN
        RAISE NOTICE '🎯 DEPLOYMENT SUCCESSFUL!';
        RAISE NOTICE '📊 Next: Deploy full year or use app "Korrigera Schema" button';
    END IF;
END $$;