import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShifts, Shift } from '@/hooks/useShifts';
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';

interface SupabaseShiftCalendarProps {
  company: string;
  team: string;
}

export const SupabaseShiftCalendar: React.FC<SupabaseShiftCalendarProps> = ({
  company,
  team
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { shifts, loading, error } = useShifts(company, team);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generera kalenderdagar för aktuell månad
  const monthSchedule = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDay = new Date(startDate);
    const today = new Date();
    
    // Skapa en map för snabb lookup av skift
    const shiftMap = new Map<string, Shift>();
    shifts.forEach(shift => {
      shiftMap.set(shift.date, shift);
    });

    while (currentDay <= endDate) {
      const dateStr = currentDay.toISOString().split('T')[0];
      const shift = shiftMap.get(dateStr);
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === today.toDateString();
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;

      days.push({
        date: new Date(currentDay),
        day: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        isWeekend,
        shift: shift || null
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }, [year, month, shifts]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getShiftColor = (shiftType: string) => {
    const shiftColors: Record<string, string> = {
      'F': '#4ECDC4', // Förmiddag = turkos
      'E': '#FFA502', // Eftermiddag = orange  
      'N': '#45B7D1', // Natt = blå
      'L': '#E8E8E8'  // Ledig = grå
    };
    
    return shiftColors[shiftType] || '#95A5A6';
  };

  const getShiftName = (shiftType: string) => {
    const shiftNames: Record<string, string> = {
      'F': 'Förmiddag',
      'E': 'Eftermiddag', 
      'N': 'Natt',
      'L': 'Ledig'
    };
    return shiftNames[shiftType] || shiftType;
  };

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Laddar skiftschema...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Fel vid laddning av skiftschema: {error}</p>
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
        <div className="text-sm text-muted-foreground">
          {company} - {team} ({shifts.length} skift inlästa)
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
              className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all ${
                day.isToday ? 'ring-2 ring-primary' : ''
              } ${day.isWeekend ? 'bg-muted/30' : ''} ${
                !day.isCurrentMonth ? 'opacity-50' : ''
              }`}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="text-sm font-medium mb-1">
                {day.day}
              </div>
              {day.shift && (
                <>
                  <div
                    className="text-xs p-1 rounded text-white font-medium mb-1"
                    style={{ backgroundColor: getShiftColor(day.shift.shift_type) }}
                  >
                    {getShiftName(day.shift.shift_type)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.shift.shift_time}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Vald dag detaljer */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">
              {selectedDate.toLocaleDateString('sv-SE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            {(() => {
              const dateStr = selectedDate.toISOString().split('T')[0];
              const shift = shifts.find(s => s.date === dateStr);
              
              if (!shift) {
                return (
                  <div className="text-sm text-muted-foreground">
                    Ingen skiftinformation tillgänglig för detta datum
                  </div>
                );
              }
              
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getShiftColor(shift.shift_type) }}
                    />
                    <span className="font-medium">
                      {getShiftName(shift.shift_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {shift.shift_time}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Team: {shift.team}
                  </div>
                  {shift.location && (
                    <div className="text-sm text-muted-foreground">
                      Plats: {shift.location}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Färgförklaring */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Färgförklaring</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['F', 'E', 'N', 'L'].map((shiftType) => (
              <div key={shiftType} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getShiftColor(shiftType) }}
                />
                <span className="text-sm">
                  {getShiftName(shiftType)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};