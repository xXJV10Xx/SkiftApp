import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShiftCalendar, useTeams, ShiftCalendarView } from '@/hooks/useShifts';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, RefreshCw } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';

interface SupabaseShiftCalendarProps {
  companyId: string;
  companyName: string;
  selectedTeam?: string;
}

export const SupabaseShiftCalendar: React.FC<SupabaseShiftCalendarProps> = ({
  companyId,
  companyName,
  selectedTeam
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAllTeams, setShowAllTeams] = useState(!selectedTeam);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Hämta lag för företaget
  const { teams, loading: teamsLoading } = useTeams(companyId);

  // Hämta skiftdata för månaden
  const { shifts, loading: shiftsLoading, error } = useShiftCalendar(
    companyId,
    showAllTeams ? undefined : selectedTeam,
    year,
    month
  );

  // Skapa team-färg mapping
  const teamColors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    teams.forEach(team => {
      colorMap[team.team_name] = team.color;
    });
    return colorMap;
  }, [teams]);

  // Organisera skift per dag
  const shiftsByDate = useMemo(() => {
    const dateMap: Record<string, ShiftCalendarView[]> = {};
    shifts.forEach(shift => {
      const dateKey = shift.date;
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(shift);
    });
    return dateMap;
  }, [shifts]);

  // Generera kalenderdagar för månaden
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Lägg till tomma celler för dagar före månadens start
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Lägg till alla dagar i månaden
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isDateToday(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dateKey = formatDateKey(date);
      const dayShifts = shiftsByDate[dateKey] || [];
      
      days.push({
        day,
        date,
        isToday,
        isWeekend,
        shifts: dayShifts
      });
    }
    
    return days;
  }, [year, month, shiftsByDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getShiftColor = (shiftCode: string, teamName: string) => {
    if (shiftCode === 'L') return '#E8E8E8'; // Ledig = grå
    return teamColors[teamName] || getDefaultShiftColor(shiftCode);
  };

  const getDefaultShiftColor = (shiftCode: string) => {
    const shiftColors: Record<string, string> = {
      'F': '#96CEB4', // Förmiddag = grön
      'E': '#FFA502', // Eftermiddag = orange
      'N': '#45B7D1', // Natt = blå
      'M': '#FF6B6B', // Morgon = röd
      'A': '#4ECDC4', // Kväll = turkos
      'D': '#9B59B6'  // Dag = lila
    };
    return shiftColors[shiftCode] || '#95A5A6';
  };

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

  if (teamsLoading || shiftsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Laddar schema...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
          Fel vid laddning av schema: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {companyName} - {monthNames[month]} {year}
            {!showAllTeams && selectedTeam && ` (Lag ${selectedTeam})`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Idag
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {teams.length > 1 && (
              <Button
                variant={showAllTeams ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllTeams(!showAllTeams)}
              >
                <Users className="h-4 w-4 mr-1" />
                {showAllTeams ? `Visa ${selectedTeam || 'Ett lag'}` : 'Alla lag'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Lagförklaring för alla lag */}
        {showAllTeams && teams.length > 1 && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lagförklaring - {companyName}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {teams.map((team) => (
                <div key={team.team_name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-sm font-medium">
                    Lag {team.team_name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Grå = Ledig. Varje lag arbetar 7 dagar i sträck (F,F,E,E,N,N,N) följt av 4 lediga dagar.
            </div>
          </div>
        )}

        {/* Kalendergrid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Veckodagar */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Kalenderdagar */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`p-2 min-h-[80px] border rounded-lg transition-all ${
                day ? 'cursor-pointer' : ''
              } ${
                day?.isToday ? 'ring-2 ring-primary' : ''
              } ${day?.isWeekend ? 'bg-muted/30' : ''}`}
              onClick={() => day && setSelectedDate(day.date)}
            >
              {day && (
                <>
                  <div className="text-sm font-medium mb-1">
                    {day.day}
                  </div>
                  
                  {showAllTeams ? (
                    // Visa alla lag
                    <div className="space-y-1">
                      {day.shifts.map((shift) => (
                        <div
                          key={`${shift.team_name}-${shift.shift_code}`}
                          className="text-xs p-1 rounded text-white font-medium flex items-center justify-between"
                          style={{ backgroundColor: getShiftColor(shift.shift_code, shift.team_name) }}
                        >
                          <span>{shift.team_name}</span>
                          <span>{shift.shift_code}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Visa endast valt lag
                    day.shifts.length > 0 && (
                      <>
                        {day.shifts[0].shift_code !== 'L' && (
                          <div
                            className="text-xs p-1 rounded text-white font-medium"
                            style={{ backgroundColor: getShiftColor(day.shifts[0].shift_code, day.shifts[0].team_name) }}
                          >
                            {day.shifts[0].shift_name}
                          </div>
                        )}
                        {day.shifts[0].shift_code === 'L' && (
                          <div className="text-xs text-muted-foreground">
                            Ledig
                          </div>
                        )}
                        {day.shifts[0].start_time && day.shifts[0].end_time && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {day.shifts[0].start_time.slice(0, 5)}-{day.shifts[0].end_time.slice(0, 5)}
                          </div>
                        )}
                      </>
                    )
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Vald dag detaljer */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">
              {formatSelectedDate(selectedDate)}
            </h3>
            {(() => {
              const dateKey = formatDateKey(selectedDate);
              const dayShifts = shiftsByDate[dateKey] || [];
              
              if (dayShifts.length === 0) {
                return <div className="text-muted-foreground">Inga skift registrerade för denna dag.</div>;
              }

              return (
                <div className="space-y-3">
                  {dayShifts.map((shift) => (
                    <div key={shift.team_name} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getShiftColor(shift.shift_code, shift.team_name) }}
                      />
                      <span className="font-medium w-12">
                        Lag {shift.team_name}:
                      </span>
                      <span className="font-medium">
                        {shift.shift_name}
                      </span>
                      {shift.start_time && shift.end_time && (
                        <span className="text-sm text-muted-foreground">
                          {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        Cykeldag {shift.cycle_day}/{shift.total_cycle_days}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Skiftförklaring */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Skiftförklaring</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { code: 'F', name: 'Förmiddag', time: '06:00-14:00' },
              { code: 'E', name: 'Eftermiddag', time: '14:00-22:00' },
              { code: 'N', name: 'Natt', time: '22:00-06:00' },
              { code: 'L', name: 'Ledig', time: '' }
            ].map((shift) => (
              <div key={shift.code} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getDefaultShiftColor(shift.code) }}
                />
                <span className="text-sm">
                  {shift.name} {shift.time && `(${shift.time})`}
                </span>
              </div>
            ))}
          </div>
          {companyId === 'ssab_oxelosund' && (
            <div className="mt-3 text-xs text-muted-foreground">
              Arbetsmönster: 7 dagar (2 Förmiddagar + 2 Eftermiddagar + 3 Nätter) följt av 4 lediga dagar
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hjälpfunktioner
function isDateToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatSelectedDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('sv-SE', options);
}