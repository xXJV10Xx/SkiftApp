import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://fsefeherdbtsddqimjco.supabase.co',
  'YOUR_SUPABASE_ANON_KEY_HERE'
);