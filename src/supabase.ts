
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbhlpypcrlafbmgzaptq.supabase.co';
const supabaseKey = 'sb_publishable__3Ss_btyx8XgGp2kBzr5dA_ZOl2lB-Z';

export const supabase = createClient(supabaseUrl, supabaseKey);
