import React from 'react';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  // Mock data - replace with real data from API
  const stats = [
    {
      title: 'Totala skift',
      value: '24',
      change: '+12%',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Aktiva skift',
      value: '8',
      change: '+3%',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Anställda',
      value: '15',
      change: '+1',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Tillväxt',
      value: '23%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const recentShifts = [
    { id: 1, title: 'Morgonpass', time: '06:00 - 14:00', location: 'Avdelning A', status: 'Aktiv' },
    { id: 2, title: 'Kvällspass', time: '14:00 - 22:00', location: 'Avdelning B', status: 'Kommande' },
    { id: 3, title: 'Nattpass', time: '22:00 - 06:00', location: 'Avdelning C', status: 'Planerat' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-2">Översikt över dina skift och aktiviteter</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Shifts */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">Senaste skift</h2>
          <button className="btn-primary">Visa alla</button>
        </div>
        
        <div className="space-y-4">
          {recentShifts.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Clock className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">{shift.title}</h3>
                  <p className="text-sm text-secondary-600">{shift.time} • {shift.location}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                shift.status === 'Aktiv' 
                  ? 'bg-green-100 text-green-800' 
                  : shift.status === 'Kommande'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-secondary-100 text-secondary-800'
              }`}>
                {shift.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Calendar className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Skapa nytt skift</h3>
          <p className="text-secondary-600 mb-4">Lägg till ett nytt skift till schemat</p>
          <button className="btn-primary w-full">Skapa skift</button>
        </div>
        
        <div className="card text-center">
          <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Hantera personal</h3>
          <p className="text-secondary-600 mb-4">Visa och redigera personalinformation</p>
          <button className="btn-secondary w-full">Visa personal</button>
        </div>
        
        <div className="card text-center">
          <TrendingUp className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Rapporter</h3>
          <p className="text-secondary-600 mb-4">Se statistik och rapporter</p>
          <button className="btn-secondary w-full">Visa rapporter</button>
        </div>
      </div>
    </div>
  );
};