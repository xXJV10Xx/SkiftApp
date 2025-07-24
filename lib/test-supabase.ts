import { supabase } from './supabase';

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

export async function testAuth(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth test failed:', error);
      return false;
    }
    
    console.log('✅ Auth system working, session:', session ? 'exists' : 'none');
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}