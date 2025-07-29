import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = "https://fbjgyeebdfcpcpzomyjo.supabase.co";
// const supabaseAnonKey =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiamd5ZWViZGZjcGNwem9teWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA0NTcsImV4cCI6MjA2OTMzNjQ1N30.M98rIucfwEVjduwfQBjTJAPFXFvc1islhT2T_rXiA3w";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
