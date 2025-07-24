// 📋 Skiftscheman - Komplett Datastruktur
// Beräknad från 2025-01-18 med 5 års intervall (2020-2030)

export const START_DATE = new Date('2025-01-18');

// 🏭 Företag och deras skifttyper
export const COMPANIES = {
  VOLVO: {
    id: 'volvo',
    name: 'Volvo',
    description: 'Lastbilar och entreprenadmaskiner',
    shifts: ['VOLVO_3SKIFT', 'VOLVO_2SKIFT', 'VOLVO_DAG'],
    teams: ['A', 'B', 'C', 'D'],
    colors: {
      'A': '#FF6B6B',
      'B': '#4ECDC4', 
      'C': '#45B7D1',
      'D': '#96CEB4'
    }
  },
  
  SCA: {
    id: 'sca',
    name: 'SCA',
    description: 'Skog och papper',
    shifts: ['SCA_3SKIFT', 'SCA_2SKIFT', 'SCA_DAG'],
    teams: ['Röd', 'Blå', 'Gul', 'Grön'],
    colors: {
      'Röd': '#E74C3C',
      'Blå': '#3498DB',
      'Gul': '#F39C12', 
      'Grön': '#2ECC71'
    }
  },

  SSAB: {
    id: 'ssab',
    name: 'SSAB',
    description: 'Stål och järn',
    shifts: ['SSAB_3SKIFT', 'SSAB_2SKIFT', 'SSAB_DAG'],
    teams: ['1', '2', '3', '4', '5'],
    colors: {
      '1': '#FF6B35',
      '2': '#004E89',
      '3': '#1A936F',
      '4': '#C6426E',
      '5': '#6F1E51'
    }
  },

  SSAB_OXELOSUND: {
    id: 'ssab_oxelosund',
    name: 'SSAB Oxelösund',
    description: 'Stål och järn - Oxelösund',
    shifts: ['SSAB_OXELOSUND_3SKIFT'],
    teams: ['31', '32', '33', '34', '35'],
    colors: {
      '31': '#FF6B35',
      '32': '#004E89',
      '33': '#1A936F',
      '34': '#C6426E',
      '35': '#6F1E51'
    }
  },

  BOLIDEN: {
    id: 'boliden',
    name: 'Boliden',
    description: 'Gruva och mineral',
    shifts: ['BOLIDEN_3SKIFT', 'BOLIDEN_2SKIFT', 'BOLIDEN_DAG'],
    teams: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    colors: {
      'Alpha': '#E74C3C',
      'Beta': '#3498DB',
      'Gamma': '#2ECC71',
      'Delta': '#9B59B6'
    }
  },

  BARILLA: {
    id: 'barilla',
    name: 'Barilla Sverige',
    description: 'Pasta och livsmedel (Filipstad)',
    shifts: ['BARILLA_5SKIFT'],
    teams: ['1', '2', '3', '4', '5'],
    colors: {
      '1': '#FF6B6B',
      '2': '#4ECDC4',
      '3': '#45B7D1',
      '4': '#96CEB4',
      '5': '#FFA502'
    }
  },

  AGA_AVESTA: {
    id: 'aga_avesta',
    name: 'AGA Avesta',
    description: 'Industriella gaser',
    shifts: ['AGA_6SKIFT'],
    teams: ['A', 'B', 'C', 'D', 'E', 'F'],
    colors: {
      'A': '#E74C3C',
      'B': '#3498DB',
      'C': '#2ECC71',
      'D': '#9B59B6',
      'E': '#F39C12',
      'F': '#1ABC9C'
    }
  },

  SANDVIK: {
    id: 'sandvik',
    name: 'Sandvik',
    description: 'Verktyg och material',
    shifts: ['SANDVIK_3SKIFT', 'SANDVIK_2SKIFT', 'SANDVIK_DAG'],
    teams: ['Team A', 'Team B', 'Team C', 'Team D'],
    colors: {
      'Team A': '#FF6B6B',
      'Team B': '#4ECDC4',
      'Team C': '#45B7D1',
      'Team D': '#96CEB4'
    }
  },

  SKANSKA: {
    id: 'skanska',
    name: 'Skanska',
    description: 'Bygg och anläggning',
    shifts: ['SKANSKA_DAG', 'SKANSKA_KVALL', 'SKANSKA_HELG'],
    teams: ['Lag 1', 'Lag 2', 'Lag 3'],
    colors: {
      'Lag 1': '#E74C3C',
      'Lag 2': '#3498DB',
      'Lag 3': '#2ECC71'
    }
  }
};

// 🔄 Skifttyper och mönster
export const SHIFT_TYPES = {
  // VOLVO 3-skift
  VOLVO_3SKIFT: {
    id: 'volvo_3skift',
    name: 'Volvo 3-skift',
    description: 'Kontinuerligt 3-skiftssystem',
    pattern: ['M', 'M', 'A', 'A', 'N', 'N', 'L', 'L'],
    cycle: 8,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // SCA 3-skift
  SCA_3SKIFT: {
    id: 'sca_3skift',
    name: 'SCA 3-skift',
    description: 'Kontinuerligt 3-skiftssystem',
    pattern: ['M', 'M', 'A', 'A', 'N', 'N', 'L', 'L', 'L', 'L'],
    cycle: 10,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // SSAB 3-skift
  SSAB_3SKIFT: {
    id: 'ssab_3skift',
    name: 'SSAB 3-skift',
    description: 'Kontinuerligt 3-skiftssystem',
    pattern: ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L'],
    cycle: 14,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // SSAB Oxelösund 3-skift
  SSAB_OXELOSUND_3SKIFT: {
    id: 'ssab_oxelosund_3skift',
    name: 'SSAB Oxelösund 3-skift',
    description: 'Kontinuerligt 3-skiftssystem för SSAB Oxelösund',
    pattern: ['L', 'L', 'L', 'L', 'L', 'M', 'M', 'M', 'E', 'E', 'L', 'N', 'N', 'N'],
    cycle: 14,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'E': { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // BOLIDEN 3-skift
  BOLIDEN_3SKIFT: {
    id: 'boliden_3skift',
    name: 'Boliden 3-skift',
    description: 'Kontinuerligt 3-skiftssystem',
    pattern: ['M', 'M', 'A', 'A', 'A', 'N', 'N', 'L', 'L', 'L'],
    cycle: 10,
    times: {
      'M': { start: '07:00', end: '15:00', name: 'Morgon' },
      'A': { start: '15:00', end: '23:00', name: 'Kväll' },
      'N': { start: '23:00', end: '07:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // BARILLA 5-skift
  BARILLA_5SKIFT: {
    id: 'barilla_5skift',
    name: 'Barilla 5-skift',
    description: 'Kontinuerligt 5-skiftssystem',
    pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L'],
    cycle: 8,
    times: {
      'F': { start: '06:00', end: '14:00', name: 'Förmiddag' },
      'E': { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // AGA AVESTA 6-skift
  AGA_6SKIFT: {
    id: 'aga_6skift',
    name: 'AGA Avesta 6-skift',
    description: 'Komplext 6-skiftssystem',
    pattern: ['D', 'D', 'F', 'F', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L', 'E', 'E', 'FE', 'FE', 'EN', 'EN'],
    cycle: 18,
    times: {
      'D': { start: '06:00', end: '18:00', name: 'Dag 12h' },
      'F': { start: '06:00', end: '14:00', name: 'Förmiddag' },
      'E': { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'FE': { start: '06:00', end: '22:00', name: 'Förmiddag-Eftermiddag' },
      'EN': { start: '14:00', end: '06:00', name: 'Eftermiddag-Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // SANDVIK 3-skift
  SANDVIK_3SKIFT: {
    id: 'sandvik_3skift',
    name: 'Sandvik 3-skift',
    description: 'Kontinuerligt 3-skiftssystem',
    pattern: ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L'],
    cycle: 12,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'N': { start: '22:00', end: '06:00', name: 'Natt' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // SKANSKA Dag
  SKANSKA_DAG: {
    id: 'skanska_dag',
    name: 'Skanska Dag',
    description: 'Dagskift',
    pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
    cycle: 7,
    times: {
      'D': { start: '07:00', end: '16:00', name: 'Dag' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  }
};

// 🔧 Beräkningsfunktioner
export function calculateShiftForDate(date, shiftType, team, startDate = START_DATE) {
  const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
  const teamOffset = getTeamOffset(team, shiftType);
  const adjustedDaysDiff = daysDiff + teamOffset;
  const cyclePosition = ((adjustedDaysDiff % shiftType.cycle) + shiftType.cycle) % shiftType.cycle;
  const shiftCode = shiftType.pattern[cyclePosition];

  return {
    code: shiftCode,
    time: shiftType.times[shiftCode],
    cycleDay: cyclePosition + 1,
    totalCycleDays: shiftType.cycle
  };
}

export function getTeamOffset(team, shiftType) {
  // Hitta företaget som använder denna skifttyp
  const company = Object.values(COMPANIES).find(comp => 
    comp.shifts.includes(shiftType.id)
  );
  
  if (!company) return 0;
  
  const teamIndex = company.teams.indexOf(team);
  if (teamIndex === -1) return 0;
  
  // Beräkna offset baserat på antal team och cykellängd
  const offsetPerTeam = Math.floor(shiftType.cycle / company.teams.length);
  return teamIndex * offsetPerTeam;
}

export function generateMonthSchedule(year, month, shiftType, team) {
  const schedule = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const shift = calculateShiftForDate(date, shiftType, team);
    
    schedule.push({
      date: date,
      day: day,
      shift: shift,
      isToday: isToday(date),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  
  return schedule;
}

export function calculateWorkedHours(schedule) {
  let totalHours = 0;
  let workDays = 0;
  
  schedule.forEach(day => {
    if (day.shift.time.start && day.shift.time.end) {
      const start = new Date(`2000-01-01 ${day.shift.time.start}`);
      const end = new Date(`2000-01-01 ${day.shift.time.end}`);
      
      // Hantera nattpass som går över midnatt
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      const hours = (end - start) / (1000 * 60 * 60);
      totalHours += hours;
      workDays++;
    }
  });
  
  return {
    totalHours: Math.round(totalHours * 10) / 10,
    workDays: workDays,
    averageHours: workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0
  };
}

export function getNextShift(schedule, currentDate = new Date()) {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  
  // Hitta nästa arbetsdag
  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    
    const shift = calculateShiftForDate(checkDate, schedule.shiftType, schedule.team);
    if (shift.time.start && shift.time.end) {
      const daysUntil = Math.ceil((checkDate - today) / (1000 * 60 * 60 * 24));
      return {
        date: checkDate,
        shift: shift,
        daysUntil: daysUntil
      };
    }
  }
  
  return null;
}

// 🛠️ Hjälpfunktioner
export function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

export function formatDate(date) {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('sv-SE', options);
}

export function getShiftColor(shiftCode, company, team) {
  if (shiftCode === 'L') return '#E8E8E8'; // Ledig = grå
  
  const companyData = Object.values(COMPANIES).find(comp => comp.id === company);
  if (companyData && companyData.colors[team]) {
    return companyData.colors[team];
  }
  
  // Standardfärger för skift
  const shiftColors = {
    'M': '#FF6B6B', // Morgon = röd
    'A': '#4ECDC4', // Kväll = turkos
    'N': '#45B7D1', // Natt = blå
    'F': '#96CEB4', // Förmiddag = grön
    'E': '#FFA502', // Eftermiddag = orange
    'D': '#9B59B6'  // Dag = lila
  };
  
  return shiftColors[shiftCode] || '#95A5A6';
}

// 📊 Exporterade funktioner för appen
export {
    START_DATE,
    calculateShiftForDate, calculateWorkedHours, formatDate, generateMonthSchedule, getNextShift, getShiftColor
};
