// Exempel med SendGrid - byt ut mot din e-posttjänst
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL, // Din verifierade e-postadress
      subject,
      html,
    };

    await sgMail.send(msg);
    
    res.status(200).json({ success: true, message: 'E-post skickad' });
  } catch (error) {
    console.error('Fel vid e-postsändning:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kunde inte skicka e-post',
      error: error.message 
    });
  }
}