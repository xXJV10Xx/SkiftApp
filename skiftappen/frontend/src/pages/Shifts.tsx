import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Clock, MapPin, User } from 'lucide-react';

export const Shifts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - replace with real data from API
  const shifts = [
    {
      id: 1,
      title: 'Morgonpass - Kassa',
      startTime: '06:00',
      endTime: '14:00',
      date: '2024-01-15',
      location: 'Avdelning A',
      assignedTo: 'Anna Andersson',
      status: 'confirmed',
      description: 'Ansvarig för kassan under morgonpasset'
    },
    {
      id: 2,
      title: 'Kvällspass - Lager',
      startTime: '14:00',
      endTime: '22:00',
      date: '2024-01-15',
      location: 'Lager',
      assignedTo: 'Erik Eriksson',
      status: 'pending',
      description: 'Lageransvarig för kvällspasset'
    },
    {
      id: 3,
      title: 'Nattpass - Säkerhet',
      startTime: '22:00',
      endTime: '06:00',
      date: '2024-01-15',
      location: 'Hela byggnaden',
      assignedTo: 'Maria Svensson',
      status: 'confirmed',
      description: 'Säkerhetsansvarig under natten'
    },
    {
      id: 4,
      title: 'Helgpass - Service',
      startTime: '10:00',
      endTime: '18:00',
      date: '2024-01-16',
      location: 'Kundservice',
      assignedTo: null,
      status: 'open',
      description: 'Kundservice under helgen'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bekräftat';
      case 'pending':
        return 'Väntar';
      case 'open':
        return 'Öppet';
      default:
        return 'Okänt';
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (shift.assignedTo && shift.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || shift.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Skift</h1>
          <p className="text-secondary-600 mt-2">Hantera och schemalägg skift</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nytt skift</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Sök skift..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-secondary-600" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Alla status</option>
              <option value="confirmed">Bekräftat</option>
              <option value="pending">Väntar</option>
              <option value="open">Öppet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShifts.map((shift) => (
          <div key={shift.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">{shift.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                {getStatusText(shift.status)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Calendar className="h-4 w-4" />
                <span>{shift.date}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Clock className="h-4 w-4" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <MapPin className="h-4 w-4" />
                <span>{shift.location}</span>
              </div>

              {shift.assignedTo && (
                <div className="flex items-center space-x-2 text-sm text-secondary-600">
                  <User className="h-4 w-4" />
                  <span>{shift.assignedTo}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-secondary-600 mt-4 mb-4">{shift.description}</p>

            <div className="flex space-x-2">
              <button className="btn-secondary flex-1 text-sm">Redigera</button>
              {shift.status === 'open' && (
                <button className="btn-primary flex-1 text-sm">Tilldela</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredShifts.length === 0 && (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Inga skift hittades</h3>
          <p className="text-secondary-600 mb-6">
            {searchTerm || selectedFilter !== 'all' 
              ? 'Prova att ändra dina sökkriterier' 
              : 'Skapa ditt första skift för att komma igång'
            }
          </p>
          <button className="btn-primary">
            Skapa nytt skift
          </button>
        </div>
      )}
    </div>
  );
};