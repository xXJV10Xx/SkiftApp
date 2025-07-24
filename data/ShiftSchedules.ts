// 📋 Skiftscheman - Komplett Datastruktur för alla svenska industriföretag
// Beräknad från 2024-01-01 med 10 års intervall (2020-2030)

export const START_DATE = new Date('2024-01-01');

// 🔄 Skifttyper och mönster
export interface ShiftType {
  id: string;
  name: string;
  description: string;
  pattern: string[];
  cycle: number;
  times: Record<string, { start: string; end: string; name: string }>;
}

export const SHIFT_TYPES: Record<string, ShiftType> = {
  // VOLVO skift
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

  VOLVO_2SKIFT: {
    id: 'volvo_2skift',
    name: 'Volvo 2-skift',
    description: '2-skiftssystem',
    pattern: ['M', 'M', 'M', 'M', 'M', 'L', 'L', 'A', 'A', 'A', 'A', 'A', 'L', 'L'],
    cycle: 14,
    times: {
      'M': { start: '06:00', end: '14:00', name: 'Morgon' },
      'A': { start: '14:00', end: '22:00', name: 'Kväll' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  VOLVO_DAG: {
    id: 'volvo_dag',
    name: 'Volvo Dag',
    description: 'Dagskift',
    pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
    cycle: 7,
    times: {
      'D': { start: '07:00', end: '16:00', name: 'Dag' },
      'L': { start: '', end: '', name: 'Ledig' }
    }
  },

  // SCA skift
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

  // SSAB skift
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

  // SSAB Oxelösund skift
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

  // BOLIDEN skift
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

  // BARILLA skift
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

  // AGA AVESTA skift
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

  // SANDVIK skift
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

  // SKANSKA skift
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
export function calculateShiftForDate(date: Date, shiftType: ShiftType, team: string, startDate = START_DATE) {
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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

export function getTeamOffset(team: string, shiftType: ShiftType) {
  // Hitta företaget som använder denna skifttyp
  const companyData = Object.values(require('./companies').COMPANIES).find((comp: any) => 
    comp.shifts.includes(shiftType.id)
  );
  
  if (!companyData) return 0;
  
  const teamIndex = companyData.teams.indexOf(team);
  if (teamIndex === -1) return 0;
  
  // Beräkna offset baserat på antal team och cykellängd
  const offsetPerTeam = Math.floor(shiftType.cycle / companyData.teams.length);
  return teamIndex * offsetPerTeam;
}

export function generateMonthSchedule(year: number, month: number, shiftType: ShiftType, team: string) {
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

export function calculateWorkedHours(schedule: any[]) {
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
      
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
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

export function getNextShift(shiftType: ShiftType, team: string, currentDate = new Date()) {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  
  // Hitta nästa arbetsdag
  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    
    const shift = calculateShiftForDate(checkDate, shiftType, team);
    if (shift.time.start && shift.time.end) {
      const daysUntil = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
export function isToday(date: Date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

export function formatDate(date: Date) {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('sv-SE', options);
}

export function getShiftColor(shiftCode: string, company: string, team: string) {
  if (shiftCode === 'L') return '#E8E8E8'; // Ledig = grå
  
  const companyData = Object.values(require('./companies').COMPANIES).find((comp: any) => comp.id === company);
  if (companyData && companyData.colors[team]) {
    return companyData.colors[team];
  }
  
  // Standardfärger för skift
  const shiftColors: Record<string, string> = {
    'M': '#FF6B6B', // Morgon = röd
    'A': '#4ECDC4', // Kväll = turkos
    'N': '#45B7D1', // Natt = blå
    'F': '#96CEB4', // Förmiddag = grön
    'E': '#FFA502', // Eftermiddag = orange
    'D': '#9B59B6'  // Dag = lila
  };
  
  return shiftColors[shiftCode] || '#95A5A6';
}