const supabase = require('../config/supabase');

/**
 * GET /event — fetch the single event row
 */
const getEvent = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('event')
            .select('*')
            .maybeSingle(); // returns null (not an error) when 0 rows exist

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                error: 'No event found. Please run the Supabase seed SQL in supabase/schema.sql first.',
            });
        }

        return res.status(200).json({ success: true, event: data });
    } catch (err) {
        console.error('getEvent error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch event details' });
    }
};

module.exports = { getEvent };
