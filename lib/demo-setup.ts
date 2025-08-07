import { supabase } from './supabase';

export async function createDemoAccount() {
  try {
    // Create a demo account
    const { data, error } = await supabase.auth.signUp({
      email: 'demo@skiftappen.se',
      password: 'demo123456',
    });

    if (error) {
      console.error('Error creating demo account:', error);
      return { error };
    }

    console.log('✅ Demo account created successfully!');
    console.log('Email: demo@skiftappen.se');
    console.log('Password: demo123456');
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Failed to create demo account:', error);
    return { error };
  }
}

export async function signInDemo() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@skiftappen.se',
      password: 'demo123456',
    });

    if (error) {
      console.error('Error signing in demo account:', error);
      return { error };
    }

    console.log('✅ Demo account signed in successfully!');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Failed to sign in demo account:', error);
    return { error };
  }
} 