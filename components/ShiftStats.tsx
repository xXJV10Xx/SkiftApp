import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company } from '@/data/companies';
import { calculateWorkedHours, generateMonthSchedule, getNextShift, SHIFT_TYPES } from '@/data/ShiftSchedules';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react-native';
import React from 'react';

interface ShiftStatsProps {
  company: Company;
  team: string;
  shiftTypeId: string;
}

export const ShiftStats: React.FC<ShiftStatsProps> = ({
  company,
  team,
  shiftTypeId
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get the full ShiftType object
  const shiftType = SHIFT_TYPES[shiftTypeId.toUpperCase()];
  if (!shiftType) {
    return <div>Error: Shift type not found</div>;
  }

  // Generera schema för aktuell månad
  const monthSchedule = generateMonthSchedule(currentYear, currentMonth, shiftType, team);
  
  // Beräkna statistik
  const workedHoursData = calculateWorkedHours(monthSchedule);
  const nextShift = getNextShift(shiftType, team, currentDate);

  const getShiftColor = (shiftCode: string) => {
    const teamColor = company.colors[team];
    if (teamColor && shiftCode !== 'L') return teamColor;
    
    const shiftColors: Record<string, string> = {
      'M': '#FF6B6B',
      'A': '#4ECDC4',
      'N': '#45B7D1',
      'F': '#96CEB4',
      'E': '#FFA502',
      'D': '#9B59B6',
      'L': '#E8E8E8'
    };
    
    return shiftColors[shiftCode] || '#95A5A6';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Nästa skift */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nästa skift</CardTitle>
          <Clock size={16} color="#6B7280" />
        </CardHeader>
        <CardContent>
          {nextShift ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {nextShift.daysUntil === 0 ? 'Idag' : `${nextShift.daysUntil} dagar`}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getShiftColor(nextShift.shift.code) }}
                />
                <span className="text-sm text-muted-foreground">
                  {nextShift.shift.time.name} ({nextShift.shift.time.start}-{nextShift.shift.time.end})
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Inga kommande skift</div>
          )}
        </CardContent>
      </Card>

      {/* Arbetade timmar denna månad */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arbetade timmar</CardTitle>
          <TrendingUp size={16} color="#6B7280" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{workedHoursData.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            Denna månad
          </p>
        </CardContent>
      </Card>

      {/* Antal skift denna månad */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Antal skift</CardTitle>
          <Calendar size={16} color="#6B7280" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthSchedule.filter(day => day.shift.code !== 'L').length}
          </div>
          <p className="text-xs text-muted-foreground">
            Av {monthSchedule.length} dagar
          </p>
        </CardContent>
      </Card>

      {/* Skiftlag info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Skiftlag</CardTitle>
          <Users size={16} color="#6B7280" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: company.colors[team] || '#6B7280' }}
              />
              <span className="text-lg font-bold">Lag {team}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {company.name}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 