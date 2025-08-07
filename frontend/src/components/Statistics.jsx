import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar, Users, AlertCircle, PieChart } from 'lucide-react'
import { 
  getTeamStatistics, 
  getMonthSchedule,
  formatSwedishDate,
  getShiftColor,
  getShiftName 
} from '../services/api'

const Statistics = ({ selectedTeam, teams, currentDate }) => {
  const [statistics, setStatistics] = useState(null)
  const [monthData, setMonthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)

  useEffect(() => {
    loadStatistics()
  }, [selectedTeam, selectedYear, selectedMonth])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, monthScheduleData] = await Promise.all([
        getTeamStatistics(selectedTeam, selectedYear, selectedMonth),
        getMonthSchedule(selectedYear, selectedMonth)
      ])

      setStatistics(statsData)
      setMonthData(monthScheduleData)
    } catch (err) {
      setError(err.message)
      console.error('Statistics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getComparisonData = () => {
    if (!monthData?.statistics?.teams) return null
    
    return Object.entries(monthData.statistics.teams).map(([teamKey, data]) => ({
      team: parseInt(teamKey.replace('team_', '')),
      ...data
    }))
  }

  const calculateEfficiency = (workDays, totalDays) => {
    return Math.round((workDays / totalDays) * 100)
  }

  const getShiftDistributionData = (shiftDistribution) => {
    return [
      { type: 'F', name: 'Förmiddag', count: shiftDistribution.F, color: getShiftColor('F') },
      { type: 'E', name: 'Eftermiddag', count: shiftDistribution.E, color: getShiftColor('E') },
      { type: 'N', name: 'Natt', count: shiftDistribution.N, color: getShiftColor('N') }
    ]
  }

  const selectedTeamData = teams.find(t => t.id === selectedTeam)
  const comparisonData = getComparisonData()

  if (loading) {
    return (
      <div className="loading">
        <BarChart3 className="animate-spin" size={32} />
        <p>Laddar statistik...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <AlertCircle size={32} />
        <p>Fel vid laddning av statistik: {error}</p>
        <button onClick={loadStatistics} className="team-button" style={{marginTop: '1rem'}}>
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <BarChart3 size={24} />
              Statistik - {selectedTeamData?.name}
            </h2>
            <p className="text-sm text-gray-600">
              Detaljerad analys av arbetstider och scheman
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select-input"
            >
              {Array.from({length: 18}, (_, i) => 2023 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select-input"
            >
              {Array.from({length: 12}, (_, i) => {
                const month = i + 1
                const monthName = new Date(selectedYear, i).toLocaleDateString('sv-SE', { month: 'long' })
                return <option key={month} value={month}>{monthName}</option>
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      {statistics?.statistics && (
        <div className="grid grid-2">
          {/* Work Overview */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={20} />
                Arbetsöversikt
              </h3>
            </div>
            
            <div className="card-content">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {statistics.statistics.work_days}
                  </div>
                  <div className="text-sm text-gray-600">Arbetsdagar</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {statistics.statistics.work_hours}h
                  </div>
                  <div className="text-sm text-gray-600">Arbetstimmar</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {statistics.statistics.free_days}
                  </div>
                  <div className="text-sm text-gray-600">Lediga dagar</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {calculateEfficiency(statistics.statistics.work_days, statistics.statistics.total_days)}%
                  </div>
                  <div className="text-sm text-gray-600">Arbetsgrad</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-2">Period:</div>
                <div className="font-semibold">{statistics.period}</div>
                <div className="text-sm text-gray-600">
                  {statistics.statistics.total_days} totala dagar
                </div>
              </div>
            </div>
          </div>

          {/* Shift Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <PieChart size={20} />
                Skiftfördelning
              </h3>
            </div>
            
            <div className="card-content">
              <div className="space-y-3">
                {getShiftDistributionData(statistics.statistics.shift_distribution).map(shift => {
                  const percentage = Math.round((shift.count / statistics.statistics.work_days) * 100) || 0
                  
                  return (
                    <div key={shift.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: shift.color,
                            color: shift.type === 'N' ? 'white' : 'black'
                          }}
                        >
                          {shift.type}
                        </div>
                        <div>
                          <div className="font-semibold">{shift.name}</div>
                          <div className="text-sm text-gray-600">{shift.count} skift</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">{percentage}%</div>
                        <div className="text-sm text-gray-600">{shift.count * 8}h</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Totalt: {statistics.statistics.work_days} arbetsskift
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Shifts Preview */}
      {statistics?.statistics?.upcoming_shifts && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={20} />
              Kommande vecka
            </h3>
          </div>
          
          <div className="card-content">
            <div className="grid grid-cols-7 gap-2">
              {statistics.statistics.upcoming_shifts.slice(0, 7).map((shift, index) => {
                const date = new Date(shift.date)
                const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' })
                const isToday = date.toDateString() === new Date().toDateString()
                
                return (
                  <div 
                    key={shift.date}
                    className={`p-3 rounded-lg text-center border-2 ${
                      isToday ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    style={{
                      backgroundColor: shift.type !== 'L' ? getShiftColor(shift.type) : '#f7fafc'
                    }}
                  >
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      {dayName}
                    </div>
                    <div className="text-lg font-bold mb-1">
                      {date.getDate()}
                    </div>
                    <div 
                      className="text-sm font-bold"
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
                        {shift.start_time}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Team Comparison */}
      {comparisonData && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={20} />
              Lagöversikt - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          
          <div className="card-content">
            <div className="space-y-4">
              {comparisonData.map(teamData => {
                const teamInfo = teams.find(t => t.id === teamData.team)
                const isSelected = teamData.team === selectedTeam
                const efficiency = calculateEfficiency(teamData.work_days, teamData.total_days)
                
                return (
                  <div 
                    key={teamData.team}
                    className={`p-4 rounded-lg border-2 ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: teamInfo?.color }}
                        ></div>
                        <div className="font-semibold">Lag {teamData.team}</div>
                        {isSelected && (
                          <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Valt lag
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold">{efficiency}%</div>
                        <div className="text-xs text-gray-600">arbetsgrad</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{teamData.work_days}</div>
                        <div className="text-gray-600">Arbete</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{teamData.work_hours}h</div>
                        <div className="text-gray-600">Timmar</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">{teamData.free_days}</div>
                        <div className="text-gray-600">Ledigt</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">{teamData.total_days}</div>
                        <div className="text-gray-600">Totalt</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-center gap-1">
                      {['F', 'E', 'N'].map(type => (
                        <div 
                          key={type}
                          className="text-xs px-2 py-1 rounded font-semibold"
                          style={{
                            backgroundColor: getShiftColor(type),
                            color: type === 'N' ? 'white' : 'black'
                          }}
                        >
                          {teamData.shift_distribution[type]}{type}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Validation Status */}
      {monthData?.validation && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertCircle size={20} />
              Schemavalidering
            </h3>
          </div>
          
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    monthData.validation.isValid ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="font-semibold">
                  {monthData.validation.isValid ? 'Schema giltigt' : 'Schema fel'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {monthData.validation.errors.length} fel hittade
              </div>
            </div>
            
            {monthData.validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="font-semibold text-red-800 mb-2">Fel i schemat:</div>
                <div className="text-sm text-red-700 space-y-1">
                  {monthData.validation.errors.slice(0, 5).map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                  {monthData.validation.errors.length > 5 && (
                    <div className="text-red-600">
                      ... och {monthData.validation.errors.length - 5} fler fel
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-600 mt-2">
              Totalt {monthData.validation.totalDays} dagar validerade
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics