import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hbhlpypcrlafbmgzaptq.supabase.co', 'sb_publishable__3Ss_btyx8XgGp2kBzr5dA_ZOl2lB-Z');
const { count, error } = await supabase.from('reservoirs').select('*', { count: 'exact', head: true });
console.log({ count, error });
process.exit(0);
