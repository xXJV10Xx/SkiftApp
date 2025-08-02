const express = require('express');
const axios = require('axios');
const router = express.Router();

// Handler för Supabase webhook
router.post('/notify', async (req, res) => {
  const { shift_id, date, team_id } = req.body;

  try {
    console.log('New shift created:', { shift_id, date, team_id });
    
    // 📧 Skicka e-postnotifiering här
    try {
      await axios.post(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/email/send-shift-notification`, {
        shift_id,
        date,
        title: 'Nytt skift tillgängligt',
        time: '08:00', // Detta bör komma från shift-data
        recipient_email: 'team@example.com', // Detta bör komma från team-data
        team_members: [
          // Detta bör hämtas från databasen baserat på team_id
          { name: 'Team Member', email: 'member@example.com' }
        ]
      });
      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
      // Fortsätt även om e-post misslyckas
    }
    
    // 📅 Synka med Google Calendar (implementeras senare med användarens access_token)
    // await syncToGoogleCalendar(shift_id, date, team_id);
    
    res.json({ success: true, message: 'Notification processed' });
  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ error: 'Failed to process notification' });
  }
});

module.exports = router;