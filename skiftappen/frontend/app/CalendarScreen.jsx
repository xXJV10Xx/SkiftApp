import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const CalendarScreen = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      // TODO: Implement shift loading from Supabase
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading shifts:', error);
      } else {
        setShifts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('sv-SE');
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getShiftsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return shifts.filter(shift => shift.date === dateStr);
  };

  const navigateMonth = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="calendar-screen loading">
        <h1>Skiftappen</h1>
        <p>Laddar scheman...</p>
      </div>
    );
  }

  const days = getDaysInMonth(selectedDate);
  const monthYear = selectedDate.toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="calendar-screen">
      <header className="calendar-header">
        <h1>Skiftappen</h1>
        <div className="month-navigation">
          <button onClick={() => navigateMonth(-1)}>‹</button>
          <h2>{monthYear}</h2>
          <button onClick={() => navigateMonth(1)}>›</button>
        </div>
      </header>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="days-grid">
          {days.map((day, index) => {
            const dayShifts = day ? getShiftsForDate(day) : [];
            const isToday = day && formatDate(day) === formatDate(new Date());
            
            return (
              <div 
                key={index} 
                className={`day-cell ${day ? 'valid-day' : 'empty-day'} ${isToday ? 'today' : ''}`}
              >
                {day && (
                  <>
                    <span className="day-number">{day.getDate()}</span>
                    {dayShifts.length > 0 && (
                      <div className="shifts">
                        {dayShifts.map((shift, shiftIndex) => (
                          <div key={shiftIndex} className="shift">
                            {shift.start_time} - {shift.end_time}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .calendar-screen {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .calendar-header h1 {
          color: #2563eb;
          margin-bottom: 10px;
        }

        .month-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .month-navigation button {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 18px;
        }

        .month-navigation button:hover {
          background: #1d4ed8;
        }

        .calendar-grid {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f3f4f6;
        }

        .weekday {
          padding: 10px;
          text-align: center;
          font-weight: bold;
          border-right: 1px solid #e5e7eb;
        }

        .weekday:last-child {
          border-right: none;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .day-cell {
          min-height: 100px;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px;
          position: relative;
        }

        .day-cell:nth-child(7n) {
          border-right: none;
        }

        .empty-day {
          background: #f9fafb;
        }

        .valid-day:hover {
          background: #f0f9ff;
        }

        .today {
          background: #dbeafe;
        }

        .day-number {
          font-weight: bold;
          color: #374151;
        }

        .shifts {
          margin-top: 4px;
        }

        .shift {
          background: #2563eb;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .loading {
          text-align: center;
          padding: 40px;
        }
      `}</style>
    </div>
  );
};

export default CalendarScreen;