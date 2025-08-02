import React, { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PremiumGate = ({ children, feature, fallback }) => {
  const user = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error('Fel vid kontroll av premium-status:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-600 mb-2">Logga in för att använda denna funktion</p>
      </div>
    );
  }

  if (!isPremium) {
    return fallback || (
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200 relative overflow-hidden">
        <div className="absolute top-2 right-2">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            PREMIUM
          </span>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🔒 {feature || 'Premium-funktion'}
          </h3>
          <p className="text-green-700 text-sm">
            Denna funktion kräver Premium för att låsas upp.
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-green-600 mb-4">
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Kalenderexport</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Påminnelser</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>Ingen reklam</span>
          </div>
        </div>
        
        <button 
          onClick={handleBuyPremium}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Uppgradera till Premium (99 kr)
        </button>
        
        {/* Blur overlay för låst innehåll */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white bg-opacity-30 pointer-events-none"></div>
      </div>
    );
  }

  return children;
};

// Hook för att enkelt kolla premium-status
export const usePremium = () => {
  const user = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error('Fel vid kontroll av premium-status:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, loading, checkPremiumStatus };
};

export default PremiumGate;