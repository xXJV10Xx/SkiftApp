import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://fsefeherdbtsddqimjco.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg'
);