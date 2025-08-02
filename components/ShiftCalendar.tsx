import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Company } from '@/data/companies';
import { calculateShiftForDate, formatDate, generateMonthSchedule } from '@/data/ShiftSchedules';
import { exportShiftsToICS, exportShiftsToGoogleCalendar } from '@/lib/calendarExport';
import { Calendar, ChevronLeft, ChevronRight, Clock, Download, Share } from 'lucide-react-native';
import React, { useState } from 'react';

interface ShiftCalendarProps {
  company: Company;
  team: string;
  shiftTypeId: string;
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  company,
  team,
  shiftTypeId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generera schema för aktuell månad
  const monthSchedule = generateMonthSchedule(year, month, { id: shiftTypeId }, team);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleExportToICS = () => {
    try {
      const icsContent = exportShiftsToICS(year, month, shiftTypeId, team, company.name);
      alert(`✅ Kalender exporterad!\nFilen kan importeras i Apple Kalender, Outlook, Google Kalender m.fl.`);
    } catch (error) {
      console.error('Export to ICS failed:', error);
      alert('❌ Export misslyckades. Försök igen.');
    }
  };

  const handleExportToGoogle = async () => {
    try {
      // Note: This would require OAuth setup for Google Calendar
      alert('🔧 Google Kalender export kräver OAuth-inställningar.\nAnvänd ICS-export för nu, eller konfigurera Google OAuth i .env-filen.');
    } catch (error) {
      console.error('Export to Google Calendar failed:', error);
      alert('❌ Google Kalender export misslyckades.');
    }
  };

  const getShiftColor = (shiftCode: string) => {
    if (shiftCode === 'L') return '#E8E8E8'; // Ledig = grå
    
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
            <Calendar className="h-5 w-5" />
            Skiftschema - {monthNames[month]} {year}
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
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToICS}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportera (.ics)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToGoogle}
            className="flex items-center gap-2"
          >
            <Share className="h-4 w-4" />
            Google Kalender
          </Button>
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
          {monthSchedule.map((day) => (
            <div
              key={day.day}
              className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all ${
                day.isToday ? 'ring-2 ring-primary' : ''
              } ${day.isWeekend ? 'bg-muted/30' : ''}`}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="text-sm font-medium mb-1">
                {day.day}
              </div>
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
            </div>
          ))}
        </div>

        {/* Vald dag detaljer */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">
              {formatDate(selectedDate)}
            </h3>
            {(() => {
              const shift = calculateShiftForDate(selectedDate, { id: shiftTypeId }, team);
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
                      <Clock className="h-4 w-4" />
                      {shift.time.start} - {shift.time.end}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Cykeldag {shift.cycleDay} av {shift.totalCycleDays}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Färgförklaring */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Färgförklaring</h4>
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
        </div>
      </CardContent>
    </Card>
  );
}; 