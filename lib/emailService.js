import nodemailer from 'nodemailer';

// Konfigurera e-posttransporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendExportSuccessEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: userEmail,
    subject: 'Kalenderexport - Betalning bekräftad',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Tack för ditt köp!</h2>
        <p>Hej ${userName},</p>
        <p>Din betalning för kalenderexport har bekräftats. Du kan nu exportera dina kalenderdata när som helst.</p>
        <p>Logga in på din konto för att komma åt exportfunktionen:</p>
        <a href="${process.env.APP_URL}/calendar" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
          Gå till kalender
        </a>
        <p>Med vänliga hälsningar,<br>Ditt team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Export success email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending export success email:', error);
    throw error;
  }
};