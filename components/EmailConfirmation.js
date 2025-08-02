import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const sendPremiumConfirmationEmail = async (email, userName) => {
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">🎉 Välkommen till Premium!</h2>
      
      <p>Hej ${userName || 'där'}!</p>
      
      <p>Tack för ditt köp av Kalenderexport för Skiftappen! Din betalning på 99 kr har genomförts och du har nu tillgång till alla premiumfunktioner.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #16a34a; margin-top: 0;">✨ Vad du nu kan göra:</h3>
        <ul style="color: #166534;">
          <li>📅 Exportera ditt skiftschema till Google Calendar</li>
          <li>📱 Synka med Apple Calendar</li>
          <li>🔔 Få påminnelser om kommande skift</li>
          <li>🚫 Ingen reklam längre</li>
        </ul>
      </div>
      
      <p>Logga in i appen för att börja använda dina nya funktioner!</p>
      
      <p style="color: #6b7280; font-size: 14px;">
        Har du frågor? Svara på detta mail så hjälper vi dig.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #9ca3af; font-size: 12px;">
        Skiftappen Premium<br>
        Detta mail skickades automatiskt efter ditt köp.
      </p>
    </div>
  `;

  try {
    // Här skulle du integrera med din e-posttjänst (SendGrid, Mailgun, etc.)
    // För nu loggar vi bara
    console.log('Skickar bekräftelsemail till:', email);
    console.log('E-postinnehåll:', emailTemplate);
    
    // Exempel med fetch till din e-post-API
    /*
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '🎉 Välkommen till Skiftappen Premium!',
        html: emailTemplate
      })
    });
    */
    
    return { success: true };
  } catch (error) {
    console.error('Fel vid e-postsändning:', error);
    return { success: false, error };
  }
};