
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------
// ⚠️ IMPORTANT: REPLACE THESE WITH YOUR SUPABASE CREDENTIALS
// ---------------------------------------------------------
const SUPABASE_URL = 'https://jpbvwljesslubhacrtri.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYnZ3bGplc3NsdWJoYWNydHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzcwOTAsImV4cCI6MjA3OTc1MzA5MH0.LjFYJBO8rwmsB8bVPqw_6IgCYYgz_l7rMD7yUUVuZ5k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
