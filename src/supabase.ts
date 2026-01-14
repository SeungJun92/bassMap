import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbhlpypcrlafbmgzaptq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaGxweXBjcmxhZmJtZ3phcHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTcxMTUsImV4cCI6MjA4Mzc5MzExNX0.ngg4EG7rBpVE21AcArejlM5jNUU3BOQiRtjVzPwDBa8';

export const supabase = createClient(supabaseUrl, supabaseKey);
