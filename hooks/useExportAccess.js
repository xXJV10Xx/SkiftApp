import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useExportAccess = () => {
  const [hasExportAccess, setHasExportAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkExportAccess();
  }, []);

  const checkExportAccess = async () => {
    try {
      // Hämta nuvarande användare
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setHasExportAccess(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Kontrollera om användaren har betalat för export
      const { data: userData, error } = await supabase
        .from('users')
        .select('has_paid_export')
        .eq('email', currentUser.email)
        .single();

      if (error) {
        console.error('Error checking export access:', error);
        setHasExportAccess(false);
      } else {
        setHasExportAccess(userData?.has_paid_export || false);
      }
    } catch (error) {
      console.error('Error in checkExportAccess:', error);
      setHasExportAccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasExportAccess, loading, user, refreshAccess: checkExportAccess };
};