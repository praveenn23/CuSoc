const mongoose = require('mongoose');

// ── Event ──────────────────────────────────────────────────────────────────
// Single event document. We use findOne() everywhere.
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    date: { type: Date, required: true },
    time: { type: String, default: null },
    venue: { type: String, required: true },
    total_seats: { type: Number, required: true, min: 1 },
    booked_seats: { type: Number, default: 0 },
    about_text: { type: String, default: null },
    event_sections: { type: Array, default: [] },
    speakers: { type: Array, default: [] },
    partners: { type: Array, default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// ── OTP Verifications ─────────────────────────────────────────────────────
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);
otpSchema.index({ email: 1 });
// TTL index: MongoDB auto-removes expired documents
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ── Registrations ─────────────────────────────────────────────────────────
const registrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    uid: { type: String, required: true, trim: true },
    cluster: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    categories: { type: Array, required: true },
    evaluation_status: {
      type: String,
      enum: ['pending', 'shortlisted', 'approved', 'rejected'],
      default: 'pending',
    },
    ticket_sent_at: { type: Date, default: null },
    attended_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema, 'event');
const OtpVerification = mongoose.models.OtpVerification || mongoose.model('OtpVerification', otpSchema, 'otp_verifications');
const Registration = mongoose.models.Registration || mongoose.model('Registration', registrationSchema, 'registrations');

module.exports = { Event, OtpVerification, Registration };
