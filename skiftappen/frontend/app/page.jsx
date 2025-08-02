'use client';

import React from 'react';
import CalendarView from './CalendarView';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Skiftappen
              </h1>
              <span className="ml-2 text-sm text-gray-500">
                Svenska skiftscheman
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CalendarView />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 Skiftappen - Visa svenska skiftscheman enkelt
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">
                Om appen
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                Kontakt
              </a>
              <a href="#" className="hover:text-gray-700 transition-colors">
                Integritetspolicy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}