import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, BarChart3, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import MonthlyCalendar from './MonthlyCalendar';
import YearlyCalendar from './YearlyCalendar';

const ScheduleCalendar = () => {
  const [selectedTeam, setSelectedTeam] = useState(31);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeView, setActiveView] = useState('monthly');
  const [comparisonData, setComparisonData] = useState(null);
  const [patternInfo, setPatternInfo] = useState(null);

  // Team configurations
  const teams = {
    31: { name: 'Team 31', color: '#4CAF50', description: 'Grön grupp' },
    32: { name: 'Team 32', color: '#2196F3', description: 'Blå grupp' },
    33: { name: 'Team 33', color: '#FF9800', description: 'Orange grupp' },
    34: { name: 'Team 34', color: '#9C27B0', description: 'Lila grupp' },
    35: { name: 'Team 35', color: '#F44336', description: 'Röd grupp' }
  };

  // Generate year options (2022-2040)
  const yearOptions = [];
  for (let year = 2022; year <= 2040; year++) {
    yearOptions.push(year);
  }

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  useEffect(() => {
    fetchPatternInfo();
  }, []);

  useEffect(() => {
    if (activeView === 'comparison') {
      fetchComparisonData();
    }
  }, [selectedYear, selectedMonth, activeView]);

  const fetchPatternInfo = async () => {
    try {
      const response = await fetch('/api/calendar/pattern');
      if (response.ok) {
        const data = await response.json();
        setPatternInfo(data.pattern);
      }
    } catch (error) {
      console.error('Error fetching pattern info:', error);
    }
  };

  const fetchComparisonData = async () => {
    try {
      const response = await fetch(`/api/calendar/compare/${selectedYear}/${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data.comparison);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  const handleTeamChange = (team) => {
    setSelectedTeam(parseInt(team));
  };

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(parseInt(month));
  };

  const handleDateChange = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleMonthClick = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setActiveView('monthly');
  };

  const renderTeamSelector = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(teams).map(([teamNumber, teamInfo]) => (
          <Button
            key={teamNumber}
            variant={selectedTeam === parseInt(teamNumber) ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTeamChange(teamNumber)}
            className="flex items-center gap-2"
            style={{
              backgroundColor: selectedTeam === parseInt(teamNumber) ? teamInfo.color : 'transparent',
              borderColor: teamInfo.color,
              color: selectedTeam === parseInt(teamNumber) ? 'white' : teamInfo.color
            }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: teamInfo.color }}
            />
            {teamInfo.name}
          </Button>
        ))}
      </div>
    );
  };

  const renderDateSelectors = () => {
    return (
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">År:</label>
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeView === 'monthly' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Månad:</label>
            <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Tidsperiod: 2022-2040</span>
        </div>
      </div>
    );
  };

  const renderComparisonView = () => {
    if (!comparisonData) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Laddar jämförelse...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Alla lag - {comparisonData.monthName} {comparisonData.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Object.entries(comparisonData.teams).map(([teamNumber, teamData]) => {
                const teamInfo = teams[teamNumber];
                return (
                  <Card key={teamNumber} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: teamInfo.color }}
                        />
                        <h3 className="font-medium">{teamInfo.name}</h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Arbetsdagar:</span>
                          <span className="font-medium">{teamData.statistics.workingDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lediga dagar:</span>
                          <span className="font-medium">{teamData.statistics.restDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Timmar:</span>
                          <span className="font-medium">{teamData.statistics.totalHours}h</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex gap-1">
                          {Object.entries(teamData.statistics.shiftBreakdown).map(([type, count]) => (
                            count > 0 && (
                              <div key={type} className="text-center flex-1">
                                <div className="text-xs font-medium">{type}</div>
                                <div className="text-sm font-bold">{count}</div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedTeam(parseInt(teamNumber));
                          setActiveView('monthly');
                        }}
                      >
                        Visa detaljer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPatternInfo = () => {
    if (!patternInfo) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Skiftschema Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">System Detaljer</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cykel längd:</span>
                  <span className="font-medium">{patternInfo.patternLength} dagar</span>
                </div>
                <div className="flex justify-between">
                  <span>Arbetsdagar/cykel:</span>
                  <span className="font-medium">{patternInfo.workingDaysPerCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lediga dagar/cykel:</span>
                  <span className="font-medium">{patternInfo.restDaysPerCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Antal lag:</span>
                  <span className="font-medium">{Object.keys(patternInfo.teams).length}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Skift Mönster</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {patternInfo.pattern.map((shift, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="text-xs"
                    style={{
                      backgroundColor: patternInfo.shiftTypes[shift]?.color || '#f5f5f5',
                      color: 'white',
                      borderColor: patternInfo.shiftTypes[shift]?.color || '#d1d5db'
                    }}
                  >
                    {shift}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-gray-600">
                21-dagars kontinuerlig cykel för 5-lags system
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <strong>Beskrivning:</strong> {patternInfo.description}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const selectedTeamInfo = teams[selectedTeam];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">SSAB Skiftschema Generator</CardTitle>
                <div className="text-sm text-gray-600 mt-1">
                  Visa ditt lag's schema mellan 2022-2040
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: selectedTeamInfo.color }}
              />
              <span className="font-medium">{selectedTeamInfo.name}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            <span className="font-medium">Välj lag:</span>
          </div>
          {renderTeamSelector()}
          
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Tidsperiod:</span>
          </div>
          {renderDateSelectors()}
        </CardContent>
      </Card>

      {/* Main Calendar Views */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">Månadsvy</TabsTrigger>
          <TabsTrigger value="yearly">Årsöversikt</TabsTrigger>
          <TabsTrigger value="comparison">Jämför lag</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyCalendar
            selectedTeam={selectedTeam}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onDateChange={handleDateChange}
          />
        </TabsContent>

        <TabsContent value="yearly" className="mt-6">
          <YearlyCalendar
            selectedTeam={selectedTeam}
            selectedYear={selectedYear}
            onMonthClick={handleMonthClick}
            onYearChange={handleYearChange}
          />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          {renderComparisonView()}
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          {renderPatternInfo()}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  setSelectedYear(today.getFullYear());
                  setSelectedMonth(today.getMonth() + 1);
                  setActiveView('monthly');
                }}
              >
                Gå till idag
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setActiveView('yearly')}
              >
                Visa hela året
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              Skiftschema för SSAB Oxelösund 5-lags kontinuerligt system
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleCalendar;