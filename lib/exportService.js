import { supabase } from './supabaseClient';

export const exportCalendarData = async (team = 'ALL', format = 'ics') => {
  try {
    // Hämta kalenderdata baserat på team-filter
    let query = supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(name),
        away_team:teams!games_away_team_id_fkey(name)
      `)
      .order('game_date', { ascending: true });

    // Filtrera på team om det inte är "ALL"
    if (team !== 'ALL') {
      query = query.or(`home_team_id.eq.${team},away_team_id.eq.${team}`);
    }

    const { data: games, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (format === 'ics') {
      return generateICSFile(games);
    } else if (format === 'csv') {
      return generateCSVFile(games);
    } else {
      throw new Error('Unsupported export format');
    }
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

const generateICSFile = (games) => {
  const icsHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Your App//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
  ].join('\r\n');

  const icsFooter = 'END:VCALENDAR';

  const events = games.map(game => {
    const startDate = new Date(game.game_date);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // +2 timmar
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return [
      'BEGIN:VEVENT',
      `UID:game-${game.id}@yourapp.com`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${game.home_team.name} vs ${game.away_team.name}`,
      `DESCRIPTION:Omgång ${game.round}`,
      `LOCATION:${game.venue || 'TBA'}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [icsHeader, ...events, icsFooter].join('\r\n');
};

const generateCSVFile = (games) => {
  const headers = ['Datum', 'Tid', 'Hemmalag', 'Bortalag', 'Omgång', 'Arena'];
  
  const rows = games.map(game => {
    const gameDate = new Date(game.game_date);
    const date = gameDate.toLocaleDateString('sv-SE');
    const time = gameDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    
    return [
      date,
      time,
      game.home_team.name,
      game.away_team.name,
      game.round,
      game.venue || 'TBA'
    ].map(field => `"${field}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};