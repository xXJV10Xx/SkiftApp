import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company } from '@/data/companies';
import { calculateShiftForDate, formatDate, generateMonthSchedule, SHIFT_TYPES } from '@/data/ShiftSchedules';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import React, { useState } from 'react';

interface ShiftCalendarProps {
  company: Company;
  team: string;
  shiftTypeId: string;
}

interface SingleTeamScheduleItem {
  date: Date | null;
  day: number | null;
  shift: {
    code: string;
    time: { start: string; end: string; name: string };
    cycleDay: number;
    totalCycleDays: number;
  };
  isToday: boolean;
  isWeekend: boolean;
  isEmpty: boolean;
}

interface AllTeamsScheduleItem {
  date: Date | null;
  day: number | null;
  shifts: Array<{
    team: string;
    code: string;
    time: { start: string; end: string; name: string };
    cycleDay: number;
    totalCycleDays: number;
  }>;
  isToday: boolean;
  isWeekend: boolean;
  isEmpty: boolean;
}

type ScheduleItem = SingleTeamScheduleItem | AllTeamsScheduleItem;

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  company,
  team,
  shiftTypeId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const shiftType = SHIFT_TYPES[shiftTypeId];

  // Generera schema för aktuell månad
  const monthSchedule: ScheduleItem[] = team === 'ALLA' 
    ? generateAllTeamsSchedule(year, month, shiftType, company)
    : generateMonthSchedule(year, month, shiftType, team);

  function generateAllTeamsSchedule(year: number, month: number, shiftType: any, company: Company): AllTeamsScheduleItem[] {
    const schedule: AllTeamsScheduleItem[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    // Add empty cells for proper day-of-week alignment
    for (let i = 0; i < startDayOfWeek; i++) {
      schedule.push({
        date: null,
        day: null,
        shifts: [],
        isToday: false,
        isWeekend: false,
        isEmpty: true
      });
    }
    
    // Add actual days with all teams
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const shifts = company.teams.map(teamName => {
        const shift = calculateShiftForDate(date, shiftType, teamName);
        return {
          team: teamName,
          ...shift
        };
      });
      
      schedule.push({
        date: date,
        day: day,
        shifts: shifts,
        isToday: isToday(date),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isEmpty: false
      });
    }
    
    return schedule;
  }

  function isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  function isAllTeamsScheduleItem(item: ScheduleItem): item is AllTeamsScheduleItem {
    return 'shifts' in item;
  }

  function isSingleTeamScheduleItem(item: ScheduleItem): item is SingleTeamScheduleItem {
    return 'shift' in item;
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getShiftColor = (shiftCode: string, teamName?: string) => {
    if (shiftCode === 'L') return '#E8E8E8'; // Ledig = grå
    
    if (teamName && company.colors[teamName]) {
      return company.colors[teamName];
    }
    
    const teamColor = company.colors[team];
    if (teamColor) return teamColor;
    
    // Standardfärger för skift
    const shiftColors: Record<string, string> = {
      'M': '#FF6B6B', // Morgon = röd
      'A': '#4ECDC4', // Kväll = turkos
      'N': '#45B7D1', // Natt = blå
      'F': '#96CEB4', // Förmiddag = grön
      'E': '#FFA502', // Eftermiddag = orange
      'D': '#9B59B6'  // Dag = lila
    };
    
    return shiftColors[shiftCode] || '#95A5A6';
  };

  const getShiftName = (shiftCode: string) => {
    const shiftNames: Record<string, string> = {
      'M': 'Morgon',
      'A': 'Kväll',
      'N': 'Natt',
      'F': 'Förmiddag',
      'E': 'Eftermiddag',
      'D': 'Dag',
      'L': 'Ledig'
    };
    return shiftNames[shiftCode] || shiftCode;
  };

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Skiftschema - {monthNames[month]} {year}
            {team === 'ALLA' && <span className="text-sm text-muted-foreground">(Alla lag)</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft size={16} />
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
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Kalendergrid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Veckodagar */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Kalenderdagar */}
          {monthSchedule.map((day, index) => (
            <div
              key={index}
              className={`p-2 min-h-[80px] border rounded-lg transition-all ${
                day.isEmpty ? 'bg-transparent border-transparent' : 'cursor-pointer'
              } ${
                day.isToday ? 'ring-2 ring-primary' : ''
              } ${day.isWeekend && !day.isEmpty ? 'bg-muted/30' : ''}`}
              onClick={() => !day.isEmpty && setSelectedDate(day.date)}
            >
              {!day.isEmpty && (
                <>
                  <div className="text-sm font-medium mb-1">
                    {day.day}
                  </div>
                  
                  {team === 'ALLA' && isAllTeamsScheduleItem(day) ? (
                    // Show all teams
                    <div className="space-y-1">
                      {day.shifts.filter(shift => shift.code !== 'L').map((shift, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-1 rounded text-white font-medium flex items-center justify-between"
                          style={{ backgroundColor: getShiftColor(shift.code, shift.team) }}
                        >
                          <span>{shift.team}</span>
                          <span>{getShiftName(shift.code)}</span>
                        </div>
                      ))}
                      {day.shifts.every(shift => shift.code === 'L') && (
                        <div className="text-xs text-muted-foreground">
                          Alla lediga
                        </div>
                      )}
                    </div>
                  ) : isSingleTeamScheduleItem(day) ? (
                    // Show single team
                    <>
                      {day.shift.code !== 'L' && (
                        <div
                          className="text-xs p-1 rounded text-white font-medium"
                          style={{ backgroundColor: getShiftColor(day.shift.code) }}
                        >
                          {getShiftName(day.shift.code)}
                        </div>
                      )}
                      {day.shift.code === 'L' && (
                        <div className="text-xs text-muted-foreground">
                          Ledig
                        </div>
                      )}
                      {day.shift.time.start && day.shift.time.end && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {day.shift.time.start}-{day.shift.time.end}
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Vald dag detaljer */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">
              {formatDate(selectedDate)}
            </h3>
            {team === 'ALLA' ? (
              // Show all teams for selected date
              <div className="space-y-3">
                {company.teams.map(teamName => {
                  const shift = calculateShiftForDate(selectedDate, shiftType, teamName);
                  return (
                    <div key={teamName} className="flex items-center justify-between p-2 rounded-lg bg-background">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getShiftColor(shift.code, teamName) }}
                        />
                        <span className="font-medium">Lag {teamName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{getShiftName(shift.code)}</div>
                        {shift.time.start && shift.time.end && (
                          <div className="text-sm text-muted-foreground">
                            {shift.time.start} - {shift.time.end}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show single team details
              (() => {
                const shift = calculateShiftForDate(selectedDate, shiftType, team);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getShiftColor(shift.code) }}
                      />
                      <span className="font-medium">
                        {getShiftName(shift.code)}
                      </span>
                    </div>
                    {shift.time.start && shift.time.end && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={16} />
                        {shift.time.start} - {shift.time.end}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Cykeldag {shift.cycleDay} av {shift.totalCycleDays}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Färgförklaring */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Färgförklaring</h4>
          {team === 'ALLA' ? (
            // Show team colors
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {company.teams.map((teamName) => (
                <div key={teamName} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: company.colors[teamName] }}
                  />
                  <span className="text-sm">Lag {teamName}</span>
                </div>
              ))}
            </div>
          ) : (
            // Show shift types
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['M', 'A', 'N', 'F', 'E', 'D', 'L'].map((shiftCode) => (
                <div key={shiftCode} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getShiftColor(shiftCode) }}
                  />
                  <span className="text-sm">
                    {getShiftName(shiftCode)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 