const Event        = require('../models/Event');
const Registration = require('../models/Registration');

/**
 * GET /event — fetch the single event document with a live booked_seats count.
 * The stored bookedSeats field can drift if registrations were imported/seeded
 * outside the /register route. We always compute the real count here and
 * patch the document so it stays in sync.
 */
const getEvent = async (req, res) => {
  try {
    const [event, liveCount] = await Promise.all([
      Event.findOne(),
      Registration.countDocuments(),
    ]);

    if (!event) {
      return res.status(404).json({
        error: 'No event found. Please seed the database via the Admin Panel.',
      });
    }

    // Auto-correct stored bookedSeats if it has drifted
    if (event.bookedSeats !== liveCount) {
      event.bookedSeats = liveCount;
      await Event.findByIdAndUpdate(event._id, { bookedSeats: liveCount });
    }

    return res.status(200).json({ success: true, event });
  } catch (err) {
    console.error('getEvent error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch event details' });
  }
};

module.exports = { getEvent };
