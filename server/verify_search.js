
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbhlpypcrlafbmgzaptq.supabase.co';
const supabaseKey = 'sb_publishable__3Ss_btyx8XgGp2kBzr5dA_ZOl2lB-Z';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
    const query = "백곡";
    console.log(`Searching for '${query}'...`);

    const { data, error } = await supabase
        .from('reservoirs')
        .select('*')
        .ilike('name', `%${query}%`);

    if (error) {
        console.error("Search Error:", error);
    } else {
        console.log(`Found ${data.length} results.`);
        console.log(data);
    }
}

testSearch();
