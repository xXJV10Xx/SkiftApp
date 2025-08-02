// Färger för olika skift
const shiftColors = {
  'M': '#FF6B6B', // Morgon = röd
  'A': '#4ECDC4', // Kväll = turkos
  'N': '#45B7D1', // Natt = blå
  'F': '#96CEB4', // Förmiddag = grön
  'E': '#FFA502', // Eftermiddag = orange
  'D': '#9B59B6'  // Dag = lila
};

// Färger för olika lag
const teamColors = {
  31: '#FF6B6B', // Lag 31 = röd
  32: '#4ECDC4', // Lag 32 = turkos
  33: '#45B7D1', // Lag 33 = blå
  34: '#96CEB4', // Lag 34 = grön
  35: '#FFA502'  // Lag 35 = orange
};

export const getColorForShift = (shiftCode) => {
  return shiftColors[shiftCode] || '#95A5A6';
};

export const getColorForTeam = (teamNumber) => {
  return teamColors[teamNumber] || '#95A5A6';
};

export default { getColorForShift, getColorForTeam };