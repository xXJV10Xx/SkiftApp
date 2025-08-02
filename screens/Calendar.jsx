import React, { useState } from 'react';
import CalendarToolbar from '../components/CalendarToolbar';
import { handleExportCheckout } from '../lib/stripeExport';
import { exportCalendarData, downloadFile } from '../lib/exportService';

export default function CalendarScreen() {
  const [view, setView] = useState('month');
  const [team, setTeam] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const handleActualExport = async () => {
    setIsExporting(true);
    try {
      // Exportera som ICS-fil (kan utökas med format-val)
      const icsContent = await exportCalendarData(team, 'ics');
      const filename = `kalender_${team}_${new Date().toISOString().split('T')[0]}.ics`;
      downloadFile(icsContent, filename, 'text/calendar');
      
      // Visa success-meddelande
      alert('Kalender exporterad framgångsrikt!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export misslyckades. Försök igen.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <CalendarToolbar
        view={view}
        setView={setView}
        team={team}
        setTeam={setTeam}
        onExport={handleExportCheckout}
        onActualExport={handleActualExport}
      />
      
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Exporterar kalender...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Visa kalender baserat på vy */}
    </>
  );
}