const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify transporter connection on startup
transporter.verify((error) => {
    if (error) {
        console.error('Email transporter error:', error.message);
    } else {
        console.log('✅ Email transporter ready');
    }
});

module.exports = transporter;
