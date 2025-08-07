import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const YearlyCalendar = ({ selectedTeam = 31, selectedYear = 2024, onMonthClick, onYearChange }) => {
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

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
    'F': { name: 'Förmiddag', color: '#4CAF50' },
    'E': { name: 'Eftermiddag', color: '#FF9800' },
    'N': { name: 'Natt', color: '#3F51B5' },
    'L': { name: 'Ledigt', color: '#9E9E9E' }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
  ];

  const fullMonths = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  useEffect(() => {
    fetchYearlyData();
  }, [selectedTeam, selectedYear]);

  const fetchYearlyData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/calendar/yearly/${selectedTeam}/${selectedYear}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch yearly data');
      }
      
      const data = await response.json();
      setYearlyData(data.calendar);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching yearly data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevYear = () => {
    if (selectedYear > 2022) {
      onYearChange(selectedYear - 1);
    }
  };

  const handleNextYear = () => {
    if (selectedYear < 2040) {
      onYearChange(selectedYear + 1);
    }
  };

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    if (onMonthClick) {
      onMonthClick(selectedYear, month);
    }
  };

  const handleExportYear = async (format) => {
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const response = await fetch(
        `/api/calendar/export/${selectedTeam}?startDate=${startDate}&endDate=${endDate}&format=${format}`
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-${selectedTeam}-year-${selectedYear}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const renderMonthGrid = (monthData) => {
    const daysInMonth = monthData.days.length;
    const weeks = Math.ceil(daysInMonth / 7);
    
    // Create a grid showing shift distribution
    const grid = [];
    for (let week = 0; week < weeks; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dayIndex = week * 7 + day;
        if (dayIndex < daysInMonth) {
          const dayData = monthData.days[dayIndex];
          weekDays.push(
            <div 
              key={dayIndex}
              className="w-3 h-3 rounded-sm"
              style={{ 
                backgroundColor: shiftTypes[dayData.shiftType]?.color || '#f5f5f5' 
              }}
              title={`${dayData.dayOfMonth} - ${shiftTypes[dayData.shiftType]?.name || 'Okänd'}`}
            />
          );
        } else {
          weekDays.push(<div key={dayIndex} className="w-3 h-3" />);
        }
      }
      grid.push(
        <div key={week} className="flex gap-1">
          {weekDays}
        </div>
      );
    }
    
    return <div className="space-y-1">{grid}</div>;
  };

  const renderMonthCard = (monthData, monthIndex) => {
    const isSelected = selectedMonth === monthIndex + 1;
    const teamColor = teamColors[selectedTeam];
    
    return (
      <TooltipProvider key={monthIndex}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleMonthClick(monthIndex + 1)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Month header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{months[monthIndex]}</h3>
                    <Eye className="w-3 h-3 text-gray-400" />
                  </div>
                  
                  {/* Mini calendar grid */}
                  <div className="flex justify-center">
                    {renderMonthGrid(monthData)}
                  </div>
                  
                  {/* Quick stats */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Arbetsdagar:</span>
                      <span className="font-medium">{monthData.statistics.workingDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lediga dagar:</span>
                      <span className="font-medium">{monthData.statistics.restDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timmar:</span>
                      <span className="font-medium">{monthData.statistics.totalHours}h</span>
                    </div>
                  </div>
                  
                  {/* Shift type breakdown */}
                  <div className="flex gap-1 justify-center">
                    {Object.entries(monthData.statistics.shiftBreakdown).map(([type, count]) => (
                      count > 0 && (
                        <div key={type} className="text-center">
                          <div 
                            className="w-2 h-2 rounded-full mx-auto mb-1"
                            style={{ backgroundColor: shiftTypes[type]?.color }}
                          />
                          <div className="text-xs font-medium">{count}</div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{fullMonths[monthIndex]} {selectedYear}</div>
              <div className="mt-1 space-y-1">
                <div>Arbetsdagar: {monthData.statistics.workingDays}</div>
                <div>Lediga dagar: {monthData.statistics.restDays}</div>
                <div>Totala timmar: {monthData.statistics.totalHours}h</div>
                <div>Snitt timmar/vecka: {Math.round(monthData.statistics.averageHoursPerWeek)}h</div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Klicka för att visa detaljerad månadsvy
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderYearlyStatistics = () => {
    if (!yearlyData?.statistics) return null;

    const stats = yearlyData.statistics;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalWorkingDays}</div>
            <div className="text-sm text-gray-600">Arbetsdagar/år</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((stats.totalWorkingDays / 365) * 100)}% av året
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.totalRestDays}</div>
            <div className="text-sm text-gray-600">Lediga dagar/år</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((stats.totalRestDays / 365) * 100)}% av året
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalHours}h</div>
            <div className="text-sm text-gray-600">Totala timmar/år</div>
            <div className="text-xs text-gray-500 mt-1">
              ≈ {Math.round(stats.totalHours / 52)}h/vecka
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.totalHours / stats.totalWorkingDays * 10) / 10}h
            </div>
            <div className="text-sm text-gray-600">Snitt timmar/dag</div>
            <div className="text-xs text-gray-500 mt-1">
              på arbetsdagar
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderShiftBreakdown = () => {
    if (!yearlyData?.statistics) return null;

    const breakdown = yearlyData.statistics.shiftBreakdown;
    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Årsfördelning av skift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(breakdown).map(([type, count]) => {
              const config = shiftTypes[type];
              const percentage = Math.round((count / total) * 100);
              
              return (
                <div key={type} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: config.color }}
                  >
                    {type}
                  </div>
                  <div className="font-medium">{config.name}</div>
                  <div className="text-2xl font-bold" style={{ color: config.color }}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600">{percentage}% av året</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Laddar årsöversikt...</span>
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
            <div className="font-medium">Fel vid laddning av årsöversikt</div>
            <div className="text-sm mt-1">{error}</div>
            <Button onClick={fetchYearlyData} className="mt-4">
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!yearlyData) {
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
                {teamColor.name} - Årsöversikt {selectedYear}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportYear('json')}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportYear('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevYear}
              disabled={selectedYear <= 2022}
            >
              <ChevronLeft className="w-4 h-4" />
              {selectedYear - 1}
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium text-lg">{selectedYear}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextYear}
              disabled={selectedYear >= 2040}
            >
              {selectedYear + 1}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Yearly Statistics */}
      {renderYearlyStatistics()}

      {/* Shift Breakdown */}
      {renderShiftBreakdown()}

      {/* Monthly Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Månadsöversikt</CardTitle>
          <div className="text-sm text-gray-600">
            Klicka på en månad för att se detaljerad kalender
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {yearlyData.months.map((monthData, index) => 
              renderMonthCard(monthData, index)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Skifttyper:</span>
              {Object.entries(shiftTypes).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-sm">{type} - {config.name}</span>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              SSAB Oxelösund 21-dagars cykel
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyCalendar;