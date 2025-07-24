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

  // Generera schema för aktuell månad
  const shiftType = Object.values(SHIFT_TYPES).find(st => st.id === shiftTypeId);
  const monthSchedule = shiftType ? generateMonthSchedule(currentYear, currentMonth, shiftType, team) : [];
  
  // Beräkna statistik
  const stats = calculateWorkedHours(monthSchedule);
  const nextShift = shiftType ? getNextShift(shiftType, team, currentDate) : null;

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Arbetade timmar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arbetade timmar</CardTitle>
          <Clock size={16} color="#666" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            {stats.workDays} arbetsdagar denna månad
          </p>
        </CardContent>
      </Card>

      {/* Genomsnitt per dag */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Genomsnitt per dag</CardTitle>
          <TrendingUp size={16} color="#666" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageHours}h</div>
          <p className="text-xs text-muted-foreground">
            {stats.workDays > 0 ? 'Baserat på arbetsdagar' : 'Inga arbetsdagar'}
          </p>
        </CardContent>
      </Card>

      {/* Nästa skift */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nästa skift</CardTitle>
          <Calendar size={16} color="#666" />
        </CardHeader>
        <CardContent>
          {nextShift ? (
            <>
              <div className="text-lg font-semibold">
                {getShiftName(nextShift.shift.code)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(nextShift.date)}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextShift.daysUntil} dagar kvar
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Inget kommande skift
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Skiftlag</CardTitle>
          <Users size={16} color="#666" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: company.colors[team] }}
            />
            <div>
              <div className="font-semibold">Lag {team}</div>
              <p className="text-xs text-muted-foreground">
                {company.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 