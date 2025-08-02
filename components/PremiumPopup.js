import React, { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PremiumPopup = () => {
  const user = useUser();
  const [showPopup, setShowPopup] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [popupCount, setPopupCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
      checkPopupTiming();
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    const { data } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', user.id)
      .single();
    
    setIsPremium(data?.is_premium || false);
  };

  const checkPopupTiming = () => {
    const lastShown = localStorage.getItem('premiumPopupLastShown');
    const count = parseInt(localStorage.getItem('premiumPopupCount') || '0');
    
    if (!lastShown || Date.now() - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
      // Visa popup max 3 gånger per dag
      if (count < 3) {
        setTimeout(() => setShowPopup(true), 5000); // Visa efter 5 sekunder
        setPopupCount(count + 1);
      }
    }
  };

  const handleBuyPremium = async () => {
    const res = await fetch('/api/create-checkout.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email
      })
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  const closePopup = () => {
    setShowPopup(false);
    localStorage.setItem('premiumPopupLastShown', Date.now().toString());
    localStorage.setItem('premiumPopupCount', (popupCount + 1).toString());
  };

  if (isPremium || !showPopup || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            🚀 Uppgradera till Premium!
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Få ut mer av Skiftappen med premiumfunktioner:
            </p>
            
            <div className="space-y-2 text-left">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Exportera till Google Calendar</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Synka med Apple Calendar</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Påminnelser om skift</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Ingen reklam</span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="text-3xl font-bold text-green-600">99 kr</span>
            <span className="text-gray-500 ml-2">engångsbetalning</span>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={handleBuyPremium}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Köp Premium Nu
            </button>
            
            <button 
              onClick={closePopup}
              className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
            >
              Kanske senare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPopup;