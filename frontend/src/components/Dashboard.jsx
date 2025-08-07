import React, { useState, useEffect } from 'react'
import { Clock, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, Building2, MapPin, HelpCircle } from 'lucide-react'
import universalApi from '../services/universalApi'
import aiService from '../services/aiService'

const Dashboard = ({ selectedCompany, selectedTeam, teams, currentDate }) => {
  const [companyData, setCompanyData] = useState(null)
  const [todayShift, setTodayShift] = useState(null)
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [systemHealth, setSystemHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showHelpTooltip, setShowHelpTooltip] = useState(false)

  useEffect(() => {
    loadDashboardData()
    
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [selectedCompany, selectedTeam, currentDate])

  const loadDashboardData = async () => {
    if (!selectedCompany || !selectedTeam) return;
    
    try {
      setLoading(true)
      setError(null)

      const today = universalApi.formatDate(new Date())
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      const [companyResponse, todayShiftResponse, monthlyStatsResponse, healthResponse] = await Promise.all([
        universalApi.getCompany(selectedCompany),
        universalApi.getShiftForDate(selectedCompany, selectedTeam, today),
        universalApi.generateMonthlyCalendar(selectedCompany, selectedTeam, year, month),
        universalApi.getSystemHealth()
      ])

      setCompanyData(companyResponse.company)
      setTodayShift(todayShiftResponse.shift)
      setMonthlyStats(monthlyStatsResponse.calendar?.statistics)
      setSystemHealth(healthResponse)
    } catch (err) {
      setError(err.message)
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickHelp = async () => {
    try {
      // Update AI context with current dashboard state
      aiService.updateContext({
        currentPage: 'dashboard',
        selectedCompany,
        selectedTeam,
        hasData: !!companyData,
        todayShift: todayShift?.shift?.shiftType,
        monthlyStats: !!monthlyStats
      });
      
      // This will trigger the AI chat to open with dashboard context
      setShowHelpTooltip(true);
      setTimeout(() => setShowHelpTooltip(false), 3000);
    } catch (error) {
      console.error('Quick help error:', error);
    }
  };

  const getCurrentShiftPeriod = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 14) return { type: 'F', name: 'Förmiddag', time: '06:00-14:00' }
    if (hour >= 14 && hour < 22) return { type: 'E', name: 'Eftermiddag', time: '14:00-22:00' }
    return { type: 'N', name: 'Natt', time: '22:00-06:00' }
  }

  const getShiftStyle = (shiftType) => {
    const colors = {
      'F': '#10b981', // Green
      'E': '#f59e0b', // Orange  
      'N': '#3b82f6', // Blue
      'D': '#06b6d4', // Cyan
      'K': '#8b5cf6', // Purple
      'L': '#6b7280'  // Gray
    }
    return {
      backgroundColor: colors[shiftType] || colors.L,
      color: 'white'
    }
  }

  const formatSwedishDate = (date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ett fel uppstod</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  const currentShiftPeriod = getCurrentShiftPeriod()
  const isWorking = todayShift?.shift?.isWorkingDay
  const currentShiftMatchesToday = todayShift?.shift?.shiftType === currentShiftPeriod.type

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                {formatSwedishDate(currentTime)}
              </p>
            </div>
            <div className="relative">
              <button
                onClick={handleQuickHelp}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Få hjälp med dashboard"
              >
                <HelpCircle size={20} />
              </button>
              {showHelpTooltip && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-blue-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-blue-600 rotate-45"></div>
                  Klicka på AI-hjälp-knappen för dashboard-hjälp! 🤖
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {currentTime.toLocaleTimeString('sv-SE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-sm text-gray-500">
              Aktuell tid
            </div>
          </div>
        </div>
      </div>

      {/* Company and Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start">
            <Building2 className="h-8 w-8 text-blue-600 mr-3 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {companyData?.name || 'Okänt företag'}
              </h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin size={14} className="mr-1" />
                  {companyData?.location} • {companyData?.industry}
                </div>
                <div className="flex items-center">
                  <Users size={14} className="mr-1" />
                  Lag: {selectedTeam}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start">
            <Clock className="h-8 w-8 text-green-600 mr-3 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Aktuell Skiftperiod
              </h2>
              <div className="mt-2">
                <div 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={getShiftStyle(currentShiftPeriod.type)}
                >
                  {currentShiftPeriod.name} ({currentShiftPeriod.time})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Shift Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Dagens Skiftstatus
        </h2>
        
        {todayShift ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isWorking ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              ) : (
                <Clock className="h-6 w-6 text-gray-400 mr-3" />
              )}
              <div>
                <div className="text-lg font-medium">
                  {isWorking ? 'Arbetar idag' : 'Ledig idag'}
                </div>
                {isWorking && (
                  <div className="text-sm text-gray-600">
                    Skift: {todayShift.shift.shiftName} ({todayShift.shift.shiftTime || 'Tid ej angiven'})
                  </div>
                )}
              </div>
            </div>
            
            <div 
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={getShiftStyle(todayShift.shift.shiftType)}
            >
              {todayShift.shift.shiftType}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            Ingen skiftinformation tillgänglig för idag
          </div>
        )}

        {/* Current vs Scheduled */}
        {todayShift && isWorking && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status just nu:</span>
              <span className={`text-sm font-medium ${
                currentShiftMatchesToday ? 'text-green-600' : 'text-orange-600'
              }`}>
                {currentShiftMatchesToday ? (
                  <>
                    <CheckCircle size={16} className="inline mr-1" />
                    Rätt skiftperiod
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="inline mr-1" />
                    Schemalagt: {todayShift.shift.shiftName}
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Statistics */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {monthlyStats.workingDays}
                </div>
                <div className="text-sm text-gray-600">Arbetsdagar</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {monthlyStats.totalHours}h
                </div>
                <div className="text-sm text-gray-600">Totala timmar</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {monthlyStats.restDays}
                </div>
                <div className="text-sm text-gray-600">Vilodagar</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {monthlyStats.averageHoursPerWeek || Math.round(monthlyStats.totalHours / 4)}h
                </div>
                <div className="text-sm text-gray-600">Tim/vecka</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Breakdown */}
      {monthlyStats?.shiftBreakdown && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Skiftfördelning denna månad
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(monthlyStats.shiftBreakdown).map(([shiftType, count]) => (
              <div key={shiftType} className="text-center">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto mb-2"
                  style={getShiftStyle(shiftType)}
                >
                  {shiftType}
                </div>
                <div className="text-sm font-medium text-gray-900">{count} dagar</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Systemstatus
              </h2>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-600 font-medium">
                  {systemHealth.status === 'healthy' ? 'Alla system fungerar' : systemHealth.status}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Företag: {systemHealth.statistics?.companiesLoaded || 'N/A'}</div>
              <div>Service: {systemHealth.service}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard