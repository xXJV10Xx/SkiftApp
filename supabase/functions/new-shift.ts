import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const payload = await req.json()

  const { calendarId, summary, start_time, end_time } = payload.record

  // Logik: Skicka notis, uppdatera frontend, e-post osv
  console.log(`🔔 Nytt skift: ${summary} (${start_time} - ${end_time})`)

  // Exempel: Mail trigger via Resend API
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'skiftappen@dittdomän.se',
      to: 'användare@doman.se',
      subject: 'Nytt skift tillagt',
      html: `<strong>${summary}</strong><br>${start_time} – ${end_time}`,
    }),
  })

  return new Response('✅ Webhook klar')
})