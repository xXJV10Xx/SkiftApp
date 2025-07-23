// 🇸🇪 Svenska Företag och Skiftscheman - Komplett Databas
// Alla scheman beräknas från 2025-01-18 med 5 års intervall (2020-2030)

export interface ShiftTime {
  start: string;
  end: string;
  name: string;
}

export interface ShiftType {
  id: string;
  name: string;
  description: string;
  pattern: string[];
  cycle: number;
  times: Record<string, ShiftTime>;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  shifts: string[];
  teams: string[];
  colors: Record<string, string>;
}

export interface Team {
  id: string;
  name: string;
  companyId: string;
  color: string;
  shiftTypeId: string;
}

// Skifttyper med exakta mönster
export const SHIFT_TYPES: Record<string, ShiftType> = {
  // 3-SKIFT KONTINUERLIGT - VOLVO
  'VOLVO_3SKIFT': {
    id: 'VOLVO_3SKIFT',
    name: '3-skift kontinuerligt',
    description: 'Morgon, Kväll, Natt rotation',
    pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L'],
    cycle: 8,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 3-SKIFT KONTINUERLIGT - SCA
  'SCA_3SKIFT': {
    id: 'SCA_3SKIFT',
    name: '3-skift kontinuerligt',
    description: 'Morgon, Kväll, Natt rotation',
    pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L'],
    cycle: 10,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 3-SKIFT KONTINUERLIGT - SSAB
  'SSAB_3SKIFT': {
    id: 'SSAB_3SKIFT',
    name: '3-skift kontinuerligt',
    description: 'Morgon, Kväll, Natt rotation med 14-dagars cykel',
    pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L'],
    cycle: 14,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 3-SKIFT KONTINUERLIGT - BOLIDEN
  'BOLIDEN_3SKIFT': {
    id: 'BOLIDEN_3SKIFT',
    name: '3-skift kontinuerligt',
    description: 'Morgon, Kväll, Natt rotation',
    pattern: ['F', 'F', 'E', 'E', 'E', 'N', 'N', 'L', 'L', 'L'],
    cycle: 10,
    times: {
      F: { start: '07:00', end: '15:00', name: 'Förmiddag' },
      E: { start: '15:00', end: '23:00', name: 'Eftermiddag' },
      N: { start: '23:00', end: '07:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // DAGSKIFT - SKANSKA
  'SKANSKA_DAG': {
    id: 'SKANSKA_DAG',
    name: 'Dagskift',
    description: 'Dagskift med helger lediga',
    pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
    cycle: 7,
    times: {
      D: { start: '07:00', end: '16:00', name: 'Dag' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 3-SKIFT KONTINUERLIGT - SANDVIK
  'SANDVIK_3SKIFT': {
    id: 'SANDVIK_3SKIFT',
    name: '3-skift kontinuerligt',
    description: 'Morgon, Kväll, Natt rotation',
    pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L'],
    cycle: 12,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 5-SKIFT KONTINUERLIGT - BARILLA
  'BARILLA_5SKIFT': {
    id: 'BARILLA_5SKIFT',
    name: '5-skift kontinuerligt',
    description: 'Förmiddag, Eftermiddag, Natt rotation',
    pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L'],
    cycle: 8,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 6-SKIFT KONTINUERLIGT - AGA AVESTA
  'AGA_6SKIFT': {
    id: 'AGA_6SKIFT',
    name: '6-skift kontinuerligt',
    description: 'Komplexa rotationer med 12h-skift',
    pattern: ['D', 'D', 'F', 'F', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L', 'E', 'E', 'FE', 'FE', 'EN', 'EN'],
    cycle: 18,
    times: {
      D: { start: '06:00', end: '18:00', name: 'Dag 12h' },
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      FE: { start: '06:00', end: '22:00', name: 'Förmiddag-Eftermiddag' },
      EN: { start: '14:00', end: '06:00', name: 'Eftermiddag-Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 5-SKIFT KONTINUERLIGT - ABB HVDC
  'ABB_5SKIFT': {
    id: 'ABB_5SKIFT',
    name: '5-skift kontinuerligt',
    description: 'Blandar 8h och 12h-skift',
    pattern: ['F', 'F', 'N', 'N', 'E', 'E', 'D12', 'D12', 'N12', 'N12'],
    cycle: 10,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      D12: { start: '06:00', end: '18:00', name: 'Dag 12h' },
      N12: { start: '18:00', end: '06:00', name: 'Natt 12h' }
    }
  },

  // 6-VECKORS NATTSCHEMA - AVESTA
  'AVESTA_6VECKOR': {
    id: 'AVESTA_6VECKOR',
    name: '6-veckors nattschema',
    description: '6 nätter, 36 lediga dagar',
    pattern: ['N', 'N', 'N', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L'],
    cycle: 42,
    times: {
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 3-SKIFT MED HELGROTATION - ARCTIC PAPER
  'ARCTIC_3SKIFT': {
    id: 'ARCTIC_3SKIFT',
    name: '3-skift med helgrotation',
    description: 'Inkluderar helgspecifika skift',
    pattern: ['E', 'E', 'E', 'F', 'F', 'F', 'N', 'N', 'N', 'NH', 'NH', 'FH', 'FH'],
    cycle: 13,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      FH: { start: '06:00', end: '14:00', name: 'Förmiddag Helg' },
      NH: { start: '22:00', end: '06:00', name: 'Natt Helg' }
    }
  },

  // 2-SKIFT ROTERANDE - UDDEHOLM
  'UDDEHOLM_2SKIFT': {
    id: 'UDDEHOLM_2SKIFT',
    name: '2-skift roterande',
    description: 'Natt och Förmiddag rotation',
    pattern: ['N', 'N', 'N', 'F', 'F', 'F', 'L', 'L', 'L', 'F', 'F', 'F', 'N', 'N'],
    cycle: 14,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      N: { start: '22:00', end: '06:00', name: 'Natt' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  },

  // 2-SKIFT - VOESTALPINE
  'VOESTALPINE_2SKIFT': {
    id: 'VOESTALPINE_2SKIFT',
    name: '2-skift',
    description: 'Förmiddag och Eftermiddag rotation',
    pattern: ['F', 'F', 'F', 'F', 'F', 'L', 'L', 'E', 'E', 'E', 'E', 'E', 'L', 'L'],
    cycle: 14,
    times: {
      F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
      E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
      L: { start: '', end: '', name: 'Ledig' }
    }
  }
};

// Företag med exakta skiftscheman
export const COMPANIES: Record<string, Company> = {
  VOLVO: {
    id: 'VOLVO',
    name: 'VOLVO',
    description: 'Biltillverkning - Elektriska fordon',
    industry: 'Biltillverkning',
    location: 'Göteborg',
    shifts: ['VOLVO_3SKIFT'],
    teams: ['A', 'B', 'C', 'D'],
    colors: {
      A: '#E74C3C',
      B: '#3498DB', 
      C: '#2ECC71',
      D: '#F39C12'
    }
  },

  SCA: {
    id: 'SCA',
    name: 'SCA',
    description: 'Skogsindustri och pappersprodukter - Hållbart skogsbruk',
    industry: 'Skogsindustri',
    location: 'Sundsvall',
    shifts: ['SCA_3SKIFT'],
    teams: ['Röd', 'Blå', 'Gul', 'Grön'],
    colors: {
      'Röd': '#E74C3C',
      'Blå': '#3498DB',
      'Gul': '#F39C12',
      'Grön': '#2ECC71'
    }
  },

  SSAB: {
    id: 'SSAB',
    name: 'SSAB',
    description: 'Stålproduktion och stålprodukter - H2 Green Steel partner',
    industry: 'Stålindustri',
    location: 'Stockholm',
    shifts: ['SSAB_3SKIFT'],
    teams: ['1', '2', '3', '4', '5'],
    colors: {
      '1': '#E74C3C',
      '2': '#3498DB',
      '3': '#2ECC71', 
      '4': '#F39C12',
      '5': '#9B59B6'
    }
  },

  BOLIDEN: {
    id: 'BOLIDEN',
    name: 'BOLIDEN',
    description: 'Gruvindustri - Hållbar produktion',
    industry: 'Gruvindustri',
    location: 'Boliden',
    shifts: ['BOLIDEN_3SKIFT'],
    teams: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    colors: {
      'Alpha': '#E74C3C',
      'Beta': '#3498DB',
      'Gamma': '#2ECC71',
      'Delta': '#F39C12'
    }
  },

  SKANSKA: {
    id: 'SKANSKA',
    name: 'SKANSKA',
    description: 'Bygg och fastigheter - Hållbart byggande',
    industry: 'Bygg',
    location: 'Stockholm',
    shifts: ['SKANSKA_DAG'],
    teams: ['Lag 1', 'Lag 2', 'Lag 3'],
    colors: {
      'Lag 1': '#E74C3C',
      'Lag 2': '#3498DB',
      'Lag 3': '#2ECC71'
    }
  },

  SANDVIK: {
    id: 'SANDVIK',
    name: 'SANDVIK',
    description: 'Verktyg, maskiner och material - Digital transformation',
    industry: 'Verktygsindustri',
    location: 'Sandviken',
    shifts: ['SANDVIK_3SKIFT'],
    teams: ['Team A', 'Team B', 'Team C', 'Team D'],
    colors: {
      'Team A': '#E74C3C',
      'Team B': '#3498DB',
      'Team C': '#2ECC71',
      'Team D': '#F39C12'
    }
  },

  BARILLA: {
    id: 'BARILLA',
    name: 'BARILLA SVERIGE',
    description: 'Livsmedelsproduktion - Filipstad',
    industry: 'Livsmedel',
    location: 'Filipstad',
    shifts: ['BARILLA_5SKIFT'],
    teams: ['1', '2', '3', '4', '5'],
    colors: {
      '1': '#E74C3C',
      '2': '#3498DB',
      '3': '#2ECC71',
      '4': '#F39C12',
      '5': '#9B59B6'
    }
  },

  AGA_AVESTA: {
    id: 'AGA_AVESTA',
    name: 'AGA AVESTA',
    description: 'Kemisk industri - Komplexa rotationer',
    industry: 'Kemisk industri',
    location: 'Avesta',
    shifts: ['AGA_6SKIFT'],
    teams: ['A', 'B', 'C', 'D', 'E', 'F'],
    colors: {
      A: '#E74C3C',
      B: '#3498DB',
      C: '#2ECC71',
      D: '#F39C12',
      E: '#9B59B6',
      F: '#8E44AD'
    }
  },

  ABB_HVDC: {
    id: 'ABB_HVDC',
    name: 'ABB HVDC',
    description: 'Elektrisk industri - Blandar 8h och 12h-skift',
    industry: 'Elektrisk industri',
    location: 'Ludvika',
    shifts: ['ABB_5SKIFT'],
    teams: ['1', '2', '3', '4', '5'],
    colors: {
      '1': '#E74C3C',
      '2': '#3498DB',
      '3': '#2ECC71',
      '4': '#F39C12',
      '5': '#9B59B6'
    }
  },

  AVESTA_6VECKOR: {
    id: 'AVESTA_6VECKOR',
    name: 'AVESTA 6-VECKORS',
    description: '6-veckors nattschema',
    industry: 'Industri',
    location: 'Avesta',
    shifts: ['AVESTA_6VECKOR'],
    teams: ['1', '2', '3', '4', '5', '6'],
    colors: {
      '1': '#E74C3C',
      '2': '#3498DB',
      '3': '#2ECC71',
      '4': '#F39C12',
      '5': '#9B59B6',
      '6': '#8E44AD'
    }
  },

  ARCTIC_PAPER: {
    id: 'ARCTIC_PAPER',
    name: 'ARCTIC PAPER GRYCKSBO',
    description: 'Pappersindustri - 3-skift med helgrotation',
    industry: 'Pappersindustri',
    location: 'Grycksbo',
    shifts: ['ARCTIC_3SKIFT'],
    teams: ['1', '2', '3', '4', '5'],
    colors: {
      '1': '#E74C3C',
      '2': '#3498DB',
      '3': '#2ECC71',
      '4': '#F39C12',
      '5': '#9B59B6'
    }
  },

  UDDEHOLM: {
    id: 'UDDEHOLM',
    name: 'UDDEHOLM TOOLING',
    description: 'Verktygsstål - 2-skift roterande',
    industry: 'Verktygsindustri',
    location: 'Hagfors',
    shifts: ['UDDEHOLM_2SKIFT'],
    teams: ['1', '2', '3'],
    colors: {
      '1': '#E74C3C',
      '2': '#3498DB',
      '3': '#2ECC71'
    }
  },

  VOESTALPINE: {
    id: 'VOESTALPINE',
    name: 'VOESTALPINE PRECISION STRIP',
    description: 'Stålproduktion - 2-skift',
    industry: 'Stålindustri',
    location: 'Motala',
    shifts: ['VOESTALPINE_2SKIFT'],
    teams: ['A', 'B'],
    colors: {
      A: '#E74C3C',
      B: '#3498DB'
    }
  }
};

// Hjälpfunktioner för skiftberäkning
export function calculateShiftForDate(date: Date, shiftType: ShiftType, team: string, startDate: Date = new Date('2025-01-18')) {
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const teamOffset = getTeamOffset(team, shiftType);
  const adjustedDaysDiff = daysDiff + teamOffset;
  const cyclePosition = ((adjustedDaysDiff % shiftType.cycle) + shiftType.cycle) % shiftType.cycle;
  const shiftCode = shiftType.pattern[cyclePosition];

  return {
    code: shiftCode,
    time: shiftType.times[shiftCode],
    cycleDay: cyclePosition + 1
  };
}

export function getTeamOffset(team: string, shiftType: ShiftType): number {
  // Beräkna team offset baserat på team namn/nummer
  const teamIndex = getTeamIndex(team);
  return teamIndex;
}

export function getTeamIndex(team: string): number {
  // Konvertera team namn till index
  if (team === 'A' || team === '1' || team === 'Alpha' || team === 'Röd' || team === 'Lag 1' || team === 'Team A') return 0;
  if (team === 'B' || team === '2' || team === 'Beta' || team === 'Blå' || team === 'Lag 2' || team === 'Team B') return 1;
  if (team === 'C' || team === '3' || team === 'Gamma' || team === 'Gul' || team === 'Lag 3' || team === 'Team C') return 2;
  if (team === 'D' || team === '4' || team === 'Delta' || team === 'Grön' || team === 'Team D') return 3;
  if (team === '5' || team === 'E') return 4;
  if (team === '6' || team === 'F') return 5;
  return 0;
}

export function getShiftColor(shiftCode: string): string {
  switch (shiftCode) {
    case 'F': return '#FF6B6B'; // Förmiddag - Röd
    case 'E': return '#4ECDC4'; // Eftermiddag - Blå
    case 'N': return '#45B7D1'; // Natt - Mörkblå
    case 'D': return '#2ECC71'; // Dag - Grön
    case 'L': return '#95A5A6'; // Ledig - Grå
    case 'D12': return '#1A936F'; // Dag 12h - Mörkgrön
    case 'N12': return '#34495E'; // Natt 12h - Mörkgrå
    case 'FH': return '#E67E22'; // Förmiddag Helg - Orange
    case 'NH': return '#8E44AD'; // Natt Helg - Lila
    case 'FE': return '#FFA502'; // Förmiddag-Eftermiddag - Orange
    case 'EN': return '#6C5CE7'; // Eftermiddag-Natt - Lila
    default: return '#BDC3C7';
  }
} 