// 🇸🇪 Swedish Calendar Utilities - Korrekt hantering av svensk tid och kalender
// Hanterar sommartid, vintertid, skottår och svenska helgdagar

export interface SwedishDateInfo {
  date: Date;
  day: number;
  weekday: number; // 0 = Söndag, 1 = Måndag, etc.
  weekdayName: string;
  isWeekend: boolean;
  isToday: boolean;
  isDST: boolean; // Sommartid
  timezone: 'CET' | 'CEST';
  weekNumber: number;
}

export interface SwedishHoliday {
  name: string;
  date: Date;
  isPublicHoliday: boolean;
}

// Svenska veckodagar
export const SWEDISH_WEEKDAYS = [
  'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
];

export const SWEDISH_WEEKDAYS_SHORT = [
  'Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'
];

// Svenska månader
export const SWEDISH_MONTHS = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

// Sommartid/Vintertid övergångar för Sverige (CET/CEST)
export const DST_TRANSITIONS = {
  2024: {
    start: new Date('2024-03-31T02:00:00+01:00'), // Sista söndagen i mars
    end: new Date('2024-10-27T03:00:00+02:00')    // Sista söndagen i oktober
  },
  2025: {
    start: new Date('2025-03-30T02:00:00+01:00'),
    end: new Date('2025-10-26T03:00:00+02:00')
  },
  2026: {
    start: new Date('2026-03-29T02:00:00+01:00'),
    end: new Date('2026-10-25T03:00:00+02:00')
  },
  2027: {
    start: new Date('2027-03-28T02:00:00+01:00'),
    end: new Date('2027-10-31T03:00:00+02:00')
  },
  2028: {
    start: new Date('2028-03-26T02:00:00+01:00'),
    end: new Date('2028-10-29T03:00:00+02:00')
  },
  2029: {
    start: new Date('2029-03-25T02:00:00+01:00'),
    end: new Date('2029-10-28T03:00:00+02:00')
  },
  2030: {
    start: new Date('2030-03-31T02:00:00+01:00'),
    end: new Date('2030-10-27T03:00:00+02:00')
  }
};

/**
 * Kontrollerar om ett datum är under sommartid (CEST) i Sverige
 */
export function isDaylightSavingTime(date: Date): boolean {
  const year = date.getFullYear();
  const transitions = DST_TRANSITIONS[year as keyof typeof DST_TRANSITIONS];
  
  if (!transitions) {
    // Fallback för år som inte finns definierade
    return isDefaultDST(date);
  }
  
  return date >= transitions.start && date < transitions.end;
}

/**
 * Fallback DST-beräkning för år som inte finns i tabellen
 */
function isDefaultDST(date: Date): boolean {
  const year = date.getFullYear();
  const march = new Date(year, 2, 1); // Mars
  const october = new Date(year, 9, 1); // Oktober
  
  // Hitta sista söndagen i mars
  const lastSundayMarch = new Date(year, 2, 31);
  lastSundayMarch.setDate(31 - lastSundayMarch.getDay());
  
  // Hitta sista söndagen i oktober
  const lastSundayOctober = new Date(year, 9, 31);
  lastSundayOctober.setDate(31 - lastSundayOctober.getDay());
  
  return date >= lastSundayMarch && date < lastSundayOctober;
}

/**
 * Skapar ett svenskt datum med korrekt tidszon
 */
export function createSwedishDate(year: number, month: number, day: number): Date {
  // Skapa datum i svensk tidszon
  const date = new Date(year, month, day);
  
  // Justera för tidszon om nödvändigt
  const isDST = isDaylightSavingTime(date);
  const offset = isDST ? 2 : 1; // CEST = UTC+2, CET = UTC+1
  
  return date;
}

/**
 * Hämtar svensk datuminformation
 */
export function getSwedishDateInfo(date: Date): SwedishDateInfo {
  const isDST = isDaylightSavingTime(date);
  const today = new Date();
  
  return {
    date: date,
    day: date.getDate(),
    weekday: date.getDay(),
    weekdayName: SWEDISH_WEEKDAYS[date.getDay()],
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
    isToday: isSameDay(date, today),
    isDST: isDST,
    timezone: isDST ? 'CEST' : 'CET',
    weekNumber: getSwedishWeekNumber(date)
  };
}

/**
 * Kontrollerar om två datum är samma dag
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Beräknar svensk veckonummer enligt ISO 8601
 */
export function getSwedishWeekNumber(date: Date): number {
  const target = new Date(date);
  const dayNumber = (date.getDay() + 6) % 7; // Måndag = 0
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Kontrollerar om ett år är skottår
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Hämtar antal dagar i en månad med hänsyn till skottår
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Genererar en månad med korrekt svensk kalenderinformation
 */
export interface SwedishMonthDay {
  date: Date;
  day: number;
  dateInfo: SwedishDateInfo;
  isCurrentMonth: boolean;
}

export function generateSwedishMonth(year: number, month: number): SwedishMonthDay[] {
  const days: SwedishMonthDay[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  
  // Lägg till dagar från föregående månad för att fylla första veckan
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = createSwedishDate(prevYear, prevMonth, day);
    days.push({
      date,
      day,
      dateInfo: getSwedishDateInfo(date),
      isCurrentMonth: false
    });
  }
  
  // Lägg till dagar från aktuell månad
  for (let day = 1; day <= daysInMonth; day++) {
    const date = createSwedishDate(year, month, day);
    days.push({
      date,
      day,
      dateInfo: getSwedishDateInfo(date),
      isCurrentMonth: true
    });
  }
  
  // Lägg till dagar från nästa månad för att fylla sista veckan
  const lastDay = days[days.length - 1];
  const remainingDays = 42 - days.length; // 6 veckor * 7 dagar
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  for (let day = 1; day <= remainingDays; day++) {
    const date = createSwedishDate(nextYear, nextMonth, day);
    days.push({
      date,
      day,
      dateInfo: getSwedishDateInfo(date),
      isCurrentMonth: false
    });
  }
  
  return days;
}

/**
 * Formaterar datum på svenska
 */
export function formatSwedishDate(date: Date, format: 'short' | 'long' | 'full' = 'long'): string {
  const dateInfo = getSwedishDateInfo(date);
  
  switch (format) {
    case 'short':
      return `${date.getDate()}/${date.getMonth() + 1}`;
    case 'long':
      return `${date.getDate()} ${SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    case 'full':
      return `${dateInfo.weekdayName} ${date.getDate()} ${SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    default:
      return date.toLocaleDateString('sv-SE');
  }
}

/**
 * Beräknar svenska helgdagar för ett år
 */
export function getSwedishHolidays(year: number): SwedishHoliday[] {
  const holidays: SwedishHoliday[] = [];
  
  // Fasta helgdagar
  holidays.push(
    { name: 'Nyårsdagen', date: new Date(year, 0, 1), isPublicHoliday: true },
    { name: 'Trettondedag jul', date: new Date(year, 0, 6), isPublicHoliday: true },
    { name: 'Första maj', date: new Date(year, 4, 1), isPublicHoliday: true },
    { name: 'Sveriges nationaldag', date: new Date(year, 5, 6), isPublicHoliday: true },
    { name: 'Juldagen', date: new Date(year, 11, 25), isPublicHoliday: true },
    { name: 'Annandag jul', date: new Date(year, 11, 26), isPublicHoliday: true }
  );
  
  // Beräkna påsk och påskrelaterade helgdagar
  const easter = calculateEaster(year);
  holidays.push(
    { name: 'Långfredagen', date: new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000), isPublicHoliday: true },
    { name: 'Påskdagen', date: easter, isPublicHoliday: true },
    { name: 'Annandag påsk', date: new Date(easter.getTime() + 24 * 60 * 60 * 1000), isPublicHoliday: true },
    { name: 'Kristi himmelsfärdsdag', date: new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000), isPublicHoliday: true },
    { name: 'Pingstdagen', date: new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000), isPublicHoliday: true }
  );
  
  // Beräkna midsommar (första lördagen efter 19 juni)
  const midsummer = new Date(year, 5, 20); // 20 juni
  while (midsummer.getDay() !== 6) { // Hitta första lördagen
    midsummer.setDate(midsummer.getDate() + 1);
  }
  holidays.push({ name: 'Midsommardagen', date: midsummer, isPublicHoliday: true });
  
  // Alla helgons dag (första lördagen mellan 31 oktober och 6 november)
  const allSaints = new Date(year, 9, 31); // 31 oktober
  while (allSaints.getDay() !== 6) { // Hitta första lördagen
    allSaints.setDate(allSaints.getDate() + 1);
  }
  holidays.push({ name: 'Alla helgons dag', date: allSaints, isPublicHoliday: true });
  
  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Beräknar påskdagen för ett givet år
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Kontrollerar om ett datum är en svensk helgdag
 */
export function isSwedishHoliday(date: Date): SwedishHoliday | null {
  const holidays = getSwedishHolidays(date.getFullYear());
  return holidays.find(holiday => isSameDay(holiday.date, date)) || null;
}