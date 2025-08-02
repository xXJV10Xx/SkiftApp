import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamFilter, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user has export access
    const { data: employee, error: accessError } = await supabase
      .from('employees')
      .select('has_paid_export, email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (accessError || !employee?.has_paid_export) {
      return res.status(403).json({ error: 'Export access required' });
    }

    // Build query for shifts
    let query = supabase
      .from('shifts')
      .select(`
        *,
        teams(name, color),
        employees(first_name, last_name)
      `)
      .eq('employee_id', userId)
      .order('start_time', { ascending: true });

    // Apply filters
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }
    if (teamFilter && teamFilter !== 'ALL') {
      query = query.eq('team_id', teamFilter);
    }

    const { data: shifts, error: shiftsError } = await query;

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      return res.status(500).json({ error: 'Failed to fetch shifts' });
    }

    // Generate ICS content
    const icsContent = generateICSContent(shifts, employee);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="skiftschema.ics"');
    res.status(200).send(icsContent);
  } catch (error) {
    console.error('Export generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateICSContent(shifts, employee) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skiftappen//Skiftschema//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${employee.first_name} ${employee.last_name} - Skiftschema`,
    'X-WR-CALDESC:Skiftschema exporterat från Skiftappen',
    'X-WR-TIMEZONE:Europe/Stockholm'
  ];

  shifts.forEach((shift, index) => {
    const startTime = new Date(shift.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(shift.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `shift-${shift.id}@skiftappen.se`;
    
    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${shift.position || 'Skift'} - ${shift.teams?.name || 'Lag'}`,
      `DESCRIPTION:Position: ${shift.position || 'Ej specificerad'}\\nLag: ${shift.teams?.name || 'Ej specificerat'}\\nPlats: ${shift.location || 'Ej specificerad'}${shift.notes ? '\\nNoteringar: ' + shift.notes : ''}`,
      `LOCATION:${shift.location || ''}`,
      `STATUS:${shift.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      shift.teams?.color ? `CATEGORIES:${shift.teams.name}` : '',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  
  return ics.filter(line => line !== '').join('\r\n');
}