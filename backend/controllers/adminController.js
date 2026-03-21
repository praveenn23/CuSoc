const supabase = require('../config/supabase');
const transporter = require('../config/mailer');

// ── GET /admin/stats ────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    // Run all 3 queries in parallel for speed
    const [
      { data: event, error: eventErr },
      { count: totalCount, error: countErr },
      { count: attendedCount, error: attendedErr },
    ] = await Promise.all([
      supabase.from('event').select('*').maybeSingle(),
      supabase.from('registrations').select('*', { count: 'exact', head: true }),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).not('attended_at', 'is', null),
    ]);

    if (eventErr) throw eventErr;
    if (countErr) throw countErr;
    // attendedErr is non-fatal — attended_at column might not exist on some envs
    if (attendedErr) console.warn('attended_at count query failed (column may be missing):', attendedErr.message);

    return res.json({
      success: true,
      stats: {
        totalSeats: event?.total_seats ?? 0,
        bookedSeats: event?.booked_seats ?? 0,
        remainingSeats: (event?.total_seats ?? 0) - (event?.booked_seats ?? 0),
        totalRegistrations: totalCount ?? 0,
        attendedCount: attendedErr ? 0 : (attendedCount ?? 0),
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
      .order('created_at', { ascending: false })
      .range(0, 4999); // Supabase default cap is 1000 — override to allow up to 5000

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

    // ── 3. (Removed manual seat decrement — handled automatically via DB trigger trg_sync_booked_seats) ────────

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
    const { title, description, date, time, venue, total_seats,
      about_text, event_sections, speakers, partners } = req.body;

    if (!title || !date || !venue || !total_seats) {
      return res.status(400).json({ error: 'title, date, venue, and total_seats are required' });
    }

    if (isNaN(parseInt(total_seats)) || parseInt(total_seats) < 1) {
      return res.status(400).json({ error: 'total_seats must be a positive number' });
    }

    // ── Validate array fields ──────────────────────────────────────────────
    if (event_sections !== undefined && !Array.isArray(event_sections)) {
      return res.status(400).json({ error: 'event_sections must be an array' });
    }
    if (speakers !== undefined && !Array.isArray(speakers)) {
      return res.status(400).json({ error: 'speakers must be an array' });
    }
    if (partners !== undefined && !Array.isArray(partners)) {
      return res.status(400).json({ error: 'partners must be an array' });
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

    // Build update payload — only include optional fields if sent by the client
    const updatePayload = {
      title: title.trim(),
      description: description?.trim() || null,
      date,
      time: time?.trim() || null,
      venue: venue.trim(),
      total_seats: newTotalSeats,
    };

    if (about_text !== undefined) updatePayload.about_text = about_text?.trim() || null;
    if (event_sections !== undefined) updatePayload.event_sections = event_sections;
    if (speakers !== undefined) updatePayload.speakers = speakers;
    if (partners !== undefined) updatePayload.partners = partners;

    const { data: updated, error: updateErr } = await supabase
      .from('event')
      .update(updatePayload)
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

// ── POST /admin/send-tickets ─────────────────────────────────────────────────
// Sends a formal ticket confirmation email to every registered participant.
// Only sends to those where ticket_sent_at IS NULL (not yet emailed).
const sendTickets = async (req, res) => {
  try {
    // 1. Fetch only registrations that have NOT been sent a ticket yet
    const { data: registrations, error: regErr } = await supabase
      .from('registrations')
      .select('*')
      .is('ticket_sent_at', null)          // ← DEDUP: skip already-sent
      .order('created_at', { ascending: true })
      .range(0, 4999); // bypass Supabase default 1000-row cap
    if (regErr) throw regErr;

    // Also get total count for the response summary
    const { count: totalCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    const alreadySent = (totalCount ?? 0) - (registrations?.length ?? 0);

    if (!registrations || registrations.length === 0) {
      return res.json({
        success: true,
        message: `All ${totalCount} participants have already received their ticket emails. No new emails sent.`,
        sent: 0, failed: 0, skipped: alreadySent,
      });
    }

    const targetRegistrations = registrations;

    // 2. Fetch event details
    const { data: event, error: evErr } = await supabase
      .from('event')
      .select('*')
      .maybeSingle();
    if (evErr) throw evErr;
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const eventTime = event.time || new Date(event.date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    // 3. Send emails with concurrency cap of 5
    const CONCURRENCY = 5;
    const results = { sent: 0, failed: 0, errors: [] };

    for (let i = 0; i < targetRegistrations.length; i += CONCURRENCY) {
      const chunk = targetRegistrations.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (reg) => {
          // Last 4 chars of UUID (uppercase)
          const ticketNo = `EVT-${reg.id.slice(-4).toUpperCase()}`;
          const department = reg.department || 'N/A';

          const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Google Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 28px rgba(60,64,67,.14);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:36px 32px;text-align:center;">
            <div style="display:inline-block;background:white;border-radius:12px;padding:8px 18px;margin-bottom:16px;">
              <span style="font-size:24px;font-weight:700;letter-spacing:-1px;">
                <span style="color:#ea4335">C</span><span style="color:#fbbc04">u</span><span style="color:#34a853">S</span><span style="color:#ea4335">O</span><span style="color:#fbbc04">C</span>
              </span>
            </div>
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;line-height:1.3;">🎟 Event Ticket Confirmation</h1>
            <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px;">Your ticket has been issued successfully!</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="background:#e8f0fe;padding:20px 32px;text-align:center;border-bottom:1px solid #c5d8fb;">
            <p style="margin:0;color:#1a73e8;font-size:15px;font-weight:600;">Dear ${reg.name},</p>
            <p style="margin:6px 0 0;color:#3c4043;font-size:14px;line-height:1.6;">
              Greetings from the Organizing Team!<br />
              Thank you for registering for <strong>${event.title}</strong>.<br />
              Your registration has been successfully confirmed.
            </p>
          </td>
        </tr>

        <!-- Ticket Card -->
        <tr>
          <td style="padding:28px 32px 8px;">
            <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#202124;">🎫 Event Ticket Details</h2>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f8f9fa;border-radius:12px;border:2px dashed #c5d8fb;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <!-- Ticket No -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                    <tr>
                      <td width="140" style="font-size:12px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;padding-bottom:2px;">Ticket No.</td>
                      <td style="font-size:18px;font-weight:700;color:#1a73e8;letter-spacing:1px;">${ticketNo}</td>
                    </tr>
                  </table>
                  <hr style="border:none;border-top:1px solid #e0e0e0;margin:0 0 14px;" />
                  <!-- Name -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td width="140" style="font-size:12px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;">Name</td>
                      <td style="font-size:14px;font-weight:600;color:#202124;">${reg.name}</td>
                    </tr>
                  </table>
                  <!-- Department -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td width="140" style="font-size:12px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;">Department</td>
                      <td style="font-size:14px;font-weight:500;color:#202124;">${department}</td>
                    </tr>
                  </table>
                  <!-- University Email -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="140" style="font-size:12px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;">University Email</td>
                      <td style="font-size:14px;font-weight:500;color:#202124;">${reg.email}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Event Details -->
        <tr>
          <td style="padding:20px 32px 8px;">
            <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#202124;">📌 Event Details</h2>
            <!-- Date -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td width="40" valign="top">
                  <div style="width:36px;height:36px;background:#e8f0fe;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📅</div>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Date</div>
                  <div style="font-size:14px;font-weight:500;color:#202124;">${eventDate}</div>
                </td>
              </tr>
            </table>
            <!-- Time -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td width="40" valign="top">
                  <div style="width:36px;height:36px;background:#e6f4ea;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">🕐</div>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Time</div>
                  <div style="font-size:14px;font-weight:500;color:#202124;">${eventTime}</div>
                </td>
              </tr>
            </table>
            <!-- Venue -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td width="40" valign="top">
                  <div style="width:36px;height:36px;background:#fce8e6;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📍</div>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Venue</div>
                  <div style="font-size:14px;font-weight:500;color:#202124;">${event.venue}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Important Instructions -->
        <tr>
          <td style="padding:16px 32px 24px;">
            <div style="background:#fffde7;border-radius:12px;padding:18px 22px;border:1px solid #ffe082;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#e65100;">📋 Important Instructions</p>
              <ul style="margin:0;padding-left:18px;color:#3c4043;font-size:13px;line-height:2;">
                <li>This email serves as your <strong>official event entry ticket</strong>.</li>
                <li>The Ticket Number is generated from the last 4 digits of your unique registration UUID.</li>
                <li>Your University Email ID will be <strong>verified at the venue</strong> by the organizing team.</li>
                <li>Duty Leave (DL) attendance will be granted only after successful verification at the venue.</li>
                <li>Please carry your <strong>University ID Card</strong> for identity confirmation.</li>
                <li>Kindly ensure that the above details are correct. In case of any discrepancy, contact the organizing team <strong>before the event date</strong>.</li>
              </ul>
            </div>
          </td>
        </tr>

        <!-- ACO Approved Badge -->
        <tr>
          <td style="padding:0 32px 20px;">
            <div style="background:#e8f5e9;border-radius:12px;padding:16px 20px;border:1px solid #a5d6a7;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40" valign="top" style="text-align:center;font-size:22px;padding-top:2px;">✅</td>
                  <td style="padding-left:12px;vertical-align:top;">
                    <div style="font-size:13px;font-weight:700;color:#1b5e20;margin-bottom:4px;">ACO Approval — University Level Co-Curricular Club</div>
                    <div style="font-size:12px;color:#2e7d32;line-height:1.7;margin-bottom:12px;">
                      For applying Duty Leave (DL) for this event, kindly take prior approval from ACO / Assistant Dean OAA on the mentioned category's duty leave format.
                    </div>
                    <a href="https://drive.google.com/file/d/11oQHrEJwYyaD52yndoVyRtQ0MGvCktJx/view?usp=sharing"
                      target="_blank"
                      style="display:inline-block;background:#1b5e20;color:#ffffff;font-size:12px;font-weight:700;padding:9px 18px;border-radius:8px;text-decoration:none;letter-spacing:.3px;">
                      📄 View DL Format Document
                    </a>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- WhatsApp Group -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#e7f7ee;border-radius:12px;padding:18px 22px;border:1px solid #b2dfdb;text-align:center;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#00695c;">💬 Join Our WhatsApp Group</p>
              <p style="margin:0 0 14px;font-size:13px;color:#3c4043;line-height:1.6;">
                Stay updated with event announcements, schedules, and last-minute changes.<br />
                Join our official WhatsApp group for participants:
              </p>
              <a href="https://chat.whatsapp.com/Jo4tCxHlsmfIU5wwL2rcnb?mode=gi_t"
                target="_blank"
                style="display:inline-block;background:#25d366;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none;letter-spacing:.3px;">
                🟢 Join WhatsApp Group
              </a>
              <p style="margin:10px 0 0;font-size:11px;color:#9aa0a6;">
                Or copy link: chat.whatsapp.com/Jo4tCxHlsmfIU5wwL2rcnb
              </p>
            </div>
          </td>
        </tr>

        <!-- Best Regards -->
        <tr>
          <td style="padding:0 32px 24px;background:#f8f9fa;border-top:1px solid #e0e0e0;">
            <p style="margin:16px 0 6px;font-size:14px;font-weight:600;color:#202124;">We look forward to your active participation!</p>
            <p style="margin:0;font-size:13px;color:#5f6368;line-height:2;">
              Best Regards,<br />
              <strong>CuSOC Organizing Team</strong><br />
              ${event.title}<br />
              Chandigarh University Student Chapter<br />
              <span style="color:#9aa0a6;font-size:12px;">Approved under: University Level (Co-Curricular Clubs) | ACO Certified</span>
            </p>
          </td>
        </tr>

        <!-- Footer strip -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#ea4335 25%,#fbbc04 25% 50%,#34a853 50% 75%,#1a73e8 75%);"></td>
        </tr>
        <tr>
          <td style="padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9aa0a6;">
              © ${new Date().getFullYear()} CuSOC, Chandigarh University — See you there! 🎉
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

          try {
            await transporter.sendMail({
              from: `"CuSOC Events" <${process.env.EMAIL_FROM}>`,
              to: reg.email,
              subject: `🎟 Your Event Ticket Confirmation – CUSOC | ${ticketNo}`,
              html,
            });
            results.sent++;

            // ── Stamp ticket_sent_at so this person is never emailed again ──
            await supabase
              .from('registrations')
              .update({ ticket_sent_at: new Date().toISOString() })
              .eq('id', reg.id);

          } catch (mailErr) {
            results.failed++;
            results.errors.push({ email: reg.email, error: mailErr.message });
            console.error(`Ticket email failed for ${reg.email}:`, mailErr.message);
          }
        })
      );
    }

    const skipped = alreadySent;
    console.log(`✅ Ticket blast done — sent: ${results.sent}, failed: ${results.failed}, skipped (already sent): ${skipped}`);
    return res.json({
      success: true,
      message: `Tickets sent to ${results.sent} new participant(s). ${skipped > 0 ? `${skipped} already emailed (skipped).` : ''} Failed: ${results.failed}.`,
      sent: results.sent,
      failed: results.failed,
      skipped,
      ...(results.errors.length ? { errors: results.errors } : {}),
    });
  } catch (err) {
    console.error('sendTickets error:', err.message);
    return res.status(500).json({ error: 'Failed to send ticket emails.' });
  }
};

// ── POST /admin/mark-attendance ──────────────────────────────────────────────
// Accepts { ticketCode: "XXXX" } (the last 4 chars of the registration UUID).
// e.g. UUID ending in "...a1b2" → ticketCode = "A1B2" → ticket email shows EVT-A1B2
const markAttendance = async (req, res) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode || typeof ticketCode !== 'string') {
      return res.status(400).json({ error: 'ticketCode is required.' });
    }

    const code = ticketCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{4}$/.test(code)) {
      return res.status(400).json({ error: 'Ticket code must be exactly 4 alphanumeric characters.' });
    }

    // ── 1. Find registration by ticket code ────────────────────────────────
    // Strategy: try the fast DB-level RPC first.
    // If the SQL function doesn't exist yet in Supabase, fall back to
    // fetching all registrations and filtering by last 4 UUID chars in JS.
    let reg = null;

    const { data: rpcData, error: rpcErr } = await supabase
      .rpc('find_by_ticket_code', { ticket: code });

    if (!rpcErr) {
      // ✅ RPC succeeded — use its result
      reg = rpcData?.[0] ?? null;
    } else {
      // ⚠️ RPC not available yet — fallback: fetch all & filter in JS
      console.warn('find_by_ticket_code RPC unavailable, using fallback:', rpcErr.message);
      const { data: allRegs, error: fetchErr } = await supabase
        .from('registrations')
        .select('id, name, email, uid, type, cluster, department, attended_at')
        .range(0, 4999);

      if (fetchErr) throw fetchErr;

      // Match last 4 chars of UUID (case-insensitive)
      reg = (allRegs || []).find(
        (r) => r.id.replace(/-/g, '').slice(-4).toUpperCase() === code
      ) ?? null;
    }

    if (!reg) {
      return res.status(404).json({
        error: `No registration found with ticket code EVT-${code}. Please double-check the code.`,
      });
    }

    // ── 2. Duplicate scan check ─────────────────────────────────────────────
    if (reg.attended_at) {
      return res.status(409).json({
        error: 'Already marked present!',
        alreadyPresent: true,
        registration: {
          name: reg.name,
          email: reg.email,
          department: reg.department,
          cluster: reg.cluster,
          attendedAt: reg.attended_at,
          ticketCode: `EVT-${code}`,
        },
      });
    }

    // ── 3. Mark as attended ─────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('registrations')
      .update({ attended_at: new Date().toISOString() })
      .eq('id', reg.id);

    if (updateErr) throw updateErr;

    console.log(`✅ Attendance marked for ${reg.name} (EVT-${code})`);
    return res.json({
      success: true,
      message: `Attendance marked for ${reg.name}`,
      registration: {
        name: reg.name,
        email: reg.email,
        department: reg.department,
        cluster: reg.cluster,
        ticketCode: `EVT-${code}`,
      },
    });
  } catch (err) {
    console.error('markAttendance error:', err.message);
    return res.status(500).json({ error: 'Failed to mark attendance.' });
  }
};

module.exports = { getStats, getRegistrations, deleteRegistration, getEvent, updateEvent, adminLogin, sendTickets, markAttendance };
