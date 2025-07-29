import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzftqiuphsezewiydzog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZnRxaXVwaHNlemV3aXlkem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTc5OTQsImV4cCI6MjA2OTE5Mzk5NH0.CK3pKtGCSgwfsY8Q8NkhVvscqXT1P_yT_-arv8-qWm0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});