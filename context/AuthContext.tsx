import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  registerForPushNotificationsAsync, 
  updateUserFCMToken, 
  clearUserFCMToken,
  setupNotificationListeners,
  removeNotificationListeners
} from '../lib/notifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationListeners, setNotificationListeners] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        // Setup notification listeners when user signs in
        if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
          const listeners = setupNotificationListeners();
          setNotificationListeners(listeners);

          // Register for push notifications and update FCM token
          const fcmToken = await registerForPushNotificationsAsync();
          if (fcmToken) {
            await updateUserFCMToken(session.user.id, fcmToken);
          }
        }

        // Create profile if user signs up
        if (_event === 'SIGNED_UP') {
          const username = session.user.email?.split('@')[0] || 'user';
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              username,
              avatar_url: session.user.user_metadata?.avatar_url,
            });

          if (error) {
            console.error('Error creating user profile:', error);
          }
        }
      } else if (_event === 'SIGNED_OUT') {
        // Clean up on sign out
        if (notificationListeners) {
          removeNotificationListeners(notificationListeners);
          setNotificationListeners(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'skiftappen://auth/callback',
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear FCM token before signing out
    if (user) {
      await clearUserFCMToken(user.id);
    }
    
    // Clean up notification listeners
    if (notificationListeners) {
      removeNotificationListeners(notificationListeners);
      setNotificationListeners(null);
    }
    
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'skiftappen://auth/reset-password',
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};