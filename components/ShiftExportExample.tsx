import React from 'react';
import { useConvertedShifts } from '../hooks/useConvertedShifts';
import ShiftExportButton from './ShiftExportButton';

interface ShiftExportExampleProps {
  employeeId?: string;
  companyId?: string;
  teamId?: string;
}

const ShiftExportExample: React.FC<ShiftExportExampleProps> = ({ 
  employeeId, 
  companyId, 
  teamId 
}) => {
  const { events, loading, error } = useConvertedShifts(employeeId, companyId, teamId);

  if (loading) {
    return <div className="p-4">Laddar skift...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Fel: {error}</div>;
  }

  if (events.length === 0) {
    return <div className="p-4">Inga skift att visa.</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        Exportera dina skift ({events.length} skift)
      </h3>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Kommande skift:
        </div>
        <ul className="mt-2 space-y-1">
          {events.slice(0, 3).map((event, index) => (
            <li key={index} className="text-sm">
              <strong>{event.title}</strong> - {event.date} ({event.startTime}-{event.endTime})
            </li>
          ))}
          {events.length > 3 && (
            <li className="text-sm text-gray-500">
              ...och {events.length - 3} fler skift
            </li>
          )}
        </ul>
      </div>

      <ShiftExportButton events={events} />
    </div>
  );
};

export default ShiftExportExample;