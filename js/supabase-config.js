const SUPABASE_URL = 'https://rgyxuuaweuwgbekogfgb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneXh1dWF3ZXV3Z2Jla29nZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODIwOTcsImV4cCI6MjA5NzU1ODA5N30.cGN4u9TzRnXdAwKKt_M2QlZvbuMNrmPcWdvYEM1lmpU';

function initSupabase() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
