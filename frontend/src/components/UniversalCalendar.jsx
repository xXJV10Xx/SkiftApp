import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Download,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import universalApi from '../services/universalApi';

const UniversalCalendar = ({ 
  companyId, 
  teamId, 
  onDateSelect 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month'); // 'month' or 'year'

  // Load calendar data when company, team, or date changes
  useEffect(() => {
    if (companyId && teamId) {
      loadCalendarData();
    }
  }, [companyId, teamId, currentDate, view]);

  const loadCalendarData = async () => {
    if (!companyId || !teamId) return;

    try {
      setLoading(true);
      setError(null);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      let data;
      if (view === 'month') {
        const response = await universalApi.generateMonthlyCalendar(companyId, teamId, year, month);
        data = response.calendar;
      } else {
        const response = await universalApi.generateYearlyCalendar(companyId, teamId, year);
        data = response.calendar;
      }

      setCalendarData(data);
    } catch (err) {
      console.error('Error loading calendar:', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleExport = async (format) => {
    if (!companyId || !teamId) return;

    try {
      const { startDate, endDate } = universalApi.getCurrentMonthRange();
      const data = await universalApi.exportSchedule(companyId, teamId, startDate, endDate, format);
      
      const filename = `${companyId}_${teamId}_${startDate}_${endDate}.${format}`;
      universalApi.downloadExport(data, filename, format);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export calendar data.');
    }
  };

  const getShiftStyle = (shift) => {
    if (!shift || !shift.isWorkingDay) {
      return {
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        border: '1px solid #e5e7eb'
      };
    }

    // Get shift color based on type
    const shiftColors = {
      'F': '#10b981', // Green for morning
      'E': '#f59e0b', // Orange for afternoon
      'N': '#3b82f6', // Blue for night
      'D': '#06b6d4', // Cyan for day
      'K': '#8b5cf6', // Purple for evening
      'default': '#6b7280'
    };

    const color = shiftColors[shift.type] || shiftColors.default;
    
    return {
      backgroundColor: color,
      color: 'white',
      border: `1px solid ${color}`
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Laddar kalender...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ett fel uppstod</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCalendarData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center text-gray-500">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>Välj ett företag och lag för att visa kalendern</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {calendarData.company?.name} - Lag {calendarData.team?.id}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {view === 'month' ? `${calendarData.monthName} ${calendarData.year}` : `År ${calendarData.year}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm rounded ${
                  view === 'month' ? 'bg-white shadow-sm' : ''
                }`}
              >
                Månad
              </button>
              <button
                onClick={() => setView('year')}
                className={`px-3 py-1 text-sm rounded ${
                  view === 'year' ? 'bg-white shadow-sm' : ''
                }`}
              >
                År
              </button>
            </div>
            
            {/* Export */}
            <div className="relative group">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                <Download size={20} />
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button 
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  JSON
                </button>
                <button 
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Idag
          </button>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Statistics */}
      {calendarData.statistics && (
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {calendarData.statistics.workingDays}
              </div>
              <div className="text-sm text-gray-600">Arbetsdagar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {calendarData.statistics.totalHours}h
              </div>
              <div className="text-sm text-gray-600">Totala timmar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calendarData.statistics.restDays}
              </div>
              <div className="text-sm text-gray-600">Vilodagar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {calendarData.statistics.averageHoursPerWeek || 'N/A'}h
              </div>
              <div className="text-sm text-gray-600">Tim/vecka</div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {view === 'month' && calendarData.weeks && (
        <div className="p-6">
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="space-y-1">
            {calendarData.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`p-2 min-h-[80px] border rounded cursor-pointer hover:shadow-sm ${
                      !day.isCurrentMonth ? 'opacity-50' : ''
                    }`}
                    style={getShiftStyle(day.shift)}
                    onClick={() => onDateSelect && onDateSelect(day.date)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {day.day}
                    </div>
                    {day.shift && (
                      <div className="text-xs">
                        <div className="font-medium">{day.shift.type}</div>
                        <div className="opacity-90">{day.shift.name}</div>
                        {day.shift.time && (
                          <div className="opacity-75 flex items-center mt-1">
                            <Clock size={10} className="mr-1" />
                            {day.shift.time}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yearly View */}
      {view === 'year' && calendarData.months && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendarData.months.map((month, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {month.name}
                </h3>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {/* Mini calendar for each month */}
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const dayData = month.days?.[day - 1];
                    
                    if (!dayData) return null;
                    
                    return (
                      <div
                        key={day}
                        className="w-6 h-6 flex items-center justify-center rounded text-xs"
                        style={getShiftStyle(dayData.shift)}
                        title={`${day}: ${dayData.shift?.name || 'Ledigt'}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {month.workingDays} arbetsdagar
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift Legend */}
      <div className="p-6 border-t bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">Skifttyper:</h4>
        <div className="flex flex-wrap gap-4">
          {calendarData.statistics?.shiftBreakdown && 
            Object.entries(calendarData.statistics.shiftBreakdown).map(([type, count]) => {
              const style = getShiftStyle({ type, isWorkingDay: type !== 'L' });
              return (
                <div key={type} className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-2"
                    style={style}
                  ></div>
                  <span className="text-sm text-gray-700">
                    {type}: {count} dagar
                  </span>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

export default UniversalCalendar;