// 🏭 Företagsdata för Skiftappen
// Baserat på ShiftSchedules.js men anpassat för TypeScript och React-komponenter

export interface Company {
  id: string;
  name: string;
  description: string;
  location: string;
  shifts: string[];
  teams: string[];
  colors: Record<string, string>;
}

export const COMPANIES: Record<string, Company> = {
  VOLVO: {
    id: 'volvo',
    name: 'Volvo',
    description: 'Lastbilar och entreprenadmaskiner',
    location: 'Göteborg, Sverige',
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
    location: 'Sundsvall, Sverige',
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
    location: 'Borlänge, Sverige',
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

  BOLIDEN: {
    id: 'boliden',
    name: 'Boliden',
    description: 'Gruva och mineral',
    location: 'Boliden, Sverige',
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
    description: 'Pasta och livsmedel',
    location: 'Filipstad, Sverige',
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
    location: 'Avesta, Sverige',
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
    location: 'Sandviken, Sverige',
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
    location: 'Stockholm, Sverige',
    shifts: ['SKANSKA_DAG', 'SKANSKA_KVALL', 'SKANSKA_HELG'],
    teams: ['Lag 1', 'Lag 2', 'Lag 3'],
    colors: {
      'Lag 1': '#E74C3C',
      'Lag 2': '#3498DB',
      'Lag 3': '#2ECC71'
    }
  }
};

export const COMPANY_LIST = Object.values(COMPANIES);

// Hjälpfunktioner
export function getCompanyById(id: string): Company | undefined {
  return COMPANY_LIST.find(company => company.id === id);
}

export function getCompanyByName(name: string): Company | undefined {
  return COMPANY_LIST.find(company => company.name === name);
}

export function getCompanyTeams(companyId: string): string[] {
  const company = getCompanyById(companyId);
  return company?.teams || [];
}

export function getCompanyColors(companyId: string): Record<string, string> {
  const company = getCompanyById(companyId);
  return company?.colors || {};
} 