import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    // Test basic connection by getting the current user session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Session:', session ? 'User logged in' : 'No active session');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
} 