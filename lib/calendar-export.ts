import { supabase } from './supabase'

interface CalendarEvent {
  summary: string
  start_time: string
  end_time: string
  location?: string
  description?: string
}

// Generate ICS format for Apple Calendar
export function generateICS(events: CalendarEvent[]): string {
  const icsHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skiftappen//SE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n')

  const icsFooter = 'END:VCALENDAR'

  const icsEvents = events.map(event => {
    const startDate = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const endDate = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@skiftappen.se`

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.summary}`,
      event.location ? `LOCATION:${event.location}` : '',
      event.description ? `DESCRIPTION:${event.description}` : '',
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'END:VEVENT'
    ].filter(line => line !== '').join('\r\n')
  }).join('\r\n')

  return [icsHeader, icsEvents, icsFooter].join('\r\n')
}

// Export shifts from Supabase to ICS
export async function exportShiftsToICS(calendarId?: string): Promise<string> {
  try {
    let query = supabase.from('shifts').select('*')
    
    if (calendarId) {
      query = query.eq('calendar_id', calendarId)
    }

    const { data: shifts, error } = await query

    if (error) {
      console.error('❌ Fel vid hämtning av skift:', error)
      throw error
    }

    const events: CalendarEvent[] = shifts?.map(shift => ({
      summary: shift.summary,
      start_time: shift.start_time,
      end_time: shift.end_time,
      location: shift.location,
      description: shift.description
    })) || []

    return generateICS(events)

  } catch (error) {
    console.error('❌ Export till ICS misslyckades:', error)
    throw error
  }
}

// Download ICS file
export function downloadICS(icsContent: string, filename: string = 'skift.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Google Calendar integration
export async function addToGoogleCalendar(event: CalendarEvent) {
  const startTime = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const endTime = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const googleUrl = new URL('https://calendar.google.com/calendar/render')
  googleUrl.searchParams.set('action', 'TEMPLATE')
  googleUrl.searchParams.set('text', event.summary)
  googleUrl.searchParams.set('dates', `${startTime}/${endTime}`)
  
  if (event.location) {
    googleUrl.searchParams.set('location', event.location)
  }
  
  if (event.description) {
    googleUrl.searchParams.set('details', event.description)
  }
  
  window.open(googleUrl.toString(), '_blank')
}

// Export all shifts to Google Calendar
export async function exportAllToGoogleCalendar(calendarId?: string) {
  try {
    let query = supabase.from('shifts').select('*')
    
    if (calendarId) {
      query = query.eq('calendar_id', calendarId)
    }

    const { data: shifts, error } = await query

    if (error) {
      console.error('❌ Fel vid hämtning av skift:', error)
      throw error
    }

    // Open Google Calendar with all events
    if (shifts && shifts.length > 0) {
      for (const shift of shifts) {
        await addToGoogleCalendar({
          summary: shift.summary,
          start_time: shift.start_time,
          end_time: shift.end_time,
          location: shift.location,
          description: shift.description
        })
        
        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

  } catch (error) {
    console.error('❌ Export till Google Calendar misslyckades:', error)
    throw error
  }
}