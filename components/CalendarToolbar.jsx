import React from 'react';
import { useExportAccess } from '../hooks/useExportAccess';

export default function CalendarToolbar({ view, setView, team, setTeam, onExport, onActualExport }) {
  const { hasExportAccess, loading } = useExportAccess();

  const handleExportClick = () => {
    if (hasExportAccess) {
      onActualExport(); // Utför faktisk export
    } else {
      onExport(); // Gå till betalning
    }
  };

  return (
    <div className="flex justify-between items-center p-2 bg-white border-b">
      <div className="space-x-2">
        <button 
          onClick={() => setView('month')}
          className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Månad
        </button>
        <button 
          onClick={() => setView('year')}
          className={`px-3 py-1 rounded ${view === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          År
        </button>
      </div>
      
      <div>
        <select value={team} onChange={(e) => setTeam(e.target.value)} className="border rounded px-2 py-1">
          <option value="ALL">Alla lag</option>
          <option value="31">Lag 31</option>
          <option value="32">Lag 32</option>
          <option value="33">Lag 33</option>
          <option value="34">Lag 34</option>
          <option value="35">Lag 35</option>
        </select>
      </div>

      <div className="relative">
        <button
          onClick={handleExportClick}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium ${
            hasExportAccess 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Laddar...' : hasExportAccess ? 'Exportera kalender' : 'Köp export (99 kr)'}
        </button>
        
        {hasExportAccess && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            ✓ Betald
          </div>
        )}
      </div>
    </div>
  );
}