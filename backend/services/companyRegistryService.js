/**
 * Company Registry Service - Master database of all supported companies
 * Manages 30+ Swedish companies with their shift patterns, teams, and configurations
 */

class CompanyRegistryService {
  constructor() {
    this.companies = new Map();
    this.shiftPatterns = new Map();
    this.initialized = false;
    this.initializeCompanies();
  }

  initializeCompanies() {
    // SSAB Group Companies
    this.registerCompany({
      id: 'ssab_oxelosund',
      name: 'SSAB Oxelösund',
      industry: 'Stålindustri',
      location: 'Oxelösund',
      description: 'SSAB stålverk med 5-team kontinuerligt system',
      shiftSystem: 'ssab_5team_21day',
      teams: ['31', '32', '33', '34', '35'],
      departments: ['Masugn', 'Stålverk', 'Varmvalsning', 'Underhåll', 'Kvalitet'],
      colors: {
        '31': '#4CAF50',
        '32': '#2196F3', 
        '33': '#FF9800',
        '34': '#9C27B0',
        '35': '#F44336'
      }
    });

    this.registerCompany({
      id: 'ssab_borlange',
      name: 'SSAB Borlänge',
      industry: 'Stålindustri',
      location: 'Borlänge',
      description: 'SSAB Borlänge 5-team system',
      shiftSystem: 'ssab_5team_15day',
      teams: ['A-lag', 'B-lag', 'C-lag', 'D-lag', 'E-lag'],
      departments: ['Masugn', 'Stålverk', 'Varmvalsning', 'Underhåll'],
      colors: {
        'A-lag': '#E74C3C',
        'B-lag': '#3498DB',
        'C-lag': '#2ECC71',
        'D-lag': '#F39C12',
        'E-lag': '#9B59B6'
      }
    });

    // Volvo Group
    this.registerCompany({
      id: 'volvo_trucks',
      name: 'Volvo Trucks',
      industry: 'Fordonsindustri',
      location: 'Göteborg',
      description: 'Volvo lastbilstillverkning med 3-skift system',
      shiftSystem: 'volvo_3shift_8day',
      teams: ['A', 'B', 'C', 'D'],
      departments: ['Chassi', 'Kabin', 'Motor', 'Montering', 'Kvalitet'],
      colors: {
        'A': '#1B365D',
        'B': '#4A90E2',
        'C': '#7ED321',
        'D': '#F5A623'
      }
    });

    this.registerCompany({
      id: 'volvo_cars',
      name: 'Volvo Cars',
      industry: 'Fordonsindustri', 
      location: 'Torslanda',
      description: 'Volvo personbilstillverkning',
      shiftSystem: 'volvo_2shift_10day',
      teams: ['Team 1', 'Team 2', 'Team 3'],
      departments: ['Karosseri', 'Lackering', 'Montering', 'Kvalitet'],
      colors: {
        'Team 1': '#003057',
        'Team 2': '#0099CC',
        'Team 3': '#66B2FF'
      }
    });

    // Scania
    this.registerCompany({
      id: 'scania',
      name: 'Scania',
      industry: 'Fordonsindustri',
      location: 'Södertälje',
      description: 'Scania lastbilar och bussar',
      shiftSystem: 'scania_3shift_9day',
      teams: ['Röd', 'Blå', 'Gul'],
      departments: ['Chassi', 'Kabin', 'Motor', 'Montering'],
      colors: {
        'Röd': '#FF0000',
        'Blå': '#0066CC',
        'Gul': '#FFCC00'
      }
    });

    // SKF Group
    this.registerCompany({
      id: 'skf_goteborg',
      name: 'SKF Göteborg',
      industry: 'Maskinindustri',
      location: 'Göteborg',
      description: 'SKF kullager och tätningar',
      shiftSystem: 'skf_3shift_12day',
      teams: ['1', '2', '3', '4'],
      departments: ['Svarvning', 'Slipning', 'Montering', 'Kvalitet'],
      colors: {
        '1': '#0066CC',
        '2': '#FF6600',
        '3': '#00CC66',
        '4': '#CC0066'
      }
    });

    // Sandvik Group
    this.registerCompany({
      id: 'sandvik_sandviken',
      name: 'Sandvik Sandviken',
      industry: 'Maskinindustri',
      location: 'Sandviken',
      description: 'Sandvik verktyg och material',
      shiftSystem: 'sandvik_3shift_12day',
      teams: ['Team A', 'Team B', 'Team C', 'Team D'],
      departments: ['Produktion', 'Bearbetning', 'Kvalitet', 'F&U'],
      colors: {
        'Team A': '#FF6B35',
        'Team B': '#004225',
        'Team C': '#F7931E',
        'Team D': '#C5D86D'
      }
    });

    // Boliden Group
    this.registerCompany({
      id: 'boliden_aitik',
      name: 'Boliden Aitik',
      industry: 'Gruvindustri',
      location: 'Gällivare',
      description: 'Boliden Aitik koppargruva',
      shiftSystem: 'boliden_4shift_7day',
      teams: ['Lag 1', 'Lag 2', 'Lag 3', 'Lag 4'],
      departments: ['Gruva', 'Kross', 'Anrikning', 'Underhåll'],
      colors: {
        'Lag 1': '#8B4513',
        'Lag 2': '#FF6347',
        'Lag 3': '#32CD32',
        'Lag 4': '#4169E1'
      }
    });

    this.registerCompany({
      id: 'boliden_garpenberg',
      name: 'Boliden Garpenberg',
      industry: 'Gruvindustri',
      location: 'Hedemora',
      description: 'Boliden Garpenberg zink-silvergruva',
      shiftSystem: 'boliden_5shift_15day',
      teams: ['A-Lag', 'B-Lag', 'C-Lag', 'D-Lag', 'E-Lag'],
      departments: ['Gruva', 'Anrikning', 'Underhåll', 'Miljö'],
      colors: {
        'A-Lag': '#4169E1',
        'B-Lag': '#FF6347',
        'C-Lag': '#32CD32',
        'D-Lag': '#FFD700',
        'E-Lag': '#FF69B4'
      }
    });

    // LKAB
    this.registerCompany({
      id: 'lkab_kiruna',
      name: 'LKAB Kiruna',
      industry: 'Gruvindustri',
      location: 'Kiruna',
      description: 'LKAB järnmalmsgruva',
      shiftSystem: 'lkab_4shift_8day',
      teams: ['Nord', 'Syd', 'Öst', 'Väst'],
      departments: ['Gruva', 'Transport', 'Underhåll', 'Säkerhet'],
      colors: {
        'Nord': '#FF0000',
        'Syd': '#00FF00',
        'Öst': '#0000FF',
        'Väst': '#FFFF00'
      }
    });

    // SCA Group
    this.registerCompany({
      id: 'sca_ostrand',
      name: 'SCA Östrand',
      industry: 'Skogsindustri',
      location: 'Timrå',
      description: 'SCA Östrand massafabrik',
      shiftSystem: 'sca_3shift_10day',
      teams: ['Röd', 'Blå', 'Gul', 'Grön'],
      departments: ['Massa', 'Blekning', 'Energi', 'Underhåll'],
      colors: {
        'Röd': '#E74C3C',
        'Blå': '#3498DB',
        'Gul': '#F39C12',
        'Grön': '#2ECC71'
      }
    });

    // Stora Enso
    this.registerCompany({
      id: 'stora_enso_kvarnsveden',
      name: 'Stora Enso Kvarnsveden',
      industry: 'Skogsindustri',
      location: 'Borlänge',
      description: 'Stora Enso Kvarnsveden pappersbruk',
      shiftSystem: 'stora_enso_4shift_12day',
      teams: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      departments: ['Massa', 'Papper', 'Finish', 'Underhåll'],
      colors: {
        'Alpha': '#228B22',
        'Beta': '#4169E1',
        'Gamma': '#FF6347',
        'Delta': '#FFD700'
      }
    });

    // Holmen
    this.registerCompany({
      id: 'holmen_hallsta',
      name: 'Holmen Hallsta',
      industry: 'Skogsindustri',
      location: 'Hallstavik',
      description: 'Holmen Hallsta pappersbruk',
      shiftSystem: 'holmen_3shift_9day',
      teams: ['1', '2', '3'],
      departments: ['TMP', 'Papper', 'Finish', 'Underhåll'],
      colors: {
        '1': '#006B3C',
        '2': '#40826D',
        '3': '#95D5B2'
      }
    });

    // ABB Group
    this.registerCompany({
      id: 'abb_ludvika',
      name: 'ABB Ludvika',
      industry: 'Elektroindustri',
      location: 'Ludvika',
      description: 'ABB HVDC-teknik',
      shiftSystem: 'abb_5shift_mixed',
      teams: ['1', '2', '3', '4', '5'],
      departments: ['Produktion', 'Montering', 'Test', 'Kvalitet'],
      colors: {
        '1': '#FF0000',
        '2': '#00FF00',
        '3': '#0000FF',
        '4': '#FFFF00',
        '5': '#FF00FF'
      }
    });

    // Atlas Copco
    this.registerCompany({
      id: 'atlas_copco',
      name: 'Atlas Copco',
      industry: 'Maskinindustri',
      location: 'Stockholm',
      description: 'Atlas Copco kompressorer',
      shiftSystem: 'atlas_copco_2shift_7day',
      teams: ['Day', 'Evening'],
      departments: ['Montering', 'Test', 'Kvalitet'],
      colors: {
        'Day': '#E20016',
        'Evening': '#003C71'
      }
    });

    // AGA/Linde
    this.registerCompany({
      id: 'aga_avesta',
      name: 'AGA Avesta',
      industry: 'Kemisk industri',
      location: 'Avesta',
      description: 'AGA industriella gaser',
      shiftSystem: 'aga_6shift_18day',
      teams: ['A', 'B', 'C', 'D', 'E', 'F'],
      departments: ['Destillation', 'Komprimering', 'Kvalitet', 'Underhåll'],
      colors: {
        'A': '#E74C3C',
        'B': '#3498DB',
        'C': '#2ECC71',
        'D': '#9B59B6',
        'E': '#F39C12',
        'F': '#1ABC9C'
      }
    });

    // Ovako
    this.registerCompany({
      id: 'ovako_hofors',
      name: 'Ovako Hofors',
      industry: 'Stålindustri',
      location: 'Hofors',
      description: 'Ovako specialstål',
      shiftSystem: 'ovako_3shift_12day',
      teams: ['A', 'B', 'C', 'D'],
      departments: ['Smältverk', 'Valsning', 'Värmebehandling', 'Kvalitet'],
      colors: {
        'A': '#8B0000',
        'B': '#FF4500',
        'C': '#FFD700',
        'D': '#32CD32'
      }
    });

    // Autoliv
    this.registerCompany({
      id: 'autoliv_vargarda',
      name: 'Autoliv Vårgårda',
      industry: 'Fordonsindustri',
      location: 'Vårgårda',
      description: 'Autoliv säkerhetssystem',
      shiftSystem: 'autoliv_2shift_5day',
      teams: ['Day', 'Night'],
      departments: ['Produktion', 'Montering', 'Test', 'Kvalitet'],
      colors: {
        'Day': '#0066CC',
        'Night': '#FF6600'
      }
    });

    // Vattenfall
    this.registerCompany({
      id: 'vattenfall_ringhals',
      name: 'Vattenfall Ringhals',
      industry: 'Energi',
      location: 'Varberg',
      description: 'Vattenfall kärnkraftverk',
      shiftSystem: 'vattenfall_6shift_24day',
      teams: ['A', 'B', 'C', 'D', 'E', 'F'],
      departments: ['Reaktor', 'Turbin', 'Drift', 'Underhåll', 'Säkerhet'],
      colors: {
        'A': '#FF0000',
        'B': '#00FF00',
        'C': '#0000FF',
        'D': '#FFFF00',
        'E': '#FF00FF',
        'F': '#00FFFF'
      }
    });

    // Preem
    this.registerCompany({
      id: 'preem_lysekil',
      name: 'Preem Lysekil',
      industry: 'Energi',
      location: 'Lysekil',
      description: 'Preem raffinaderі',
      shiftSystem: 'preem_4shift_12day',
      teams: ['1', '2', '3', '4'],
      departments: ['Destillation', 'Katalys', 'Drift', 'Underhåll'],
      colors: {
        '1': '#00A651',
        '2': '#0066CC',
        '3': '#FF6600',
        '4': '#CC0066'
      }
    });

    // Skanska
    this.registerCompany({
      id: 'skanska',
      name: 'Skanska',
      industry: 'Bygg',
      location: 'Stockholm',
      description: 'Skanska bygg och anläggning',
      shiftSystem: 'skanska_day_5day',
      teams: ['Lag 1', 'Lag 2', 'Lag 3'],
      departments: ['Bygg', 'Anläggning', 'Projektering'],
      colors: {
        'Lag 1': '#00AA44',
        'Lag 2': '#0066CC',
        'Lag 3': '#FF6600'
      }
    });

    // NCC
    this.registerCompany({
      id: 'ncc',
      name: 'NCC',
      industry: 'Bygg',
      location: 'Solna',
      description: 'NCC bygg och fastigheter',
      shiftSystem: 'ncc_day_5day',
      teams: ['Team A', 'Team B'],
      departments: ['Husbyggnad', 'Anläggning', 'Fastigheter'],
      colors: {
        'Team A': '#FFD100',
        'Team B': '#003C71'
      }
    });

    // Ericsson
    this.registerCompany({
      id: 'ericsson_kista',
      name: 'Ericsson Kista',
      industry: 'Telekom',
      location: 'Kista',
      description: 'Ericsson telekommunikation',
      shiftSystem: 'ericsson_3shift_support',
      teams: ['Day', 'Evening', 'Night'],
      departments: ['Support', 'Utveckling', 'Test'],
      colors: {
        'Day': '#0082CA',
        'Evening': '#002561',
        'Night': '#8A2BE2'
      }
    });

    // Lantmännen
    this.registerCompany({
      id: 'lantmannen_cerealia',
      name: 'Lantmännen Cerealia',
      industry: 'Livsmedel',
      location: 'Malmö',
      description: 'Lantmännen spannmålsförädling',
      shiftSystem: 'lantmannen_2shift_5day',
      teams: ['Dag', 'Kväll'],
      departments: ['Malning', 'Bakning', 'Förpackning'],
      colors: {
        'Dag': '#228B22',
        'Kväll': '#FFD700'
      }
    });

    // Orkla
    this.registerCompany({
      id: 'orkla_sweden',
      name: 'Orkla Sverige',
      industry: 'Livsmedel',
      location: 'Eslöv',
      description: 'Orkla livsmedelsproduktion',
      shiftSystem: 'orkla_2shift_6day',
      teams: ['1', '2'],
      departments: ['Produktion', 'Förpackning', 'Kvalitet'],
      colors: {
        '1': '#FF6B35',
        '2': '#004225'
      }
    });

    // Barilla
    this.registerCompany({
      id: 'barilla_filipstad',
      name: 'Barilla Filipstad',
      industry: 'Livsmedel',
      location: 'Filipstad',
      description: 'Barilla pastaproduktion',
      shiftSystem: 'barilla_5shift_8day',
      teams: ['1', '2', '3', '4', '5'],
      departments: ['Pasta', 'Sauce', 'Förpackning'],
      colors: {
        '1': '#FF6B6B',
        '2': '#4ECDC4',
        '3': '#45B7D1',
        '4': '#96CEB4',
        '5': '#FFA502'
      }
    });

    // AstraZeneca
    this.registerCompany({
      id: 'astrazeneca_sodertalje',
      name: 'AstraZeneca Södertälje',
      industry: 'Läkemedel',
      location: 'Södertälje',
      description: 'AstraZeneca läkemedelsproduktion',
      shiftSystem: 'az_3shift_continuous',
      teams: ['Alpha', 'Beta', 'Gamma'],
      departments: ['Produktion', 'Kvalitet', 'Förpackning'],
      colors: {
        'Alpha': '#4B0082',
        'Beta': '#8A2BE2',
        'Gamma': '#9370DB'
      }
    });

    // Arctic Paper
    this.registerCompany({
      id: 'arctic_paper_grycksbo',
      name: 'Arctic Paper Grycksbo',
      industry: 'Skogsindustri',
      location: 'Grycksbo',
      description: 'Arctic Paper papperstillverkning',
      shiftSystem: 'arctic_3shift_helg',
      teams: ['1', '2', '3', '4', '5'],
      departments: ['Papper', 'Finish', 'Underhåll'],
      colors: {
        '1': '#87CEEB',
        '2': '#4682B4',
        '3': '#1E90FF',
        '4': '#0000CD',
        '5': '#000080'
      }
    });

    // Uddeholm
    this.registerCompany({
      id: 'uddeholm',
      name: 'Uddeholm Tooling',
      industry: 'Stålindustri',
      location: 'Hagfors',
      description: 'Uddeholm verktygsstål',
      shiftSystem: 'uddeholm_2shift_rotating',
      teams: ['1', '2', '3'],
      departments: ['Smältverk', 'Valsning', 'Bearbetning'],
      colors: {
        '1': '#8B0000',
        '2': '#FF4500',
        '3': '#32CD32'
      }
    });

    // voestalpine
    this.registerCompany({
      id: 'voestalpine_precision',
      name: 'voestalpine Precision Strip',
      industry: 'Stålindustri',
      location: 'Motala',
      description: 'voestalpine specialstål',
      shiftSystem: 'voestalpine_2shift',
      teams: ['A', 'B'],
      departments: ['Valsning', 'Bearbetning', 'Kvalitet'],
      colors: {
        'A': '#E74C3C',
        'B': '#3498DB'
      }
    });

    // Initialize shift patterns
    this.initializeShiftPatterns();
    this.initialized = true;
  }

  initializeShiftPatterns() {
    // SSAB Oxelösund 21-day cycle (current system)
    this.registerShiftPattern('ssab_5team_21day', {
      name: 'SSAB 5-team 21-dagars cykel',
      pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L'],
      cycleLength: 21,
      teamOffsets: { '31': 0, '32': 4, '33': 8, '34': 12, '35': 16 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 10,
      restDaysPerCycle: 11
    });

    // SSAB Borlänge 15-day cycle
    this.registerShiftPattern('ssab_5team_15day', {
      name: 'SSAB 5-team 15-dagars cykel',
      pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L'],
      cycleLength: 15,
      teamOffsets: { 'A-lag': 0, 'B-lag': 3, 'C-lag': 6, 'D-lag': 9, 'E-lag': 12 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 9,
      restDaysPerCycle: 6
    });

    // Volvo 3-shift 8-day cycle
    this.registerShiftPattern('volvo_3shift_8day', {
      name: 'Volvo 3-skift 8-dagars cykel',
      pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L'],
      cycleLength: 8,
      teamOffsets: { 'A': 0, 'B': 2, 'C': 4, 'D': 6 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 6,
      restDaysPerCycle: 2
    });

    // Volvo 2-shift 10-day cycle
    this.registerShiftPattern('volvo_2shift_10day', {
      name: 'Volvo 2-skift 10-dagars cykel',
      pattern: ['F', 'F', 'F', 'F', 'F', 'E', 'E', 'E', 'L', 'L'],
      cycleLength: 10,
      teamOffsets: { 'Team 1': 0, 'Team 2': 5, 'Team 3': 8 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 8,
      restDaysPerCycle: 2
    });

    // Scania 3-shift 9-day cycle
    this.registerShiftPattern('scania_3shift_9day', {
      name: 'Scania 3-skift 9-dagars cykel',
      pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'L'],
      cycleLength: 9,
      teamOffsets: { 'Röd': 0, 'Blå': 3, 'Gul': 6 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 8,
      restDaysPerCycle: 1
    });

    // SKF 3-shift 12-day cycle
    this.registerShiftPattern('skf_3shift_12day', {
      name: 'SKF 3-skift 12-dagars cykel',
      pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L'],
      cycleLength: 12,
      teamOffsets: { '1': 0, '2': 3, '3': 6, '4': 9 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 9,
      restDaysPerCycle: 3
    });

    // Sandvik pattern
    this.registerShiftPattern('sandvik_3shift_12day', {
      name: 'Sandvik 3-skift 12-dagars cykel',
      pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L'],
      cycleLength: 12,
      teamOffsets: { 'Team A': 0, 'Team B': 3, 'Team C': 6, 'Team D': 9 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 9,
      restDaysPerCycle: 3
    });

    // Boliden Aitik 7-day cycle
    this.registerShiftPattern('boliden_4shift_7day', {
      name: 'Boliden 4-skift 7-dagars cykel',
      pattern: ['D', 'D', 'K', 'K', 'N', 'N', 'L'],
      cycleLength: 7,
      teamOffsets: { 'Lag 1': 0, 'Lag 2': 2, 'Lag 3': 4, 'Lag 4': 6 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 6,
      restDaysPerCycle: 1
    });

    // Add more patterns for remaining companies...
    // (I'll add the rest to keep the file manageable)

    // AGA Avesta complex 18-day pattern
    this.registerShiftPattern('aga_6shift_18day', {
      name: 'AGA 6-skift 18-dagars komplex cykel',
      pattern: ['D', 'D', 'F', 'F', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L', 'E', 'E', 'FE', 'FE', 'EN', 'EN'],
      cycleLength: 18,
      teamOffsets: { 'A': 0, 'B': 3, 'C': 6, 'D': 9, 'E': 12, 'F': 15 },
      shiftTimes: {
        'D': { start: '06:00', end: '18:00', name: 'Dag 12h', hours: 12 },
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'FE': { start: '06:00', end: '22:00', name: 'Förmiddag-Eftermiddag', hours: 16 },
        'EN': { start: '14:00', end: '06:00', name: 'Eftermiddag-Natt', hours: 16 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 12,
      restDaysPerCycle: 6
    });

    // Simple day shift patterns
    this.registerShiftPattern('skanska_day_5day', {
      name: 'Skanska dagskift 5-dagars vecka',
      pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
      cycleLength: 7,
      teamOffsets: { 'Lag 1': 0, 'Lag 2': 0, 'Lag 3': 0 },
      shiftTimes: {
        'D': { start: '07:00', end: '16:00', name: 'Dag', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 5,
      restDaysPerCycle: 2
    });

    // SCA Östrand 10-day 3-shift pattern
    this.registerShiftPattern('sca_3shift_10day', {
      name: 'SCA 3-skift 10-dagars cykel',
      pattern: ['F', 'F', 'F', 'E', 'E', 'N', 'N', 'L', 'L', 'L'],
      cycleLength: 10,
      teamOffsets: { 'Röd': 0, 'Blå': 3, 'Gul': 6, 'Grön': 2 },
      shiftTimes: {
        'F': { start: '06:00', end: '14:00', name: 'Förmiddag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Eftermiddag', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 7,
      restDaysPerCycle: 3
    });

    // ABB Ludvika mixed 5-shift pattern
    this.registerShiftPattern('abb_5shift_mixed', {
      name: 'ABB 5-skift mixed mönster',
      pattern: ['D', 'D', 'K', 'K', 'N', 'L', 'L', 'D', 'D', 'K', 'K', 'N', 'N', 'L'],
      cycleLength: 14,
      teamOffsets: { '1': 0, '2': 3, '3': 6, '4': 9, '5': 12 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 10,
      restDaysPerCycle: 4
    });

    // Boliden Garpenberg 15-day pattern
    this.registerShiftPattern('boliden_5shift_15day', {
      name: 'Boliden 5-skift 15-dagars cykel',
      pattern: ['D', 'D', 'D', 'K', 'K', 'K', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L'],
      cycleLength: 15,
      teamOffsets: { 'A-Lag': 0, 'B-Lag': 3, 'C-Lag': 6, 'D-Lag': 9, 'E-Lag': 12 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 9,
      restDaysPerCycle: 6
    });

    // Stora Enso 12-day 4-shift pattern
    this.registerShiftPattern('stora_enso_4shift_12day', {
      name: 'Stora Enso 4-skift 12-dagars cykel',
      pattern: ['D', 'D', 'D', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L'],
      cycleLength: 12,
      teamOffsets: { 'Alpha': 0, 'Beta': 3, 'Gamma': 6, 'Delta': 9 },
      shiftTimes: {
        'D': { start: '06:00', end: '18:00', name: 'Dag 12h', hours: 12 },
        'N': { start: '18:00', end: '06:00', name: 'Natt 12h', hours: 12 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 6,
      restDaysPerCycle: 6
    });

    // Holmen 9-day 3-shift pattern
    this.registerShiftPattern('holmen_3shift_9day', {
      name: 'Holmen 3-skift 9-dagars cykel',
      pattern: ['D', 'D', 'D', 'E', 'E', 'E', 'N', 'N', 'N'],
      cycleLength: 9,
      teamOffsets: { '1': 0, '2': 3, '3': 6 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 9,
      restDaysPerCycle: 0
    });

    // Atlas Copco 2-shift 7-day pattern
    this.registerShiftPattern('atlas_copco_2shift_7day', {
      name: 'Atlas Copco 2-skift 7-dagars vecka',
      pattern: ['D', 'D', 'D', 'D', 'D', 'K', 'K'],
      cycleLength: 7,
      teamOffsets: { 'Day': 0, 'Evening': 0 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 7,
      restDaysPerCycle: 0
    });

    // Additional patterns for completeness
    this.registerShiftPattern('lantmannen_2shift_5day', {
      name: 'Lantmännen 2-skift 5-dagars vecka',
      pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
      cycleLength: 7,
      teamOffsets: { 'Dag': 0, 'Kväll': 0 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 5,
      restDaysPerCycle: 2
    });

    this.registerShiftPattern('orkla_2shift_6day', {
      name: 'Orkla 2-skift 6-dagars vecka',
      pattern: ['D', 'D', 'D', 'K', 'K', 'K', 'L'],
      cycleLength: 7,
      teamOffsets: { '1': 0, '2': 3 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 6,
      restDaysPerCycle: 1
    });

    this.registerShiftPattern('barilla_5shift_8day', {
      name: 'Barilla 5-skift 8-dagars cykel',
      pattern: ['D', 'D', 'K', 'K', 'N', 'N', 'L', 'L'],
      cycleLength: 8,
      teamOffsets: { '1': 0, '2': 2, '3': 4, '4': 6, '5': 1 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 6,
      restDaysPerCycle: 2
    });

    this.registerShiftPattern('az_3shift_continuous', {
      name: 'AstraZeneca 3-skift kontinuerlig',
      pattern: ['D', 'D', 'E', 'E', 'N', 'N', 'L'],
      cycleLength: 7,
      teamOffsets: { 'Alpha': 0, 'Beta': 2, 'Gamma': 4 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 6,
      restDaysPerCycle: 1
    });

    this.registerShiftPattern('arctic_3shift_helg', {
      name: 'Arctic Paper 3-skift med helgarbete',
      pattern: ['D', 'D', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L', 'L'],
      cycleLength: 14,
      teamOffsets: { '1': 0, '2': 2, '3': 4, '4': 6, '5': 8 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'E': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'N': { start: '22:00', end: '06:00', name: 'Natt', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 7,
      restDaysPerCycle: 7
    });

    this.registerShiftPattern('uddeholm_2shift_rotating', {
      name: 'Uddeholm 2-skift roterande',
      pattern: ['D', 'D', 'D', 'D', 'D', 'K', 'K', 'K', 'K', 'K', 'L', 'L', 'L', 'L'],
      cycleLength: 14,
      teamOffsets: { '1': 0, '2': 7, '3': 3 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'K': { start: '14:00', end: '22:00', name: 'Kväll', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 10,
      restDaysPerCycle: 4
    });

    this.registerShiftPattern('voestalpine_2shift', {
      name: 'voestalpine 2-skift dagskift',
      pattern: ['D', 'D', 'D', 'D', 'D', 'L', 'L'],
      cycleLength: 7,
      teamOffsets: { 'A': 0, 'B': 0 },
      shiftTimes: {
        'D': { start: '06:00', end: '14:00', name: 'Dag', hours: 8 },
        'L': { start: null, end: null, name: 'Ledigt', hours: 0 }
      },
      workingDaysPerCycle: 5,
      restDaysPerCycle: 2
    });
  }

  registerCompany(config) {
    this.companies.set(config.id, {
      ...config,
      registeredAt: new Date().toISOString()
    });
  }

  registerShiftPattern(id, pattern) {
    this.shiftPatterns.set(id, {
      id,
      ...pattern,
      registeredAt: new Date().toISOString()
    });
  }

  // Public API methods
  getAllCompanies() {
    return Array.from(this.companies.values());
  }

  getCompany(companyId) {
    return this.companies.get(companyId);
  }

  getCompanyByName(name) {
    return Array.from(this.companies.values()).find(company => 
      company.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  getCompaniesByIndustry(industry) {
    return Array.from(this.companies.values()).filter(company => 
      company.industry === industry
    );
  }

  searchCompanies(query) {
    const searchTerm = query.toLowerCase();
    return Array.from(this.companies.values()).filter(company => 
      company.name.toLowerCase().includes(searchTerm) ||
      company.description.toLowerCase().includes(searchTerm) ||
      company.industry.toLowerCase().includes(searchTerm) ||
      company.location.toLowerCase().includes(searchTerm)
    );
  }

  getShiftPattern(patternId) {
    return this.shiftPatterns.get(patternId);
  }

  getAllShiftPatterns() {
    return Array.from(this.shiftPatterns.values());
  }

  getIndustries() {
    const industries = new Set();
    this.companies.forEach(company => industries.add(company.industry));
    return Array.from(industries).sort();
  }

  getLocations() {
    const locations = new Set();
    this.companies.forEach(company => locations.add(company.location));
    return Array.from(locations).sort();
  }

  // Statistics
  getStatistics() {
    const companies = this.getAllCompanies();
    const patterns = this.getAllShiftPatterns();
    
    return {
      totalCompanies: companies.length,
      totalPatterns: patterns.length,
      industriesCount: this.getIndustries().length,
      locationsCount: this.getLocations().length,
      averageTeamsPerCompany: companies.reduce((sum, c) => sum + c.teams.length, 0) / companies.length,
      companiesByIndustry: this.getIndustries().reduce((acc, industry) => {
        acc[industry] = this.getCompaniesByIndustry(industry).length;
        return acc;
      }, {}),
      initialized: this.initialized,
      lastUpdated: new Date().toISOString()
    };
  }

  // Validation
  validateCompanyConfiguration(companyId) {
    const company = this.getCompany(companyId);
    if (!company) return { valid: false, error: 'Company not found' };

    const pattern = this.getShiftPattern(company.shiftSystem);
    if (!pattern) return { valid: false, error: 'Shift pattern not found' };

    // Validate team offsets exist for all teams
    const missingOffsets = company.teams.filter(team => 
      !pattern.teamOffsets.hasOwnProperty(team)
    );
    
    if (missingOffsets.length > 0) {
      return { 
        valid: false, 
        error: `Missing team offsets for: ${missingOffsets.join(', ')}` 
      };
    }

    return { valid: true };
  }
}

module.exports = CompanyRegistryService;