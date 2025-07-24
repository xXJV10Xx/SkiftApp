// 🏭 SSAB Oxelösund Loveable Integration
// Enkel JavaScript implementation för Loveable och Supabase

// Supabase konfiguration
const SUPABASE_URL = "https://fsefeherdbtsddqimjco.supabase.co";
const SUPABASE_ANON_KEY = "DIN-ANON-KEY-HÄR"; // Ersätt med din riktiga anon key

// SSAB Oxelösund konfiguration
const SSAB_CONFIG = {
  company: "SSAB OXELÖSUND",
  location: "Oxelösund",
  industry: "Stålindustri",
  teams: [
    { id: "lag-31", name: "Lag 31", color: "#FF6B6B", offset: 0 },
    { id: "lag-32", name: "Lag 32", color: "#4ECDC4", offset: 1 },
    { id: "lag-33", name: "Lag 33", color: "#45B7D1", offset: 2 },
    { id: "lag-34", name: "Lag 34", color: "#96CEB4", offset: 3 },
    { id: "lag-35", name: "Lag 35", color: "#FFEAA7", offset: 4 }
  ],
  shiftPattern: [
    "2F", "2E", "3N", "4L", "3F", "3E", "1N", "5L",
    "2F", "2E", "3N", "5L", "3F", "2E", "2N", "4L"
  ],
  shiftTimes: {
    F: { start: "06:00", end: "14:00", title: "Förmiddagsskift" },
    E: { start: "14:00", end: "22:00", title: "Eftermiddagsskift" },
    N: { start: "22:00", end: "06:00", title: "Nattskift" },
    L: { start: "00:00", end: "23:59", title: "Ledig" }
  }
};

// Supabase client (för web-användning)
let supabase = null;

// Initiera Supabase
async function initSupabase() {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase klient initierad');
    return true;
  } catch (error) {
    console.error('❌ Fel vid initiering av Supabase:', error);
    return false;
  }
}

// Hämta data från Supabase
async function fetchSSABData() {
  if (!supabase) {
    console.error('❌ Supabase klient inte initierad');
    return null;
  }

  try {
    console.log('🏭 Hämtar SSAB Oxelösund data...');

    // 1. Hämta teams
    const { data: teams, error: teamsError } = await supabase
      .from('shift_teams')
      .select('*')
      .eq('company_id', (await supabase.from('companies').select('id').eq('name', 'SSAB OXELÖSUND').single()).data?.id);

    if (teamsError) {
      throw new Error(`Fel vid hämtning av teams: ${teamsError.message}`);
    }

    console.log(`✅ ${teams?.length || 0} teams hittade`);

    // 2. Hämta skift för 2025
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        *,
        shift_teams!inner(name, color_hex)
      `)
      .gte('start_time', '2025-01-01')
      .lte('start_time', '2025-12-31')
      .order('start_time');

    if (shiftsError) {
      throw new Error(`Fel vid hämtning av skift: ${shiftsError.message}`);
    }

    console.log(`✅ ${shifts?.length || 0} skift hittade`);

    // 3. Hämta statistik
    const { data: stats, error: statsError } = await supabase
      .rpc('get_ssab_oxelosund_stats', {
        p_start_date: '2025-01-01',
        p_end_date: '2025-12-31'
      });

    if (statsError) {
      console.warn('Varning: Kunde inte hämta statistik:', statsError.message);
    }

    return {
      teams: teams || [],
      shifts: shifts || [],
      stats: stats || []
    };

  } catch (error) {
    console.error('❌ Fel vid hämtning av data:', error);
    return null;
  }
}

// Klick-funktioner för Loveable
const SSABClickHandlers = {
  // Klicka på team
  handleTeamClick: (teamName) => {
    console.log('👆 Team klickat:', teamName);
    
    // Hämta skift för specifikt team
    fetchShiftsForTeam(teamName).then(shifts => {
      if (shifts) {
        displayShifts(shifts, teamName);
      }
    });
  },

  // Klicka på skift
  handleShiftClick: (shift) => {
    console.log('👆 Skift klickat:', shift.title);
    
    const shiftDetails = `
      ${shift.title}
      
      Team: ${shift.team_name}
      Typ: ${getShiftTypeText(shift.shift_type)}
      Start: ${new Date(shift.start_time).toLocaleString()}
      Slut: ${new Date(shift.end_time).toLocaleString()}
      Cykeldag: ${shift.cycle_day}
    `;
    
    // Visa detaljer (anpassa för din UI)
    alert(shiftDetails);
  },

  // Klicka på statistik
  handleStatsClick: (stat) => {
    console.log('📊 Statistik klickad:', stat.team_name);
    
    const statsDetails = `
      ${stat.team_name} Statistik
      
      Totalt skift: ${stat.total_shifts}
      Förmiddag: ${stat.morning_shifts}
      Eftermiddag: ${stat.afternoon_shifts}
      Natt: ${stat.night_shifts}
      Lediga dagar: ${stat.free_days}
      Totala timmar: ${stat.total_hours}h
      Genomsnittlig skifttid: ${stat.average_shift_length}h
    `;
    
    alert(statsDetails);
  },

  // Validera regler
  handleValidateRules: async () => {
    console.log('🔍 Validerar SSAB Oxelösund regler...');
    
    if (!supabase) {
      alert('Supabase klient inte initierad');
      return;
    }

    try {
      const { data: validation, error } = await supabase
        .rpc('validate_ssab_oxelosund_rules', {
          p_start_date: '2023-01-01',
          p_end_date: '2025-12-31'
        });

      if (error) {
        alert(`Validering fel: ${error.message}`);
        return;
      }

      const validationText = validation?.map(rule => 
        `${rule.validation_rule}: ${rule.status}\n${rule.details}`
      ).join('\n\n') || 'Ingen validering tillgänglig';

      alert(`SSAB Oxelösund Regler Validering\n\n${validationText}`);
    } catch (err) {
      alert('Kunde inte validera regler');
    }
  },

  // Generera skift
  handleGenerateShifts: async () => {
    console.log('🔄 Genererar skift...');
    
    if (!supabase) {
      alert('Supabase klient inte initierad');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('generate_ssab_oxelosund_shifts', {
          p_start_date: '2025-01-01',
          p_end_date: '2025-12-31'
        });

      if (error) {
        alert(`Generering fel: ${error.message}`);
        return;
      }

      alert(`${data || 0} skift har genererats!`);
      
      // Uppdatera data
      const newData = await fetchSSABData();
      if (newData) {
        displayData(newData);
      }
    } catch (err) {
      alert('Kunde inte generera skift');
    }
  },

  // Exportera data
  handleExportData: () => {
    console.log('📤 Exporterar data...');
    
    const exportData = {
      config: SSAB_CONFIG,
      timestamp: new Date().toISOString(),
      message: 'SSAB Oxelösund data exporterad'
    };
    
    console.log('📤 Exporterad data:', exportData);
    alert('Data exporterad till konsolen');
  }
};

// Helper funktioner
function getShiftTypeText(type) {
  switch (type) {
    case 'F': return 'Förmiddagsskift';
    case 'E': return 'Eftermiddagsskift';
    case 'N': return 'Nattskift';
    case 'L': return 'Ledig';
    default: return 'Okänd';
  }
}

function getShiftTypeColor(type) {
  switch (type) {
    case 'F': return '#4CAF50';
    case 'E': return '#FF9800';
    case 'N': return '#2196F3';
    case 'L': return '#9E9E9E';
    default: return '#000000';
  }
}

// Hämta skift för specifikt team
async function fetchShiftsForTeam(teamName) {
  if (!supabase) return null;

  try {
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        shift_teams!inner(name, color_hex)
      `)
      .eq('shift_teams.name', teamName)
      .gte('start_time', '2025-01-01')
      .lte('start_time', '2025-12-31')
      .order('start_time');

    if (error) {
      console.error('Fel vid hämtning av skift:', error);
      return null;
    }

    return shifts || [];
  } catch (error) {
    console.error('Fel vid hämtning av skift:', error);
    return null;
  }
}

// Visa skift
function displayShifts(shifts, teamName) {
  console.log(`📋 Skift för ${teamName}:`, shifts);
  
  const shiftsText = shifts.map(shift => 
    `${shift.title} - ${new Date(shift.start_time).toLocaleDateString()} (${shift.shift_type})`
  ).join('\n');
  
  alert(`${teamName} Skift:\n\n${shiftsText}`);
}

// Visa data
function displayData(data) {
  console.log('📊 SSAB Oxelösund data:', data);
  
  const summary = `
    Teams: ${data.teams.length}
    Skift: ${data.shifts.length}
    Statistik: ${data.stats.length} poster
  `;
  
  alert(`SSAB Oxelösund Data Sammanfattning:\n\n${summary}`);
}

// Exempel på användning för Loveable
const SSABLoveableExample = {
  // Initiera app
  init: async () => {
    console.log('🚀 Initierar SSAB Oxelösund app...');
    
    const success = await initSupabase();
    if (success) {
      const data = await fetchSSABData();
      if (data) {
        displayData(data);
        return data;
      }
    }
    return null;
  },

  // Hämta skift för specifikt datum
  getShiftsForDate: async (date, teamName = 'Lag 31') => {
    if (!supabase) return null;

    try {
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select(`
          *,
          shift_teams!inner(name, color_hex)
        `)
        .eq('shift_teams.name', teamName)
        .eq('start_time', `${date}T00:00:00`);

      if (error) {
        console.error('Fel vid hämtning av skift:', error);
        return null;
      }

      return shifts?.[0] || null;
    } catch (error) {
      console.error('Fel vid hämtning av skift:', error);
      return null;
    }
  },

  // Hämta nästa skift för användare
  getNextShift: async (userId) => {
    if (!supabase) return null;

    try {
      const { data: nextShift, error } = await supabase
        .rpc('get_next_shift', {
          p_user_id: userId
        });

      if (error) {
        console.error('Fel vid hämtning av nästa skift:', error);
        return null;
      }

      return nextShift;
    } catch (error) {
      console.error('Fel vid hämtning av nästa skift:', error);
      return null;
    }
  },

  // Validera regler
  validateRules: SSABClickHandlers.handleValidateRules,

  // Generera skift
  generateShifts: SSABClickHandlers.handleGenerateShifts,

  // Exportera data
  exportData: SSABClickHandlers.handleExportData
};

// Exportera för användning
export {
    SSABClickHandlers,
    SSABLoveableExample, SSAB_CONFIG, fetchSSABData, getShiftTypeColor, getShiftTypeText, initSupabase
};

// Auto-initiera om detta är huvudfilen
if (typeof window !== 'undefined') {
  SSABLoveableExample.init().then(data => {
    if (data) {
      console.log('✅ SSAB Oxelösund app initierad med data:', data);
    } else {
      console.error('❌ Kunde inte initiera SSAB Oxelösund app');
    }
  });
} 