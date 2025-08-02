import { writeFileSync } from 'fs';
import ics from 'ics';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportCalendar(userId) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user.calendar_export_paid) {
    throw new Error('User has not paid for calendar export.');
  }

  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  const events = shifts.map(shift => ({
    start: shift.start_time.split(/[-T:]/).map(Number),
    duration: { hours: 8 }, // justera om dina skift har olika längd
    title: `${shift.type} – ${shift.team}`,
    description: shift.notes || '',
    location: shift.location || '',
  }));

  ics.createEvents(events, (err, value) => {
    if (err) throw err;
    const filename = `export_${userId}.ics`;
    writeFileSync(`/tmp/${filename}`, value);

    // Email ICS
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.NOTIFY_EMAIL,
        pass: process.env.NOTIFY_PASS
      }
    });

    transporter.sendMail({
      from: '"SkiftApp" <noreply@skiftapp.se>',
      to: user.email,
      subject: 'Din skiftschema-export (.ics)',
      text: 'Bifogat hittar du ditt skiftschema.',
      attachments: [
        {
          filename,
          path: `/tmp/${filename}`
        }
      ]
    });

    console.log('ICS skickad till', user.email);
  });
}

exportCalendar('USER-ID-HÄR');