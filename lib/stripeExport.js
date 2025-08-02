import { loadStripe } from '@stripe/stripe-js';

export const handleExportCheckout = async (userEmail) => {
  try {
    const stripe = await loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    const res = await fetch('/api/create-export-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'calendar-export',
        userEmail: userEmail 
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await res.json();
    
    const result = await stripe.redirectToCheckout({ sessionId: session.id });
    
    if (result.error) {
      console.error('Stripe checkout error:', result.error);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Export checkout error:', error);
    alert('Ett fel uppstod vid betalningen. Försök igen.');
  }
};

export const checkExportAccess = async (userId) => {
  try {
    const res = await fetch(`/api/check-export-access?userId=${userId}`);
    const data = await res.json();
    return data.hasAccess;
  } catch (error) {
    console.error('Error checking export access:', error);
    return false;
  }
};

export const generateCalendarExport = async (filters) => {
  try {
    const res = await fetch('/api/generate-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });

    if (!res.ok) {
      throw new Error('Failed to generate export');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalender-export-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export generation error:', error);
    alert('Ett fel uppstod vid genereringen av exporten.');
  }
};