import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react'
import { 
  getMonthSchedule, 
  exportTeamCSV,
  formatSwedishDate,
  getShiftColor,
  getShiftName,
  addDays,
  startOfMonth,
  endOfMonth
} from '../services/api'

const Calendar = ({ selectedTeam, teams, currentDate, setCurrentDate }) => {
  const [monthData, setMonthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    loadMonthData()
  }, [currentDate])

  const loadMonthData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const data = await getMonthSchedule(year, month)
      setMonthData(data)
    } catch (err) {
      setError(err.message)
      console.error('Calendar error:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
    setSelectedDate(null)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    
    // Start from Monday of the week containing the first day
    startDate.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7))
    
    const days = []
    const current = new Date(startDate)
    
    // Generate 6 weeks (42 days) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getShiftForDate = (date, team) => {
    if (!monthData?.shifts) return null
    
    const dateStr = date.toISOString().split('T')[0]
    return monthData.shifts.find(s => s.date === dateStr && s.team === team)
  }

  const getDayShifts = (date) => {
    if (!monthData?.shifts) return []
    
    const dateStr = date.toISOString().split('T')[0]
    return monthData.shifts.filter(s => s.date === dateStr)
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const handleExportCSV = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      
      const url = exportTeamCSV(selectedTeam, startDate, endDate)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const selectedTeamData = teams.find(t => t.id === selectedTeam)
  const days = getDaysInMonth()
  const monthName = currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="loading">
        <p>Laddar kalender...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <AlertCircle size={32} />
        <p>Fel vid laddning av kalender: {error}</p>
        <button onClick={loadMonthData} className="team-button" style={{marginTop: '1rem'}}>
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateMonth(-1)}
              className="nav-button"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h2 className="card-title text-2xl capitalize">
              {monthName}
            </h2>
            
            <button 
              onClick={() => navigateMonth(1)}
              className="nav-button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedTeamData?.name}
            </span>
            <button 
              onClick={handleExportCSV}
              className="team-button"
              style={{ 
                backgroundColor: selectedTeamData?.color,
                borderColor: selectedTeamData?.color,
                color: 'white'
              }}
            >
              <Download size={16} />
              Exportera CSV
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Weekday headers */}
          <div className="calendar-header">
            {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-body">
            {days.map((date, index) => {
              const shift = getShiftForDate(date, selectedTeam)
              const dayShifts = getDayShifts(date)
              const workingTeams = dayShifts.filter(s => s.type !== 'L')
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${!isCurrentMonth(date) ? 'other-month' : ''} ${
                    isToday(date) ? 'today' : ''
                  } ${selectedDate?.toDateString() === date.toDateString() ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="day-number">
                    {date.getDate()}
                  </div>
                  
                  {shift && (
                    <div 
                      className="shift-indicator"
                      style={{
                        backgroundColor: getShiftColor(shift.type),
                        color: shift.type === 'N' ? 'white' : 'black'
                      }}
                    >
                      {shift.type}
                    </div>
                  )}
                  
                  {isCurrentMonth(date) && (
                    <div className="working-teams">
                      {workingTeams.length}/3
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {formatSwedishDate(selectedDate)}
            </h3>
          </div>
          
          <div className="card-content">
            <div className="grid grid-2">
              {/* Selected team's shift */}
              <div>
                <h4 className="font-semibold mb-2">{selectedTeamData?.name}</h4>
                {(() => {
                  const shift = getShiftForDate(selectedDate, selectedTeam)
                  if (!shift) return <p className="text-gray-500">Ingen data</p>
                  
                  return (
                    <div className="space-y-2">
                      <div 
                        className="inline-block px-3 py-1 rounded font-semibold"
                        style={{
                          backgroundColor: getShiftColor(shift.type),
                          color: shift.type === 'N' ? 'white' : 'black'
                        }}
                      >
                        {shift.type} - {getShiftName(shift.type)}
                      </div>
                      
                      {shift.type !== 'L' && (
                        <div className="text-sm text-gray-600">
                          {shift.start_time} - {shift.end_time}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        Mönster: {shift.pattern_name}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* All teams for this date */}
              <div>
                <h4 className="font-semibold mb-2">Alla lag</h4>
                <div className="space-y-1">
                  {getDayShifts(selectedDate).map(shift => (
                    <div key={shift.team} className="flex items-center justify-between">
                      <span className="text-sm">Lag {shift.team}</span>
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: getShiftColor(shift.type),
                            color: shift.type === 'N' ? 'white' : 'black'
                          }}
                        >
                          {shift.type}
                        </span>
                        {shift.type !== 'L' && (
                          <span className="text-xs text-gray-600">
                            {shift.start_time}-{shift.end_time}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Förklaring</h3>
        </div>
        
        <div className="card-content">
          <div className="grid grid-2">
            <div>
              <h4 className="font-semibold mb-2">Skifttyper</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'F', name: 'Förmiddag', time: '06:00-14:00' },
                  { type: 'E', name: 'Eftermiddag', time: '14:00-22:00' },
                  { type: 'N', name: 'Natt', time: '22:00-06:00' },
                  { type: 'L', name: 'Ledig', time: '' }
                ].map(({ type, name, time }) => (
                  <div key={type} className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: getShiftColor(type),
                        color: type === 'N' ? 'white' : 'black'
                      }}
                    >
                      {type}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{name}</div>
                      {time && <div className="text-gray-500">{time}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Validering</h4>
              {monthData?.validation && (
                <div className="space-y-1">
                  <div className={`text-sm ${monthData.validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {monthData.validation.isValid ? 'Giltigt schema' : 'Schema fel'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Fel: {monthData.validation.errors.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Dagar: {monthData.validation.totalDays}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar