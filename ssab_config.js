// 🏭 SSAB Oxelösund Configuration
// Konfigurationsfil för SSAB Oxelösund skiftsystem

export const SSAB_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: "https://fsefeherdbtsddqimjco.supabase.co",
  SUPABASE_ANON_KEY: "DIN-ANON-KEY-HÄR", // Ersätt med din riktiga anon key
  
  // SSAB Oxelösund Company Info
  COMPANY: {
    name: "SSAB OXELÖSUND",
    location: "Oxelösund",
    industry: "Stålindustri",
    website: "https://www.ssab.com/oxelosund",
    employeeCount: 800,
    foundedYear: 1917
  },
  
  // Teams Configuration
  TEAMS: [
    { id: "lag-31", name: "Lag 31", color: "#FF6B6B", offset: 0 },
    { id: "lag-32", name: "Lag 32", color: "#4ECDC4", offset: 1 },
    { id: "lag-33", name: "Lag 33", color: "#45B7D1", offset: 2 },
    { id: "lag-34", name: "Lag 34", color: "#96CEB4", offset: 3 },
    { id: "lag-35", name: "Lag 35", color: "#FFEAA7", offset: 4 }
  ],
  
  // Shift Pattern
  SHIFT_PATTERN: [
    "2F", "2E", "3N", "4L", "3F", "3E", "1N", "5L",
    "2F", "2E", "3N", "5L", "3F", "2E", "2N", "4L"
  ],
  
  // Shift Times
  SHIFT_TIMES: {
    F: { start: "06:00", end: "14:00", title: "Förmiddagsskift" },
    E: { start: "14:00", end: "22:00", title: "Eftermiddagsskift" },
    N: { start: "22:00", end: "06:00", title: "Nattskift" },
    L: { start: "00:00", end: "23:59", title: "Ledig" }
  },
  
  // Rules
  RULES: {
    allowedStartDays: [1, 3, 5], // Måndag, Onsdag, Fredag
    workBlockDays: 7,
    cycleLength: 16,
    description: [
      "Endast måndag, onsdag eller fredag är tillåtna startdagar",
      "Varje arbetsblock = 7 dagar (exakt 7 skiftdagar i följd)",
      "Varje ledighet = 4 eller 5 dagar, beroende på var i rotationen",
      "Kedjelogik: När ett lag går in i sitt första E, börjar nästa lag sitt 7-dagarsblock"
    ]
  },
  
  // Date Range
  DATE_RANGE: {
    start: "2023-01-01",
    end: "2035-12-31"
  }
};

// Exempel på användning
export const SSAB_EXAMPLES = {
  // Exempel 1: Hämta skift för Lag 31 den 12 januari 2026
  getShiftForDate: `
const { data, error } = await supabase
  .from("shifts")
  .select("*")
  .eq("shift_teams.name", "Lag 31")
  .eq("start_time", "2026-01-12T00:00:00");
  `,
  
  // Exempel 2: Hämta alla skift för en vecka
  getShiftsForWeek: `
const { data, error } = await supabase
  .from("shifts")
  .select("*")
  .gte("start_time", "2025-01-06")
  .lte("start_time", "2025-01-12")
  .order("start_time");
  `,
  
  // Exempel 3: Använd RPC funktion
  useRPCFunction: `
const { data, error } = await supabase
  .rpc("get_ssab_oxelosund_shifts", {
    p_start_date: "2025-01-01",
    p_end_date: "2025-01-31",
    p_team_filter: "Lag 31"
  });
  `
};

// Helper funktioner
export const SSAB_HELPERS = {
  // Skapa Supabase client
  createSupabaseClient: (anonKey) => {
    const { createClient } = require("@supabase/supabase-js");
    return createClient(SSAB_CONFIG.SUPABASE_URL, anonKey);
  },
  
  // Hämta team färg
  getTeamColor: (teamName) => {
    const team = SSAB_CONFIG.TEAMS.find(t => t.name === teamName);
    return team?.color || "#000000";
  },
  
  // Validera datum
  isValidStartDate: (date) => {
    const dayOfWeek = new Date(date).getDay();
    return SSAB_CONFIG.RULES.allowedStartDays.includes(dayOfWeek);
  },
  
  // Formatera skifttid
  formatShiftTime: (shiftType, date) => {
    const shift = SSAB_CONFIG.SHIFT_TIMES[shiftType];
    if (!shift) return null;
    
    const shiftDate = new Date(date);
    const [startHour, startMinute] = shift.start.split(":");
    const [endHour, endMinute] = shift.end.split(":");
    
    const startTime = new Date(shiftDate);
    startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const endTime = new Date(shiftDate);
    endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
    
    // Hantera nattskift som går över midnatt
    if (shiftType === "N") {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    return { startTime, endTime, title: shift.title };
  }
};

export default SSAB_CONFIG; 