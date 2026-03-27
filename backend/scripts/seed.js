require('dotenv').config();
const mongoose = require('mongoose');
const { Event } = require('../models');

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    // Check if an event already exists
    const existing = await Event.findOne();
    if (existing) {
      console.log('⚠️  An event already exists in the database. Skipping seed.');
      console.log('Event Title:', existing.title);
      process.exit(0);
    }

    console.log('Creating initial event...');
    const defaultEvent = {
      title: 'ABHYUTTHANAM 2024',
      description: 'University Level Co-Curricular Awards & Recognition Ceremony',
      date: new Date('2024-04-15T09:30:00Z'),
      time: '09:30 AM – 04:30 PM IST',
      venue: 'Main Auditorium, Chandigarh University',
      total_seats: 500,
      booked_seats: 0,
      about_text: 'Celebrate excellence and innovation at ABHYUTTHANAM 2024, the prestigious annual recognition ceremony honoring outstanding student achievements across research, entrepreneurship, leadership, and global certifications.',
      event_sections: [
        {
          id: 1,
          title: "What to Expect?",
          column: 1,
          type: "bullets",
          items: [
            "Recognition of National & International Award Winners",
            "Felicitation of Innovation & Patent Holders",
            "Showcasing Success Stories of Student Startups",
            "Global Certification Achievement Badges"
          ]
        },
        {
          id: 2,
          title: "Who Should Attend?",
          column: 2,
          type: "bullets",
          items: [
            "Students with notable co-curricular achievements",
            "Aspiring entrepreneurs and researchers",
            "Student leaders and club coordinators",
            "Faculty mentors and department heads"
          ]
        },
        {
          id: 3,
          title: "Key Highlights",
          column: 3,
          type: "bullets",
          items: [
            "Network with Industry Experts",
            "Guidance on Global Certifications",
            "Information on Duty Leave (DL) Policy",
            "Exclusive Swag for Approved Participants"
          ]
        }
      ],
      speakers: [
        {
          id: 1,
          name: "Organizing Committee",
          role: "Academic Affairs",
          bio: "Dedicated to fostering student growth and excellence through co-curricular initiatives.",
          color: "#1a73e8",
          initials: "OC"
        }
      ],
      partners: [
        {
          id: 1,
          name: "Office of Academic Affairs",
          logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Chandigarh_University_Logo.png/220px-Chandigarh_University_Logo.png"
        }
      ]
    };

    await Event.create(defaultEvent);
    console.log('✅ Default event created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
