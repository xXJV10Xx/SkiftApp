import React from 'react';
import BuyPremium from './BuyPremium';
import PremiumPopup from './PremiumPopup';
import PremiumGate, { usePremium } from './PremiumGate';

// Exempel på hur du använder alla komponenter
const ExampleUsage = () => {
  const { isPremium, loading } = usePremium();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Skiftappen Premium</h1>
      
      {/* Premium Popup visas automatiskt för icke-premium användare */}
      <PremiumPopup />
      
      {/* Grundläggande köp-knapp */}
      <div className="text-center">
        <h2 className="text-xl mb-4">Grundläggande köp-knapp:</h2>
        <BuyPremium />
      </div>
      
      {/* Premium-låst innehåll med standardutseende */}
      <div>
        <h2 className="text-xl mb-4">Kalenderexport (låst för icke-premium):</h2>
        <PremiumGate feature="Kalenderexport">
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              📅 Exportera till kalender
            </h3>
            <p className="text-green-700 mb-4">
              Här kan premium-användare exportera sitt schema till Google Calendar eller Apple Calendar.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
              Exportera nu
            </button>
          </div>
        </PremiumGate>
      </div>
      
      {/* Premium-låst innehåll med anpassat fallback */}
      <div>
        <h2 className="text-xl mb-4">Påminnelser (med anpassat meddelande):</h2>
        <PremiumGate 
          feature="Skiftpåminnelser"
          fallback={
            <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200 text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                🔔 Påminnelser kräver Premium
              </h3>
              <p className="text-yellow-700 mb-4">
                Få automatiska påminnelser 2 timmar innan ditt skift börjar!
              </p>
              <BuyPremium />
            </div>
          }
        >
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              🔔 Skiftpåminnelser
            </h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span>2 timmar innan skift</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>30 minuter innan skift</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>När skiftet börjar</span>
              </label>
            </div>
          </div>
        </PremiumGate>
      </div>
      
      {/* Villkorlig rendering baserat på premium-status */}
      <div>
        <h2 className="text-xl mb-4">Status-baserad innehåll:</h2>
        {loading ? (
          <div className="text-center">Laddar...</div>
        ) : isPremium ? (
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <span className="text-green-800 font-semibold">
              ✨ Du har Premium! Inga annonser för dig.
            </span>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <div className="mb-4">
              <div className="bg-yellow-200 p-3 rounded text-center text-sm">
                📢 ANNONS: Köp våra fantastiska skiftplaneringsverktyg!
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Slipp annonser med Premium för endast 99 kr
            </p>
          </div>
        )}
      </div>
      
      {/* Premium-status indikator */}
      <div className="text-center">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
          isPremium 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isPremium ? '✨ Premium-användare' : '👤 Gratisanvändare'}
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;