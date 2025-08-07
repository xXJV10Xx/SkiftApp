import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// API Response handler
const handleResponse = (response) => response.data
const handleError = (error) => {
  console.error('API Error:', error)
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error)
  }
  throw new Error(error.message || 'Ett fel uppstod vid API-anrop')
}

// Health check
export const healthCheck = () => 
  api.get('/health').then(handleResponse).catch(handleError)

// Team shifts
export const getTeamShifts = (team, startDate, endDate) =>
  api.get(`/shifts/${team}`, {
    params: { startDate, endDate }
  }).then(handleResponse).catch(handleError)

// Day shifts (all teams for specific date)
export const getDayShifts = (date) =>
  api.get(`/shifts/date/${date}`).then(handleResponse).catch(handleError)

// Month schedule
export const getMonthSchedule = (year, month) =>
  api.get(`/shifts/month/${year}/${month}`).then(handleResponse).catch(handleError)

// Next shift for team
export const getNextShift = (team) =>
  api.get(`/next-shift/${team}`).then(handleResponse).catch(handleError)

// Current status for all teams
export const getCurrentStatus = () =>
  api.get('/current-status').then(handleResponse).catch(handleError)

// Team statistics
export const getTeamStatistics = (team, year, month) =>
  api.get(`/statistics/${team}`, {
    params: { year, month }
  }).then(handleResponse).catch(handleError)

// Export CSV
export const exportTeamCSV = (team, startDate, endDate) => {
  const params = new URLSearchParams({ startDate, endDate })
  return `${API_BASE_URL}/export/csv/${team}?${params.toString()}`
}

// Utility functions
export const formatDate = (date) => {
  if (typeof date === 'string') return date
  return date.toISOString().split('T')[0]
}

export const formatDateTime = (date, time) => {
  if (!time) return ''
  return `${formatDate(date)} ${time}`
}

export const getShiftColor = (shiftType) => {
  const colors = {
    F: '#ffd93d', // Yellow for morning
    E: '#ff6b6b', // Red for afternoon  
    N: '#4c51bf', // Blue for night
    L: '#e2e8f0'  // Gray for free
  }
  return colors[shiftType] || '#e2e8f0'
}

export const getShiftName = (shiftType) => {
  const names = {
    F: 'Förmiddag',
    E: 'Eftermiddag',
    N: 'Natt',
    L: 'Ledig'
  }
  return names[shiftType] || 'Okänd'
}

export const getTeamColor = (teamId) => {
  const colors = {
    31: '#FF6B6B',
    32: '#4ECDC4', 
    33: '#45B7D1',
    34: '#96CEB4',
    35: '#FFEAA7'
  }
  return colors[teamId] || '#e2e8f0'
}

// Date utilities
export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const startOfMonth = (date) => {
  const result = new Date(date)
  result.setDate(1)
  return result
}

export const endOfMonth = (date) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + 1, 0)
  return result
}

export const formatSwedishDate = (date) => {
  const months = [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december'
  ]
  const days = [
    'söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'
  ]
  
  const d = new Date(date)
  const dayName = days[d.getDay()]
  const day = d.getDate()
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  
  return `${dayName} ${day} ${month} ${year}`
}

export default api