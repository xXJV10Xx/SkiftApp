import React, { useState, useEffect } from 'react'
import { Users, Calendar, Clock, Download, AlertCircle } from 'lucide-react'
import { 
  getTeamShifts, 
  exportTeamCSV,
  formatSwedishDate,
  getShiftColor,
  getShiftName,
  formatDate,
  addDays
} from '../services/api'

const TeamView = ({ selectedTeam, teams, currentDate }) => {
  const [teamShifts, setTeamShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewPeriod, setViewPeriod] = useState(30) // days

  useEffect(() => {
    loadTeamShifts()
  }, [selectedTeam, currentDate, viewPeriod])

  const loadTeamShifts = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = formatDate(currentDate)
      const endDate = formatDate(addDays(currentDate, viewPeriod))

      const data = await getTeamShifts(selectedTeam, startDate, endDate)
      setTeamShifts(data.shifts || [])
    } catch (err) {
      setError(err.message)
      console.error('TeamView error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const startDate = formatDate(currentDate)
      const endDate = formatDate(addDays(currentDate, viewPeriod))
      
      const url = exportTeamCSV(selectedTeam, startDate, endDate)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const groupShiftsByWeek = (shifts) => {
    const weeks = {}
    
    shifts.forEach(shift => {
      const date = new Date(shift.date)
      const weekStart = new Date(date)
      // Get Monday of the week
      weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = []
      }
      weeks[weekKey].push(shift)
    })
    
    return weeks
  }

  const getWorkBlockInfo = (shifts) => {
    const workShifts = shifts.filter(s => s.type !== 'L')
    const workDays = workShifts.length
    const totalHours = workDays * 8
    
    const shiftCounts = workShifts.reduce((acc, shift) => {
      acc[shift.type] = (acc[shift.type] || 0) + 1
      return acc
    }, {})
    
    return {
      workDays,
      totalHours,
      shiftCounts,
      pattern: workShifts.length > 0 ? workShifts[0].pattern_name : ''
    }
  }

  const selectedTeamData = teams.find(t => t.id === selectedTeam)

  if (loading) {
    return (
      <div className="loading">
        <Users className="animate-spin" size={32} />
        <p>Laddar lagschema...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <AlertCircle size={32} />
        <p>Fel vid laddning av lagschema: {error}</p>
        <button onClick={loadTeamShifts} className="team-button" style={{marginTop: '1rem'}}>
          Försök igen
        </button>
      </div>
    )
  }

  const weeks = groupShiftsByWeek(teamShifts)
  const workBlockInfo = getWorkBlockInfo(teamShifts)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Users size={24} />
              {selectedTeamData?.name} - Detaljschema
            </h2>
            <p className="text-sm text-gray-600">
              {formatSwedishDate(currentDate)} - {formatSwedishDate(addDays(currentDate, viewPeriod))}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={viewPeriod} 
              onChange={(e) => setViewPeriod(parseInt(e.target.value))}
              className="select-input"
            >
              <option value={7}>7 dagar</option>
              <option value={14}>14 dagar</option>
              <option value={30}>30 dagar</option>
              <option value={60}>60 dagar</option>
            </select>
            
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
              Exportera
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {workBlockInfo.workDays}
            </div>
            <div className="text-sm text-gray-600">Arbetsdagar</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {workBlockInfo.totalHours}h
            </div>
            <div className="text-sm text-gray-600">Arbetstimmar</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {teamShifts.filter(s => s.type === 'L').length}
            </div>
            <div className="text-sm text-gray-600">Lediga dagar</div>
          </div>
        </div>

        {/* Shift Distribution */}
        <div className="grid grid-3">
          {Object.entries(workBlockInfo.shiftCounts).map(([type, count]) => (
            <div key={type} className="flex items-center justify-center gap-2">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: getShiftColor(type),
                  color: type === 'N' ? 'white' : 'black'
                }}
              >
                {type}
              </div>
              <span className="font-semibold">{count} {getShiftName(type).toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {Object.entries(weeks)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([weekStart, weekShifts]) => {
            const weekStartDate = new Date(weekStart)
            const weekEndDate = addDays(weekStartDate, 6)
            const weekWorkInfo = getWorkBlockInfo(weekShifts)
            
            return (
              <div key={weekStart} className="card">
                <div className="card-header">
                  <div>
                    <h3 className="font-semibold">
                      Vecka {formatSwedishDate(weekStartDate).split(' ')[1]} - {formatSwedishDate(weekEndDate).split(' ')[1]} {weekStartDate.toLocaleDateString('sv-SE', { month: 'long' })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {weekWorkInfo.workDays} arbetsdagar • {weekWorkInfo.totalHours}h • {weekWorkInfo.pattern}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    {Object.entries(weekWorkInfo.shiftCounts).map(([type, count]) => (
                      <div 
                        key={type}
                        className="text-xs px-2 py-1 rounded font-semibold"
                        style={{
                          backgroundColor: getShiftColor(type),
                          color: type === 'N' ? 'white' : 'black'
                        }}
                      >
                        {count}{type}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="grid grid-cols-7 gap-2">
                    {weekShifts
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(shift => {
                        const date = new Date(shift.date)
                        const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' })
                        const isToday = date.toDateString() === new Date().toDateString()
                        
                        return (
                          <div 
                            key={shift.date}
                            className={`p-3 rounded-lg border-2 ${isToday ? 'border-blue-500' : 'border-gray-200'}`}
                            style={{
                              backgroundColor: shift.type !== 'L' ? getShiftColor(shift.type) : '#f7fafc'
                            }}
                          >
                            <div className="text-center">
                              <div className="text-xs font-semibold text-gray-600 uppercase">
                                {dayName}
                              </div>
                              <div className="text-lg font-bold">
                                {date.getDate()}
                              </div>
                              <div 
                                className="text-sm font-bold mt-1"
                                style={{
                                  color: shift.type === 'N' ? 'white' : 'black'
                                }}
                              >
                                {shift.type}
                              </div>
                              {shift.type !== 'L' && (
                                <div 
                                  className="text-xs mt-1"
                                  style={{
                                    color: shift.type === 'N' ? 'white' : 'black'
                                  }}
                                >
                                  {shift.start_time}-{shift.end_time}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Upcoming Shifts List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Calendar size={20} />
            Kommande skift
          </h3>
        </div>
        
        <div className="card-content">
          <div className="space-y-2">
            {teamShifts
              .filter(shift => {
                const shiftDate = new Date(shift.date)
                return shiftDate >= new Date() && shift.type !== 'L'
              })
              .slice(0, 10)
              .map((shift, index) => {
                const date = new Date(shift.date)
                const isNext = index === 0
                
                return (
                  <div 
                    key={shift.date}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isNext ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: getShiftColor(shift.type),
                          color: shift.type === 'N' ? 'white' : 'black'
                        }}
                      >
                        {shift.type}
                      </div>
                      
                      <div>
                        <div className="font-semibold">
                          {formatSwedishDate(date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getShiftName(shift.type)} • {shift.start_time} - {shift.end_time}
                        </div>
                      </div>
                    </div>
                    
                    {isNext && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">
                          Nästa skift
                        </div>
                        <div className="text-xs text-gray-600">
                          <Clock size={12} className="inline mr-1" />
                          8 timmar
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamView