import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Info, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MonthlyCalendar = ({ selectedTeam = 31, selectedYear = 2024, selectedMonth = 1, onDateChange }) => {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Team colors
  const teamColors = {
    31: { primary: '#4CAF50', secondary: '#E8F5E8', name: 'Team 31' },
    32: { primary: '#2196F3', secondary: '#E3F2FD', name: 'Team 32' },
    33: { primary: '#FF9800', secondary: '#FFF3E0', name: 'Team 33' },
    34: { primary: '#9C27B0', secondary: '#F3E5F5', name: 'Team 34' },
    35: { primary: '#F44336', secondary: '#FFEBEE', name: 'Team 35' }
  };

  // Shift type configurations
  const shiftTypes = {
    'F': { name: 'Förmiddag', time: '06:00-14:00', color: '#4CAF50', textColor: '#FFFFFF' },
    'E': { name: 'Eftermiddag', time: '14:00-22:00', color: '#FF9800', textColor: '#FFFFFF' },
    'N': { name: 'Natt', time: '22:00-06:00', color: '#3F51B5', textColor: '#FFFFFF' },
    'L': { name: 'Ledigt', time: 'Ledig', color: '#9E9E9E', textColor: '#FFFFFF' }
  };

  const weekdays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  useEffect(() => {
    fetchCalendarData();
  }, [selectedTeam, selectedYear, selectedMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/calendar/monthly/${selectedTeam}/${selectedYear}/${selectedMonth}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      
      const data = await response.json();
      setCalendarData(data.calendar);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const newMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const newYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    onDateChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const newYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    onDateChange(newYear, newMonth);
  };

  const handleExport = async (format) => {
    try {
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      const response = await fetch(
        `/api/calendar/export/${selectedTeam}?startDate=${startDate}&endDate=${endDate}&format=${format}`
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-${selectedTeam}-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const renderShiftCell = (day) => {
    if (!day.isCurrentMonth) {
      return (
        <div className="h-20 p-1 text-gray-300 bg-gray-50">
          <div className="text-xs">{day.dayOfMonth}</div>
        </div>
      );
    }

    const shift = shiftTypes[day.shiftType];
    const teamColor = teamColors[selectedTeam];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="h-20 p-1 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              style={{ backgroundColor: shift?.color || '#f5f5f5' }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-white">
                  {day.dayOfMonth}
                </span>
                {day.shiftType && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1 py-0"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)', 
                      color: shift.color 
                    }}
                  >
                    {day.shiftType}
                  </Badge>
                )}
              </div>
              
              {day.shiftType && day.shiftType !== 'L' && (
                <div className="text-xs text-white font-medium">
                  {shift.name}
                </div>
              )}
              
              {day.shiftType === 'L' && (
                <div className="text-xs text-white font-medium">
                  Ledigt
                </div>
              )}
              
              <div className="text-xs text-white/80 mt-1">
                {day.weekday}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{months[selectedMonth - 1]} {day.dayOfMonth}, {selectedYear}</div>
              <div>{day.weekday}</div>
              {shift && (
                <>
                  <div className="mt-1">
                    <strong>{shift.name}</strong>
                  </div>
                  <div className="text-xs text-gray-600">
                    {shift.time}
                  </div>
                  <div className="text-xs text-gray-600">
                    Cykel dag {day.cycleDay}/21
                  </div>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderStatistics = () => {
    if (!calendarData?.statistics) return null;

    const stats = calendarData.statistics;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.workingDays}</div>
            <div className="text-sm text-gray-600">Arbetsdagar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.restDays}</div>
            <div className="text-sm text-gray-600">Lediga dagar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalHours}h</div>
            <div className="text-sm text-gray-600">Totala timmar</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.averageHoursPerWeek)}h
            </div>
            <div className="text-sm text-gray-600">Snitt/vecka</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderShiftLegend = () => {
    return (
      <div className="flex flex-wrap gap-4 mb-6">
        {Object.entries(shiftTypes).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-sm font-medium">{type}</span>
            <span className="text-sm text-gray-600">
              {config.name} ({config.time})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Laddar kalender...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <div className="font-medium">Fel vid laddning av kalender</div>
            <div className="text-sm mt-1">{error}</div>
            <Button onClick={fetchCalendarData} className="mt-4">
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calendarData) {
    return null;
  }

  const teamColor = teamColors[selectedTeam];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: teamColor.primary }}
              />
              <CardTitle className="text-xl">
                {teamColor.name} - {months[selectedMonth - 1]} {selectedYear}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevMonth}
              disabled={selectedYear === 2022 && selectedMonth === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Föregående
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {months[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextMonth}
              disabled={selectedYear === 2040 && selectedMonth === 12}
            >
              Nästa
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {renderStatistics()}

      {/* Shift Legend */}
      {renderShiftLegend()}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Weeks */}
          <div className="space-y-1">
            {calendarData.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.days.map((day, dayIndex) => (
                  <div key={dayIndex}>
                    {renderShiftCell(day)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-blue-600" />
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">Skiftschema Information</div>
              <div>
                SSAB Oxelösund använder ett 5-lags kontinuerligt skiftsystem med 21-dagars cykel.
                Varje färg representerar ett specifikt lag och deras arbetstider.
              </div>
              <div className="mt-2">
                <span className="font-medium">Cykel:</span> 21 dagar | 
                <span className="font-medium ml-2">Lag:</span> {teamColor.name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCalendar;