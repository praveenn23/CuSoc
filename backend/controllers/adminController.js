const Registration = require('../models/Registration');
const Event        = require('../models/Event');
const transporter  = require('../config/mailer');

// ── GET /admin/stats ────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [event, totalCount, attendedCount] = await Promise.all([
      Event.findOne().lean(),
      Registration.countDocuments(),
      Registration.countDocuments({ attendedAt: { $ne: null } }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalSeats:         event?.totalSeats  ?? 0,
        bookedSeats:        event?.bookedSeats ?? 0,
        remainingSeats:     (event?.totalSeats ?? 0) - (event?.bookedSeats ?? 0),
        totalRegistrations: totalCount,
        attendedCount,
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
    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    // Apply toJSON-like transform for snake_case compatibility
    const mapped = registrations.map(r => ({
      ...r,
      id:             r._id,
      created_at:     r.createdAt,
      ticket_sent_at: r.ticketSentAt,
      attended_at:    r.attendedAt,
    }));

    return res.json({ success: true, registrations: mapped });
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

    const reg = await Registration.findByIdAndDelete(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    // Decrement booked seats
    await Event.findOneAndUpdate({}, { $inc: { bookedSeats: -1 } });

    return res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (err) {
    console.error('deleteRegistration error:', err.message);
    return res.status(500).json({ error: 'Failed to delete registration' });
  }
};

// ── GET /admin/event ─────────────────────────────────────────────────────────
const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json({ success: true, event });
  } catch (err) {
    console.error('admin getEvent error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// ── PUT /admin/event ─────────────────────────────────────────────────────────
const updateEvent = async (req, res) => {
  try {
    const {
      title, description, date, time, venue, total_seats,
      about_text, event_sections, speakers, partners,
    } = req.body;

    if (!title || !date || !venue || !total_seats) {
      return res.status(400).json({ error: 'title, date, venue, and total_seats are required' });
    }

    const newTotalSeats = parseInt(total_seats);
    if (isNaN(newTotalSeats) || newTotalSeats < 1) {
      return res.status(400).json({ error: 'total_seats must be a positive number' });
    }

    if (event_sections !== undefined && !Array.isArray(event_sections)) {
      return res.status(400).json({ error: 'event_sections must be an array' });
    }
    if (speakers !== undefined && !Array.isArray(speakers)) {
      return res.status(400).json({ error: 'speakers must be an array' });
    }
    if (partners !== undefined && !Array.isArray(partners)) {
      return res.status(400).json({ error: 'partners must be an array' });
    }

    const existing = await Event.findOne();
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    if (newTotalSeats < existing.bookedSeats) {
      return res.status(400).json({
        error: `Cannot set total seats (${newTotalSeats}) below already booked seats (${existing.bookedSeats})`,
      });
    }

    const updatePayload = {
      title:      title.trim(),
      description: description?.trim() || null,
      date,
      time:       time?.trim() || null,
      venue:      venue.trim(),
      totalSeats: newTotalSeats,
    };

    if (about_text     !== undefined) updatePayload.aboutText     = about_text?.trim() || null;
    if (event_sections !== undefined) updatePayload.eventSections = event_sections;
    if (speakers       !== undefined) updatePayload.speakers      = speakers;
    if (partners       !== undefined) updatePayload.partners      = partners;

    const updated = await Event.findByIdAndUpdate(existing._id, updatePayload, { new: true });
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
  if (!secret)   return res.status(500).json({ error: 'Admin not configured on server' });
  if (password !== secret) return res.status(401).json({ error: 'Invalid admin password' });

  return res.json({ success: true, token: secret });
};

// ── POST /admin/send-tickets ─────────────────────────────────────────────────
const sendTickets = async (req, res) => {
  try {
    // Fetch registrations that have NOT been sent a ticket yet AND are approved
    const registrations = await Registration.find({ 
      ticketSentAt: { $exists: false },
      $or: [
        { evaluation_status: 'Approved' },
        { 'categories.status': 'Approved' }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(5000)
      .lean();

    const results = { sent: 0, failed: 0, errors: [] };
    const event = await Event.findOne().lean();
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const CONCURRENCY = 5;
    for (let i = 0; i < registrations.length; i += CONCURRENCY) {
      const chunk = registrations.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(async (reg) => {
        const ticketNo = `EVT-${reg._id.toString().slice(-4).toUpperCase()}`;
        const qrText   = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNo}`;
        
        const approvedCategories = Array.isArray(reg.categories)
            ? reg.categories.filter(c => (c.status || reg.evaluation_status || 'Pending') === 'Approved')
            : [];
        const categoryNames = approvedCategories.map(c => 
            (c.type || '').charAt(0).toUpperCase() + (c.type || '').slice(1)
        );

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Google Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 28px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:36px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">🎟 Event Ticket Confirmation</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#e8f0fe;padding:24px;text-align:center;border-bottom:1px solid #c5d8fb;">
            <p style="margin:0;color:#1a73e8;font-size:16px;font-weight:600;">Dear ${reg.name},</p>
            <p style="margin:8px 0 0;color:#3c4043;font-size:14px;">Your application for <strong>${event.title}</strong> has been approved!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <div style="background:#f8f9fa;border-radius:12px;border:2px dashed #c5d8fb;padding:24px;text-align:center;">
              <img src="${qrText}" width="160" height="160" style="margin-bottom:16px;border-radius:8px;" />
              <p style="margin:0;font-size:14px;color:#1a73e8;font-weight:700;letter-spacing:1px;">TICKET ID: ${ticketNo}</p>
              <h2 style="margin:16px 0 4px;font-size:20px;">${reg.name}</h2>
              <p style="margin:0;color:#5f6368;font-size:13px;">${reg.department || 'N/A'}</p>
              ${categoryNames.length > 0 ? `<p style="margin:12px 0 0;color:#137333;font-weight:700;font-size:14px;">Approved For: ${categoryNames.join(', ')}</p>` : ''}
            </div>
            <div style="margin-top:24px;">
              <h3 style="font-size:15px;color:#202124;">📌 Event Details</h3>
              <p style="margin:6px 0;font-size:13px;"><b>Venue:</b> ${event.venue}</p>
              <p style="margin:6px 0;font-size:13px;"><b>Instruction:</b> Please carry your University ID Card.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;text-align:center;background:#f8f9fa;border-top:1px solid #e0e0e0;">
            <p style="margin:0;font-size:12px;color:#9aa0a6;">© ABHYUTTHANAM, Chandigarh University</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        try {
          await transporter.sendMail({
            from: `"ABHYUTTHANAM" <${process.env.EMAIL_FROM}>`,
            to: reg.email,
            subject: `🎟 Your Event Ticket Confirmation – ABHYUTTHANAM | ${ticketNo}`,
            html,
          });
          results.sent++;
          await Registration.findByIdAndUpdate(reg._id, { ticketSentAt: new Date() });
        } catch (mailErr) {
          results.failed++;
          results.errors.push({ email: reg.email, error: mailErr.message });
        }
      }));
    }

    return res.json({
      success: true,
      message: `Tickets sent to ${results.sent} participant(s). Failed: ${results.failed}.`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    });
  } catch (err) {
    console.error('sendTickets error:', err.stack);
    return res.status(500).json({ error: `Failed to send tickets: ${err.message}` });
  }
};

const sendTestTicket = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Test email is required' });

    const event = await Event.findOne().lean() || { title: 'ABHYUTTHANAM Test', venue: 'Main Arena', date: new Date() };
    const sample = await Registration.findOne({ categories: { $elemMatch: { status: 'Approved' } } }).lean();
    
    const reg = sample || { name: 'Test Administrator', email: email, department: 'Admin Office', uid: 'ADMIN-TEST' };
    const ticketNo = 'TEST-0000';
    const qrText   = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNo}`;
    
    // Inline template for now to ensure it works, will refactor fully later if needed
    const html = `<html><body><h1>Test Ticket - ${event.title}</h1><p>Welcome ${reg.name}</p></body></html>`; 

    await transporter.sendMail({
      from: `"ABHYUTTHANAM (Test Mode)" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `[TEST TICKET] Your Event Ticket – ABHYUTTHANAM`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; max-width: 500px">
          <h2>🎟 Test Ticket</h2>
          <p>This is a preview of the ticket for <b>${event.title}</b>.</p>
          <hr />
          <img src="${qrText}" width="150" />
          <h3>Name: ${reg.name}</h3>
          <p>UID: ${reg.uid || 'N/A'}</p>
          <p>Venue: ${event.venue}</p>
        </div>`
    });

    return res.json({ success: true, message: `Test ticket sent to ${email}` });
  } catch (err) {
    console.error('sendTestTicket error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { ticketCode } = req.body;
    const code = ticketCode?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'Ticket code required' });

    const registrations = await Registration.find().lean().limit(10000);
    const reg = registrations.find(r => r._id.toString().slice(-4).toUpperCase() === code);

    if (!reg) return res.status(404).json({ error: `Not found: ${code}` });
    if (reg.attendedAt) return res.status(400).json({ error: 'Already marked present' });

    await Registration.findByIdAndUpdate(reg._id, { attendedAt: new Date() });
    return res.json({ success: true, message: `Checked in: ${reg.name}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── PUT /admin/registrations/:id/evaluation ─────────────────────────────────
const updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, categoryIndex } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Missing id or status' });
    }

    const reg = await Registration.findById(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    let updatePayload = {};

    if (categoryIndex !== undefined && categoryIndex !== null) {
      const idx = parseInt(categoryIndex, 10);
      if (idx < 0 || idx >= reg.categories.length) {
        return res.status(400).json({ error: 'Invalid category index' });
      }
      const categories = [...reg.categories];
      categories[idx] = { ...categories[idx], status };
      updatePayload = { categories };
    } else {
      updatePayload = { evaluation_status: status };
    }

    const updated = await Registration.findByIdAndUpdate(id, updatePayload, { new: true });

    return res.json({ success: true, registration: updated });
  } catch (err) {
    console.error('updateEvaluation error:', err.message);
    return res.status(500).json({ error: 'Failed to update evaluation' });
  }
};

// ── PUT /admin/registrations/:id/award ──────────────────────────────────────
const updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const { award, categoryIndex, isFaculty } = req.body;

    if (!id) return res.status(400).json({ error: 'Missing id' });

    const reg = await Registration.findById(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    let updatePayload = {};

    if (categoryIndex !== undefined && categoryIndex !== null) {
      const idx = parseInt(categoryIndex, 10);
      if (idx < 0 || idx >= reg.categories.length) {
        return res.status(400).json({ error: 'Invalid category index' });
      }
      const categories = [...reg.categories];
      const field = isFaculty ? 'faculty_award' : 'award';
      categories[idx] = { ...categories[idx], [field]: award };
      updatePayload = { categories };
    } else {
      updatePayload = { award };
    }

    const updated = await Registration.findByIdAndUpdate(id, updatePayload, { new: true });
    return res.json({ success: true, registration: updated });
  } catch (err) {
    console.error('updateAward error:', err.message);
    return res.status(500).json({ error: 'Failed to update award' });
  }
};

module.exports = { getStats, getRegistrations, deleteRegistration, getEvent, updateEvent, adminLogin, sendTickets, markAttendance, updateEvaluation, updateAward, sendTestTicket };
