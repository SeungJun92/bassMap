
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// We need to look at src/supabase.ts to get the URL and KEY 
// OR we can just ask the user or assume they are public/anon ones.
// However, since we are in node, we can't import typescript files easily.
// I will reuse the credentials the user provided earlier to create a quick check script.

const supabaseUrl = 'https://hbhlpypcrlafbmgzaptq.supabase.co';
const supabaseKey = 'sb_publishable__3Ss_btyx8XgGp2kBzr5dA_ZOl2lB-Z';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("Checking connection to Supabase...");
    const { data, count, error } = await supabase
        .from('reservoirs')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error connecting:", error.message);
    } else {
        console.log(`Success! Found ${count} records in 'reservoirs' table.`);

        // Fetch a sample to verify content
        const sample = await supabase.from('reservoirs').select('name').limit(3);
        console.log("Sample data:", sample.data);
    }
}

verify();
