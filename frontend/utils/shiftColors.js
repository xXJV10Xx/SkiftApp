export const getColorForTeam = (team) => {
  const colors = {
    31: '#FF5733',
    32: '#33C1FF',
    33: '#33FF57',
    34: '#FF33D1',
    35: '#FFC733',
  };
  return colors[team] || '#CCCCCC';
};