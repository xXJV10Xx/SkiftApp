import React from 'react';

export default function CalendarToolbar({ view, setView, team, setTeam, onExport, hasExportAccess }) {
  return (
    <div className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
      <div className="flex space-x-2">
        <button 
          onClick={() => setView('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Månad
        </button>
        <button 
          onClick={() => setView('year')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'year' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          År
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <select 
          value={team} 
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">Alla lag</option>
          <option value="31">Lag 31</option>
          <option value="32">Lag 32</option>
          <option value="33">Lag 33</option>
          <option value="34">Lag 34</option>
          <option value="35">Lag 35</option>
        </select>
        
        <button
          onClick={onExport}
          disabled={!hasExportAccess}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hasExportAccess
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {hasExportAccess ? 'Exportera kalender' : 'Exportera kalender (99 kr)'}
        </button>
      </div>
    </div>
  );
}