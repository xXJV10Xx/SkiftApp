import { supabase } from './supabase'
import ical from 'ical'

interface ShiftEvent {
  summary: string
  start: Date
  end: Date
  location?: string
  description?: string
}

export async function importICSToSupabase(icsContent: string, calendarId: string) {
  try {
    // Parse ICS content
    const data = ical.parseICS(icsContent)
    const events: ShiftEvent[] = []

    for (const k in data) {
      const ev = data[k]
      if (ev.type === 'VEVENT') {
        events.push({
          summary: ev.summary || 'Skift',
          start: new Date(ev.start),
          end: new Date(ev.end),
          location: ev.location,
          description: ev.description
        })
      }
    }

    // Insert events into Supabase
    const { data: insertedEvents, error } = await supabase
      .from('shifts')
      .insert(
        events.map(event => ({
          calendar_id: calendarId,
          summary: event.summary,
          start_time: event.start.toISOString(),
          end_time: event.end.toISOString(),
          location: event.location,
          description: event.description,
          created_at: new Date().toISOString()
        }))
      )
      .select()

    if (error) {
      console.error('❌ Fel vid import:', error)
      throw error
    }

    console.log(`✅ Importerade ${events.length} skift från ICS`)
    return insertedEvents

  } catch (error) {
    console.error('❌ ICS import misslyckades:', error)
    throw error
  }
}

export async function importFromURL(icsUrl: string, calendarId: string) {
  try {
    const response = await fetch(icsUrl)
    const icsContent = await response.text()
    
    return await importICSToSupabase(icsContent, calendarId)
  } catch (error) {
    console.error('❌ Kunde inte hämta ICS från URL:', error)
    throw error
  }
}

export async function importFromFile(file: File, calendarId: string) {
  try {
    const icsContent = await file.text()
    return await importICSToSupabase(icsContent, calendarId)
  } catch (error) {
    console.error('❌ Kunde inte läsa ICS-fil:', error)
    throw error
  }
}