/**
 * Färghantering för skiftlag
 * Hanterar färgkodning av olika skiftlag för bättre visuell identifiering
 */

// Fördefinierade färger för vanliga lagnamn
const TEAM_COLORS = {
  // Vanliga svenska lagnamn
  'A-lag': '#FF6B6B',      // Röd
  'B-lag': '#4ECDC4',      // Turkos  
  'C-lag': '#45B7D1',      // Blå
  'D-lag': '#96CEB4',      // Grön
  'E-lag': '#FFEAA7',      // Gul
  'F-lag': '#DDA0DD',      // Lila
  'G-lag': '#FFB347',      // Orange
  'H-lag': '#87CEEB',      // Ljusblå
  
  // Skifttyper
  'Dagskift': '#4CAF50',   // Grön
  'Kvällsskift': '#FF9800', // Orange
  'Nattskift': '#3F51B5',  // Mörkblå
  'Helgskift': '#9C27B0',  // Lila
  
  // Specialskift
  'Beredskapsskift': '#F44336', // Röd
  'Övertid': '#795548',         // Brun
  'Semester': '#E0E0E0',        // Grå
  'Sjuk': '#FFCDD2',           // Ljusröd
  'Ledig': '#F5F5F5',          // Ljusgrå
};

// Reservfärger för okända lag
const FALLBACK_COLORS = [
  '#FF5722', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
];

// Cache för genererade färger
const colorCache = new Map();

/**
 * Hämta färg för ett skiftlag
 * @param {string} teamName - Namn på skiftlaget
 * @param {string} teamColor - Eventuell fördefinierad färg från databasen
 * @returns {string} Hex-färgkod
 */
export const getTeamColor = (teamName, teamColor = null) => {
  // Använd fördefinierad färg från databasen om den finns
  if (teamColor && isValidHexColor(teamColor)) {
    return teamColor;
  }
  
  // Kontrollera cache
  if (colorCache.has(teamName)) {
    return colorCache.get(teamName);
  }
  
  // Kontrollera fördefinierade färger
  const normalizedName = teamName.toLowerCase().trim();
  
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (normalizedName.includes(key.toLowerCase())) {
      colorCache.set(teamName, color);
      return color;
    }
  }
  
  // Generera färg baserat på lagnamn
  const generatedColor = generateColorFromString(teamName);
  colorCache.set(teamName, generatedColor);
  
  return generatedColor;
};

/**
 * Generera konsistent färg från sträng
 * @param {string} str - Sträng att generera färg från
 * @returns {string} Hex-färgkod
 */
const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
};

/**
 * Kontrollera om en sträng är en giltig hex-färg
 * @param {string} color - Färgkod att kontrollera
 * @returns {boolean} True om giltig hex-färg
 */
const isValidHexColor = (color) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Konvertera hex-färg till RGB
 * @param {string} hex - Hex-färgkod
 * @returns {object} RGB-värden {r, g, b}
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Beräkna om en färg är ljus eller mörk
 * @param {string} hex - Hex-färgkod
 * @returns {boolean} True om färgen är ljus
 */
export const isLightColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  // Använd luminans-formeln
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
};

/**
 * Hämta lämplig textfärg (svart eller vit) för en bakgrundsfärg
 * @param {string} backgroundColor - Bakgrundsfärg i hex
 * @returns {string} Textfärg (#000000 eller #FFFFFF)
 */
export const getContrastTextColor = (backgroundColor) => {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
};

/**
 * Skapa färgpalett för alla lag
 * @param {Array} teams - Array av lag-objekt
 * @returns {Map} Map med lag-id som nyckel och färg som värde
 */
export const createTeamColorPalette = (teams) => {
  const palette = new Map();
  
  teams.forEach(team => {
    const color = getTeamColor(team.name, team.color);
    palette.set(team.id, color);
  });
  
  return palette;
};

/**
 * Exportera alla fördefinierade färger för inställningar
 * @returns {object} Objekt med alla fördefinierade färger
 */
export const getAllPredefinedColors = () => {
  return { ...TEAM_COLORS };
};

/**
 * Uppdatera färg för ett lag i cache
 * @param {string} teamName - Lagnamn
 * @param {string} color - Ny färg
 */
export const updateTeamColor = (teamName, color) => {
  if (isValidHexColor(color)) {
    colorCache.set(teamName, color);
  }
};

/**
 * Rensa färg-cache
 */
export const clearColorCache = () => {
  colorCache.clear();
};

/**
 * Hämta färgstatistik
 * @returns {object} Statistik om färganvändning
 */
export const getColorStats = () => {
  return {
    cachedColors: colorCache.size,
    predefinedColors: Object.keys(TEAM_COLORS).length,
    fallbackColors: FALLBACK_COLORS.length
  };
};

export default {
  getTeamColor,
  hexToRgb,
  isLightColor,
  getContrastTextColor,
  createTeamColorPalette,
  getAllPredefinedColors,
  updateTeamColor,
  clearColorCache,
  getColorStats
};