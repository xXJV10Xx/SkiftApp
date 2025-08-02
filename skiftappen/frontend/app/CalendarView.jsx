'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getTeamColor } from '../utils/shiftColors';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [shifts, setShifts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hämta skift och lag data
  useEffect(() => {
    fetchData();
  }, [currentDate, viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Bestäm datumintervall baserat på visningsläge
      const startDate = viewMode === 'month' 
        ? startOfMonth(currentDate)
        : startOfYear(currentDate);
      const endDate = viewMode === 'month'
        ? endOfMonth(currentDate)
        : endOfYear(currentDate);

      // Hämta skift för perioden
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shift_details')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (shiftsError) throw shiftsError;

      // Hämta alla lag för filteralternativ
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;

      setShifts(shiftsData || []);
      setTeams(teamsData || []);

      // Välj alla lag som standard om inget är valt
      if (selectedTeams.size === 0 && teamsData?.length > 0) {
        setSelectedTeams(new Set(teamsData.map(team => team.id)));
      }

    } catch (err) {
      console.error('Fel vid hämtning av data:', err);
      setError('Kunde inte hämta skiftdata');
    } finally {
      setLoading(false);
    }
  };

  // Navigering
  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addYears(currentDate, 1));
    }
  };

  // Hämta skift för specifik dag
  const getShiftsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(shift => 
      shift.date === dateStr && 
      selectedTeams.has(shift.team_id)
    );
  };

  // Toggle lagval
  const toggleTeam = (teamId) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  // Månadsvy
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const weekdays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekdays.map(day => (
            <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayShifts = getShiftsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-24 p-2 border rounded transition-colors
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                  hover:bg-gray-50
                `}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayShifts.map((shift, index) => (
                    <div
                      key={`${shift.id}-${index}`}
                      className="text-xs p-1 rounded text-white font-medium truncate"
                      style={{ backgroundColor: getTeamColor(shift.team_name) }}
                      title={`${shift.team_name}: ${shift.shift_type} ${shift.start_time ? `(${shift.start_time}-${shift.end_time})` : ''}`}
                    >
                      {shift.team_name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Årsvy (förenklad)
  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => 
      new Date(currentDate.getFullYear(), i, 1)
    );

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-4 gap-4">
          {months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthShifts = shifts.filter(shift => {
              const shiftDate = new Date(shift.date);
              return shiftDate >= monthStart && shiftDate <= monthEnd &&
                     selectedTeams.has(shift.team_id);
            });

            return (
              <div
                key={month.toISOString()}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode('month');
                }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {format(month, 'MMMM', { locale: sv })}
                </h3>
                <div className="text-sm text-gray-600">
                  {monthShifts.length} skift
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from(new Set(monthShifts.map(s => s.team_name)))
                    .slice(0, 3)
                    .map(teamName => (
                      <div
                        key={teamName}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getTeamColor(teamName) }}
                        title={teamName}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy', { locale: sv })
              : format(currentDate, 'yyyy', { locale: sv })
            }
          </h1>
          
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setViewMode('year')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'year' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lagfilter */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Filtrera skiftlag:</h3>
        <div className="flex flex-wrap gap-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-all
                ${selectedTeams.has(team.id)
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              style={selectedTeams.has(team.id) ? {
                backgroundColor: getTeamColor(team.name)
              } : {}}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kalendervy */}
      {viewMode === 'month' ? renderMonthView() : renderYearView()}
    </div>
  );
};

export default CalendarView;