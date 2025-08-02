const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Konfigurera e-posttransporter
const transporter = nodemailer.createTransporter({
  service: 'gmail', // eller din e-postleverantör
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Skicka e-postnotifiering för nytt skift
router.post('/send-shift-notification', async (req, res) => {
  const { shift_id, date, time, title, recipient_email, team_members } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient_email,
      subject: `Nytt skift tillgängligt - ${title}`,
      html: `
        <h2>Nytt skift har lagts till</h2>
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Tid:</strong> ${time}</p>
        <p><strong>Skift:</strong> ${title}</p>
        <p><strong>Skift ID:</strong> ${shift_id}</p>
        
        <h3>Teammedlemmar som får denna notifiering:</h3>
        <ul>
          ${team_members?.map(member => `<li>${member.name} (${member.email})</li>`).join('') || '<li>Ingen team information tillgänglig</li>'}
        </ul>
        
        <p>Logga in i skiftappen för att se mer information och boka skiftet.</p>
      `,
    };

    // Skicka till alla teammedlemmar om team_members finns
    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        const memberMailOptions = {
          ...mailOptions,
          to: member.email,
        };
        await transporter.sendMail(memberMailOptions);
      }
    } else {
      await transporter.sendMail(mailOptions);
    }

    console.log('Email notification sent successfully');
    res.json({ success: true, message: 'Notification email sent' });
  } catch (err) {
    console.error('Email notification error:', err);
    res.status(500).json({ error: 'Failed to send email notification' });
  }
});

// Skicka påminnelse för kommande skift
router.post('/send-shift-reminder', async (req, res) => {
  const { shift_id, date, time, title, assigned_user_email } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: assigned_user_email,
      subject: `Påminnelse: Ditt skift imorgon - ${title}`,
      html: `
        <h2>Påminnelse om kommande skift</h2>
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Tid:</strong> ${time}</p>
        <p><strong>Skift:</strong> ${title}</p>
        
        <p>Glöm inte ditt skift imorgon! Se till att vara förberedd och komma i tid.</p>
        
        <p>Ha en bra dag!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Reminder email sent successfully');
    res.json({ success: true, message: 'Reminder email sent' });
  } catch (err) {
    console.error('Reminder email error:', err);
    res.status(500).json({ error: 'Failed to send reminder email' });
  }
});

module.exports = router;