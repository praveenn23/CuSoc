const supabase = require('../config/supabase');
const transporter = require('../config/mailer');

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'cuchd.in';

/**
 * Sends a beautiful confirmation email to the registrant
 */
const sendConfirmationEmail = async ({ name, email, course, event }) => {
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const eventTime = event.time || new Date(event.date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  await transporter.sendMail({
    from: `"CuSOC Events" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `✅ Registration Confirmed — ${event.title}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#f8f9fa;font-family:'Google Sans',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 16px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(60,64,67,.12);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:36px 32px;text-align:center;">
                  <div style="display:inline-block;background:white;border-radius:12px;padding:8px 16px;margin-bottom:16px;">
                    <span style="font-size:24px;font-weight:700;letter-spacing:-1px;">
                      <span style="color:#ea4335">C</span><span style="color:#fbbc04">u</span><span style="color:#34a853">S</span><span style="color:#ea4335">O</span><span style="color:#fbbc04">C</span>
                    </span>
                  </div>
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;line-height:1.3;">
                    You're In! 🎉
                  </h1>
                  <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">
                    Registration Confirmed
                  </p>
                </td>
              </tr>

              <!-- Green tick banner -->
              <tr>
                <td style="background:#e6f4ea;padding:20px 32px;text-align:center;border-bottom:1px solid #ceead6;">
                  <span style="font-size:40px;">✅</span>
                  <p style="margin:8px 0 0;color:#137333;font-size:15px;font-weight:600;">
                    Hi ${name}, your spot is confirmed!
                  </p>
                </td>
              </tr>

              <!-- Event Details -->
              <tr>
                <td style="padding:28px 32px;">
                  <h2 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#202124;">
                    ${event.title}
                  </h2>

                  <!-- Date -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                    <tr>
                      <td width="40" valign="top">
                        <div style="width:36px;height:36px;background:#e8f0fe;border-radius:8px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:36px;font-size:18px;">
                          📅
                        </div>
                      </td>
                      <td style="padding-left:12px;vertical-align:middle;">
                        <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Date</div>
                        <div style="font-size:15px;font-weight:500;color:#202124;">${eventDate}</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Time -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                    <tr>
                      <td width="40" valign="top">
                        <div style="width:36px;height:36px;background:#e6f4ea;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">
                          🕐
                        </div>
                      </td>
                      <td style="padding-left:12px;vertical-align:middle;">
                        <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Time</div>
                        <div style="font-size:15px;font-weight:500;color:#202124;">${eventTime}</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Venue -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                    <tr>
                      <td width="40" valign="top">
                        <div style="width:36px;height:36px;background:#fce8e6;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">
                          📍
                        </div>
                      </td>
                      <td style="padding-left:12px;vertical-align:middle;">
                        <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Venue</div>
                        <div style="font-size:15px;font-weight:500;color:#202124;">${event.venue}</div>
                      </td>
                    </tr>
                  </table>

                  ${course ? `
                  <!-- Course -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                    <tr>
                      <td width="40" valign="top">
                        <div style="width:36px;height:36px;background:#fef7e0;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">
                          🎓
                        </div>
                      </td>
                      <td style="padding-left:12px;vertical-align:middle;">
                        <div style="font-size:11px;color:#9aa0a6;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;">Course / Year</div>
                        <div style="font-size:15px;font-weight:500;color:#202124;">${course}</div>
                      </td>
                    </tr>
                  </table>` : ''}
                </td>
              </tr>

              <!-- What to bring -->
              <tr>
                <td style="padding:0 32px 28px;">
                  <div style="background:#e8f0fe;border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#1a73e8;">📋 What's Next?</p>
                    <ul style="margin:0;padding-left:18px;color:#3c4043;font-size:14px;line-height:1.8;">
                      <li>Add the event to your calendar</li>
                      <li>Bring your university ID card</li>
                      <li>Arrive 10 minutes early</li>
                      <li>Share with your friends! 🚀</li>
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- Registered email -->
              <tr>
                <td style="padding:0 32px 28px;">
                  <p style="margin:0;font-size:13px;color:#5f6368;text-align:center;">
                    This confirmation was sent to <strong>${email}</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer strip -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#ea4335 25%,#fbbc04 25% 50%,#34a853 50% 75%,#1a73e8 75%);"></td>
              </tr>
              <tr>
                <td style="padding:16px 32px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9aa0a6;">
                    © ${new Date().getFullYear()} CuSOC, Chandigarh University — See you there! 🎉
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

/**
 * POST /register
 * Full registration: OTP verified → check seats → insert → increment booked_seats → send confirmation email
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, course, otp } = req.body;

    // Basic field validation
    if (!name || !email || !phone || !otp) {
      return res.status(400).json({ error: 'Name, email, phone, and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate university email domain
    const emailDomain = normalizedEmail.split('@')[1];
    if (!emailDomain || emailDomain !== ALLOWED_DOMAIN) {
      return res.status(400).json({
        error: `Only university emails (@${ALLOWED_DOMAIN}) are allowed`,
      });
    }

    // Validate phone (10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // ── 1. Verify OTP is valid and not expired ──────────────────────────────
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp', otp.trim())
      .single();

    if (otpError || !otpData) {
      return res.status(400).json({ error: 'OTP not verified. Please verify your OTP first.' });
    }

    const now = new Date();
    if (now > new Date(otpData.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // ── 2. Check for duplicate registration ────────────────────────────────
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingReg) {
      return res.status(409).json({
        error: 'You are already registered for this event with this email',
      });
    }

    // ── 3. Fetch full event details (needed for seat check + confirmation email) ──
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('*')
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.booked_seats >= event.total_seats) {
      return res.status(409).json({ error: 'Event is full. No seats available.' });
    }

    // ── 4. Insert registration ─────────────────────────────────────────────
    const { error: insertError } = await supabase.from('registrations').insert({
      name: name.trim(),
      email: normalizedEmail,
      phone: phoneDigits,
      course: course ? course.trim() : null,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({
          error: 'You are already registered for this event with this email',
        });
      }
      throw insertError;
    }

    // ── 5. Increment booked_seats — try RPC, fallback to direct UPDATE ─────
    const { error: rpcError } = await supabase.rpc('increment_booked_seats', {
      event_id: event.id,
    });

    if (rpcError) {
      // RPC function not available — use direct UPDATE as reliable fallback
      console.warn('RPC increment_booked_seats failed, using direct UPDATE:', rpcError.message);
      const newCount = (event.booked_seats || 0) + 1;
      const { error: updateErr } = await supabase
        .from('event')
        .update({ booked_seats: newCount })
        .eq('id', event.id);
      if (updateErr) {
        console.error('Direct booked_seats increment also failed:', updateErr.message);
      } else {
        console.log(`✅ booked_seats incremented → ${newCount} (via direct update)`);
      }
    }

    // ── 6. Clean up used OTP ───────────────────────────────────────────────
    await supabase.from('otp_verifications').delete().eq('email', normalizedEmail);

    // ── 7. Send confirmation email (non-blocking — don't fail registration if email fails) ──
    sendConfirmationEmail({
      name: name.trim(),
      email: normalizedEmail,
      course: course ? course.trim() : null,
      event,
    }).catch((emailErr) => {
      console.error('Confirmation email failed (non-fatal):', emailErr.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! See you at the event 🎉',
    });
  } catch (err) {
    console.error('register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

module.exports = { register };
