require('dotenv').config({ path: '../backend/.env' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    console.log('Testing connection to:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        const { data, error } = await supabase.from('event').select('id').limit(1);
        if (error) {
            console.error('Connection error:', error.message);
        } else {
            console.log('Connection successful! Data:', data);
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

test();
