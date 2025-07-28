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
  const shiftType = SHIFT_TYPES[shiftTypeId];

  // Hantera statistik för alla lag eller enskilt lag
  const getStats = () => {
    if (team === 'ALLA') {
      // Beräkna genomsnittsstatistik för alla lag
      let totalHours = 0;
      let totalWorkDays = 0;
      let totalAverageHours = 0;

      company.teams.forEach(teamName => {
        const monthSchedule = generateMonthSchedule(currentYear, currentMonth, shiftType, teamName);
        const teamStats = calculateWorkedHours(monthSchedule);
        totalHours += teamStats.totalHours;
        totalWorkDays += teamStats.workDays;
        totalAverageHours += teamStats.averageHours;
      });

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        workDays: totalWorkDays,
        averageHours: Math.round((totalAverageHours / company.teams.length) * 10) / 10
      };
    } else {
      const monthSchedule = generateMonthSchedule(currentYear, currentMonth, shiftType, team);
      return calculateWorkedHours(monthSchedule);
    }
  };

  const stats = getStats();
  const nextShift = team !== 'ALLA' ? getNextShift(shiftType, team, currentDate) : null;

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
          <CardTitle className="text-sm font-medium">
            {team === 'ALLA' ? 'Totala timmar (alla lag)' : 'Arbetade timmar'}
          </CardTitle>
          <Clock size={16} color="rgb(107 114 126)" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            {team === 'ALLA' 
              ? `${stats.workDays} totala arbetsdagar`
              : `${stats.workDays} arbetsdagar denna månad`
            }
          </p>
        </CardContent>
      </Card>

      {/* Genomsnitt per dag */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {team === 'ALLA' ? 'Genomsnitt per lag' : 'Genomsnitt per dag'}
          </CardTitle>
          <TrendingUp size={16} color="rgb(107 114 126)" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageHours}h</div>
          <p className="text-xs text-muted-foreground">
            {team === 'ALLA' 
              ? 'Medel för alla lag'
              : (stats.workDays > 0 ? 'Baserat på arbetsdagar' : 'Inga arbetsdagar')
            }
          </p>
        </CardContent>
      </Card>

      {/* Nästa skift */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nästa skift</CardTitle>
          <Calendar size={16} color="rgb(107 114 126)" />
        </CardHeader>
        <CardContent>
          {team === 'ALLA' ? (
            <div className="text-sm text-muted-foreground">
              Välj specifikt lag för nästa skift
            </div>
          ) : nextShift ? (
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
          <Users size={16} color="rgb(107 114 126)" />
        </CardHeader>
        <CardContent>
          {team === 'ALLA' ? (
            <div>
              <div className="font-semibold">Alla lag ({company.teams.length})</div>
              <div className="flex items-center gap-1 mt-2">
                {company.teams.slice(0, 4).map((teamName, index) => (
                  <div
                    key={teamName}
                    className="w-4 h-4 rounded-full border border-white"
                    style={{ 
                      backgroundColor: company.colors[teamName],
                      marginLeft: index > 0 ? '-4px' : '0'
                    }}
                  />
                ))}
                {company.teams.length > 4 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{company.teams.length - 4}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {company.name}
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 