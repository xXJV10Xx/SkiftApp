-- Insert sample locations
INSERT INTO public.locations (id, name, description, address) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Huvudkontor', 'Huvudkontoret i Stockholm', 'Storgatan 1, 111 22 Stockholm'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Lager Nord', 'Norra lagret', 'Industrivägen 15, 171 41 Solna'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Butik Söder', 'Butik på Södermalm', 'Götgatan 45, 116 21 Stockholm'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Kundservice', 'Kundservicecenter', 'Servicegatan 10, 112 19 Stockholm');

-- Note: Users will be created through Supabase Auth, but we can prepare some sample data
-- This assumes you have created users through the auth system first

-- Sample shifts (using placeholder UUIDs - replace with actual user IDs when available)
INSERT INTO public.shifts (
  id, 
  title, 
  description, 
  start_time, 
  end_time, 
  location_id, 
  created_by, 
  status,
  hourly_rate,
  requirements
) VALUES
  (
    '650e8400-e29b-41d4-a716-446655440001',
    'Morgonpass - Reception',
    'Bemanna receptionen under morgonpasset. Hantera inkommande samtal och besökare.',
    '2024-01-15 06:00:00+01',
    '2024-01-15 14:00:00+01',
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
    'open',
    180.00,
    ARRAY['Kundservice', 'Telefon']
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002',
    'Kvällspass - Lager',
    'Lageransvarig för kvällspasset. Hantera inkommande och utgående varor.',
    '2024-01-15 14:00:00+01',
    '2024-01-15 22:00:00+01',
    '550e8400-e29b-41d4-a716-446655440002',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
    'open',
    195.00,
    ARRAY['Lagerhantering', 'Truckkort']
  ),
  (
    '650e8400-e29b-41d4-a716-446655440003',
    'Helgpass - Butik',
    'Butikssäljare för helgpasset. Hjälpa kunder och hantera kassan.',
    '2024-01-16 10:00:00+01',
    '2024-01-16 18:00:00+01',
    '550e8400-e29b-41d4-a716-446655440003',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
    'open',
    175.00,
    ARRAY['Försäljning', 'Kassa']
  ),
  (
    '650e8400-e29b-41d4-a716-446655440004',
    'Nattpass - Säkerhet',
    'Säkerhetsansvarig under natten. Ronda och övervaka lokalerna.',
    '2024-01-15 22:00:00+01',
    '2024-01-16 06:00:00+01',
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
    'open',
    200.00,
    ARRAY['Säkerhet', 'Väktarutbildning']
  ),
  (
    '650e8400-e29b-41d4-a716-446655440005',
    'Kundservice - Telefon',
    'Hantera inkommande kundärenden via telefon och e-post.',
    '2024-01-17 08:00:00+01',
    '2024-01-17 16:00:00+01',
    '550e8400-e29b-41d4-a716-446655440004',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
    'open',
    170.00,
    ARRAY['Kundservice', 'Datorkunnighet']
  );

-- Sample recurring shift pattern
INSERT INTO public.shifts (
  id,
  title,
  description,
  start_time,
  end_time,
  location_id,
  created_by,
  status,
  hourly_rate,
  is_recurring,
  recurring_pattern
) VALUES
  (
    '650e8400-e29b-41d4-a716-446655440006',
    'Veckovis städning',
    'Städning av kontoret varje måndag morgon.',
    '2024-01-22 07:00:00+01',
    '2024-01-22 11:00:00+01',
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
    'open',
    160.00,
    true,
    '{"frequency": "weekly", "dayOfWeek": 1, "endDate": "2024-12-31"}'::jsonb
  );

-- Sample notifications (replace user_id with actual user IDs)
INSERT INTO public.notifications (user_id, title, message, type) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Välkommen till Skiftappen!', 'Ditt konto har skapats. Börja utforska tillgängliga skift.', 'success'),
  ('00000000-0000-0000-0000-000000000000', 'Nytt skift tillgängligt', 'Ett nytt morgonpass har lagts till för nästa vecka.', 'info'),
  ('00000000-0000-0000-0000-000000000000', 'Påminnelse: Kommande skift', 'Du har ett skift imorgon kl 06:00. Glöm inte att checka in!', 'warning');

-- Sample availability (replace user_id with actual user IDs)
-- This represents when a user is available to work
INSERT INTO public.availability (user_id, day_of_week, start_time, end_time) VALUES
  -- Monday to Friday, 8-17
  ('00000000-0000-0000-0000-000000000000', 1, '08:00', '17:00'),
  ('00000000-0000-0000-0000-000000000000', 2, '08:00', '17:00'),
  ('00000000-0000-0000-0000-000000000000', 3, '08:00', '17:00'),
  ('00000000-0000-0000-0000-000000000000', 4, '08:00', '17:00'),
  ('00000000-0000-0000-0000-000000000000', 5, '08:00', '17:00'),
  -- Weekend availability
  ('00000000-0000-0000-0000-000000000000', 6, '10:00', '18:00'),
  ('00000000-0000-0000-0000-000000000000', 0, '10:00', '18:00');

-- Sample time off request
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, reason, status) VALUES
  ('00000000-0000-0000-0000-000000000000', '2024-02-15', '2024-02-16', 'vacation', 'Planerad semester', 'pending');

-- Function to create sample users (to be called after auth users are created)
CREATE OR REPLACE FUNCTION create_sample_users()
RETURNS void AS $$
BEGIN
  -- This function should be called after creating users in Supabase Auth
  -- Replace the UUIDs with actual auth.users IDs
  
  -- Example of how to insert users (uncomment and modify when you have real user IDs):
  /*
  INSERT INTO public.users (id, email, name, role, phone, department) VALUES
    ('user-uuid-1', 'admin@skiftappen.se', 'Admin Användare', 'admin', '+46701234567', 'IT'),
    ('user-uuid-2', 'manager@skiftappen.se', 'Manager Användare', 'manager', '+46701234568', 'Operations'),
    ('user-uuid-3', 'employee1@skiftappen.se', 'Anna Andersson', 'employee', '+46701234569', 'Sales'),
    ('user-uuid-4', 'employee2@skiftappen.se', 'Erik Eriksson', 'employee', '+46701234570', 'Warehouse'),
    ('user-uuid-5', 'employee3@skiftappen.se', 'Maria Svensson', 'employee', '+46701234571', 'Security');
  */
  
  RAISE NOTICE 'Sample users function created. Call this after creating auth users.';
END;
$$ LANGUAGE plpgsql;

-- Create some sample scraped shifts (as if they came from the scraper)
INSERT INTO public.shifts (
  title,
  description,
  start_time,
  end_time,
  location_name,
  created_by,
  status,
  scraped_at,
  scraped_source
) VALUES
  (
    'Extrajobb - Eventpersonal',
    'Hjälp till under stor konferens. Registrering och vägledning av deltagare.',
    '2024-01-20 08:00:00+01',
    '2024-01-20 17:00:00+01',
    'Stockholmsmässan',
    '00000000-0000-0000-0000-000000000000',
    'open',
    NOW(),
    'https://example.com/jobs/event-staff'
  ),
  (
    'Vikariejobb - Receptionist',
    'Vikarie för receptionist under sjukfrånvaro.',
    '2024-01-18 09:00:00+01',
    '2024-01-18 17:00:00+01',
    'Kontorsbyggnad Östermalm',
    '00000000-0000-0000-0000-000000000000',
    'open',
    NOW(),
    'https://example.com/jobs/temp-receptionist'
  );

-- Add some sample audit log entries
INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values) VALUES
  ('00000000-0000-0000-0000-000000000000', 'INSERT', 'shifts', '650e8400-e29b-41d4-a716-446655440001', '{"title": "Morgonpass - Reception", "status": "open"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'INSERT', 'locations', '550e8400-e29b-41d4-a716-446655440001', '{"name": "Huvudkontor"}'::jsonb);

-- Create a view for shift statistics
CREATE OR REPLACE VIEW shift_statistics AS
SELECT 
  DATE_TRUNC('month', start_time) as month,
  COUNT(*) as total_shifts,
  COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_shifts,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_shifts,
  AVG(total_hours) as avg_hours_per_shift,
  SUM(total_hours) as total_hours
FROM public.shifts
GROUP BY DATE_TRUNC('month', start_time)
ORDER BY month DESC;

-- Create a view for user shift history
CREATE OR REPLACE VIEW user_shift_history AS
SELECT 
  u.name,
  u.email,
  s.title,
  s.start_time,
  s.end_time,
  s.total_hours,
  s.status,
  l.name as location_name
FROM public.users u
JOIN public.shifts s ON u.id = s.assigned_to
LEFT JOIN public.locations l ON s.location_id = l.id
ORDER BY s.start_time DESC;

COMMIT;