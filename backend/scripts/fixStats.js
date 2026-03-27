require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function fixStats() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const count = await Registration.countDocuments();
    console.log(`Actual registrations in DB: ${count}`);

    const event = await Event.findOne();
    if (!event) {
      console.error('❌ No event found in database to update.');
      process.exit(1);
    }

    console.log(`Current bookedSeats in DB: ${event.bookedSeats}`);
    
    if (event.bookedSeats !== count) {
        event.bookedSeats = count;
        await event.save();
        console.log(`✅ Fixed! Event.bookedSeats is now: ${count}`);
    } else {
        console.log('ℹ️ Stats are already correct.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing stats:', err.message);
    process.exit(1);
  }
}

fixStats();
