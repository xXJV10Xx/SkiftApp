import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const useOnlineStatus = () => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('online_status')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating online status:', error);
      }
    } catch (err) {
      console.error('Unexpected error updating online status:', err);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      updateOnlineStatus(true);
      startHeartbeat();
    } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App went to background
      updateOnlineStatus(false);
      stopHeartbeat();
    }

    appStateRef.current = nextAppState;
  };

  const startHeartbeat = () => {
    if (intervalRef.current) return; // Already running

    // Update online status every 30 seconds while app is active
    intervalRef.current = setInterval(() => {
      updateOnlineStatus(true);
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!user) return;

    // Set initial online status
    updateOnlineStatus(true);
    startHeartbeat();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      subscription?.remove();
      stopHeartbeat();
      updateOnlineStatus(false);
    };
  }, [user]);

  return {
    updateOnlineStatus
  };
};