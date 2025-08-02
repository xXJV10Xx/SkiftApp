import React from 'react';
import { useUser } from '@supabase/auth-helpers-react';

const BuyPremium = () => {
  const user = useUser();

  const handleBuy = async () => {
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

  return (
    <button onClick={handleBuy} className="bg-green-600 text-white px-4 py-2 rounded">
      Exportera till kalender (99 kr)
    </button>
  );
};

export default BuyPremium;