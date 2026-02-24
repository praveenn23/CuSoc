const supabase = require('../config/supabase');

// ── GET /admin/stats ────────────────────────────────────────────────────────
const getStats = async (req, res) => {
    try {
        const { data: event, error: eventErr } = await supabase
            .from('event')
            .select('*')
            .maybeSingle();
        if (eventErr) throw eventErr;

        const { count, error: countErr } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true });
        if (countErr) throw countErr;

        return res.json({
            success: true,
            stats: {
                totalSeats: event?.total_seats ?? 0,
                bookedSeats: event?.booked_seats ?? 0,
                remainingSeats: (event?.total_seats ?? 0) - (event?.booked_seats ?? 0),
                totalRegistrations: count ?? 0,
            },
        });
    } catch (err) {
        console.error('getStats error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// ── GET /admin/registrations ────────────────────────────────────────────────
const getRegistrations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json({ success: true, registrations: data });
    } catch (err) {
        console.error('getRegistrations error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};

// ── DELETE /admin/registrations/:id ─────────────────────────────────────────
const deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Registration ID required' });

        // ── 1. Confirm the registration exists ─────────────────────────────────
        const { data: reg, error: fetchErr } = await supabase
            .from('registrations')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!reg) return res.status(404).json({ error: 'Registration not found' });

        // ── 2. Delete the registration row ─────────────────────────────────────
        const { error: delErr } = await supabase
            .from('registrations')
            .delete()
            .eq('id', id);

        if (delErr) throw delErr;

        // ── 3. Decrement booked_seats directly — NO RPC needed ─────────────────
        // Fetch current count to calculate new value (floor at 0)
        const { data: eventRow, error: evFetchErr } = await supabase
            .from('event')
            .select('id, booked_seats')
            .maybeSingle();

        if (evFetchErr) {
            console.error('Could not fetch event for seat decrement:', evFetchErr.message);
        } else if (eventRow) {
            const newCount = Math.max(0, (eventRow.booked_seats || 0) - 1);
            const { error: updateErr } = await supabase
                .from('event')
                .update({ booked_seats: newCount })
                .eq('id', eventRow.id);

            if (updateErr) {
                console.error('booked_seats decrement error:', updateErr.message);
            } else {
                console.log(`✅ booked_seats decremented → ${newCount}`);
            }
        }

        return res.json({ success: true, message: 'Registration deleted successfully' });
    } catch (err) {
        console.error('deleteRegistration error:', err.message);
        return res.status(500).json({ error: 'Failed to delete registration' });
    }
};

// ── GET /admin/event ─────────────────────────────────────────────────────────
const getEvent = async (req, res) => {
    try {
        const { data, error } = await supabase.from('event').select('*').maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Event not found' });
        return res.json({ success: true, event: data });
    } catch (err) {
        console.error('admin getEvent error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch event' });
    }
};

// ── PUT /admin/event ─────────────────────────────────────────────────────────
const updateEvent = async (req, res) => {
    try {
        const { title, description, date, time, venue, total_seats } = req.body;

        if (!title || !date || !venue || !total_seats) {
            return res.status(400).json({ error: 'title, date, venue, and total_seats are required' });
        }

        if (isNaN(parseInt(total_seats)) || parseInt(total_seats) < 1) {
            return res.status(400).json({ error: 'total_seats must be a positive number' });
        }

        const { data: existing, error: fetchErr } = await supabase
            .from('event')
            .select('id, booked_seats')
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!existing) return res.status(404).json({ error: 'Event not found' });

        const newTotalSeats = parseInt(total_seats);
        if (newTotalSeats < existing.booked_seats) {
            return res.status(400).json({
                error: `Cannot set total seats (${newTotalSeats}) below already booked seats (${existing.booked_seats})`,
            });
        }

        const { data: updated, error: updateErr } = await supabase
            .from('event')
            .update({
                title: title.trim(),
                description: description?.trim() || null,
                date,
                time: time?.trim() || null,
                venue: venue.trim(),
                total_seats: newTotalSeats,
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        return res.json({ success: true, event: updated, message: 'Event updated successfully' });
    } catch (err) {
        console.error('updateEvent error:', err.message);
        return res.status(500).json({ error: 'Failed to update event' });
    }
};

// ── POST /admin/login ────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
    const { password } = req.body;
    const secret = process.env.ADMIN_SECRET_KEY;

    if (!password) return res.status(400).json({ error: 'Password required' });
    if (!secret) return res.status(500).json({ error: 'Admin not configured on server' });

    if (password !== secret) {
        return res.status(401).json({ error: 'Invalid admin password' });
    }

    return res.json({ success: true, token: secret });
};

module.exports = { getStats, getRegistrations, deleteRegistration, getEvent, updateEvent, adminLogin };
