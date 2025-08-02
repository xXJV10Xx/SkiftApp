import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Auth helper functions
export const auth = {
  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    return { data, error };
  },

  // Sign in with Apple
  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    return { data, error };
  },

  // Sign in with Facebook
  async signInWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email',
      }
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Create or update user profile after OAuth sign-in
  async createUserProfile(user: any, additionalData?: {
    company_id?: string;
    department_id?: string;
    team_id?: string;
  }) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('users')
          .update({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            is_online: true,
            last_seen: new Date().toISOString(),
            ...additionalData
          })
          .eq('id', user.id)
          .select()
          .single();

        return { data, error };
      } else {
        // Create new user
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            is_online: true,
            last_seen: new Date().toISOString(),
            has_calendar_export: false,
            ...additionalData
          })
          .select()
          .single();

        return { data, error };
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      return { data: null, error };
    }
  }
};

// Database helper functions
export const db = {
  // Generic select function
  async select(table: string, columns = '*', filters?: Record<string, any>) {
    let query = supabase.from(table).select(columns);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    return await query;
  },

  // Generic insert function
  async insert(table: string, data: Record<string, any>) {
    return await supabase.from(table).insert(data).select().single();
  },

  // Generic update function
  async update(table: string, data: Record<string, any>, filters: Record<string, any>) {
    let query = supabase.from(table).update(data);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return await query.select().single();
  },

  // Generic delete function
  async delete(table: string, filters: Record<string, any>) {
    let query = supabase.from(table).delete();
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return await query;
  }
};

// Real-time subscription helpers
export const realtime = {
  // Subscribe to table changes
  subscribeToTable(
    table: string, 
    callback: (payload: any) => void, 
    filters?: Record<string, any>
  ) {
    let channel = supabase.channel(`${table}-changes`);
    
    let config: any = {
      event: '*',
      schema: 'public',
      table: table
    };

    if (filters) {
      const filterStrings = Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`);
      config.filter = filterStrings.join(',');
    }

    return channel
      .on('postgres_changes', config, callback)
      .subscribe();
  },

  // Subscribe to specific events
  subscribeToInserts(table: string, callback: (payload: any) => void, filters?: Record<string, any>) {
    let channel = supabase.channel(`${table}-inserts`);
    
    let config: any = {
      event: 'INSERT',
      schema: 'public',
      table: table
    };

    if (filters) {
      const filterStrings = Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`);
      config.filter = filterStrings.join(',');
    }

    return channel
      .on('postgres_changes', config, callback)
      .subscribe();
  },

  subscribeToUpdates(table: string, callback: (payload: any) => void, filters?: Record<string, any>) {
    let channel = supabase.channel(`${table}-updates`);
    
    let config: any = {
      event: 'UPDATE',
      schema: 'public',
      table: table
    };

    if (filters) {
      const filterStrings = Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`);
      config.filter = filterStrings.join(',');
    }

    return channel
      .on('postgres_changes', config, callback)
      .subscribe();
  },

  subscribeToDeletes(table: string, callback: (payload: any) => void, filters?: Record<string, any>) {
    let channel = supabase.channel(`${table}-deletes`);
    
    let config: any = {
      event: 'DELETE',
      schema: 'public',
      table: table
    };

    if (filters) {
      const filterStrings = Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`);
      config.filter = filterStrings.join(',');
    }

    return channel
      .on('postgres_changes', config, callback)
      .subscribe();
  }
};

// Storage helpers (for file uploads)
export const storage = {
  // Upload file
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    return { data, error };
  },

  // Get public URL
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return { data, error };
  },

  // List files
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);
    
    return { data, error };
  }
};

export default supabase;