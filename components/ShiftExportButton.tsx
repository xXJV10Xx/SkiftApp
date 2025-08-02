import React from 'react';
import { exportToGoogleCalendar } from '../lib/googleCalendar';
import { exportToAppleCalendar } from '../lib/appleCalendar';
import { ShiftEvent } from '../lib/types';

interface ShiftExportButtonProps {
  events: ShiftEvent[];
}

const ShiftExportButton: React.FC<ShiftExportButtonProps> = ({ events }) => {
  const handleGoogleExport = () => exportToGoogleCalendar(events);
  const handleAppleExport = () => exportToAppleCalendar(events);

  return (
    <div className="flex gap-4 mt-4">
      <button
        onClick={handleGoogleExport}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Exportera till Google Kalender
      </button>
      <button
        onClick={handleAppleExport}
        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
      >
        Exportera till Apple Kalender
      </button>
    </div>
  );
};

export default ShiftExportButton;