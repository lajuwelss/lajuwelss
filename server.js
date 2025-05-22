const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require("path");
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/images", express.static(path.join(__dirname, "images")));
console.log("Serving images from", path.join(__dirname, "images"));

// If in production, serve static files from build folder
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // e.g. 'gmail', 'hotmail', etc.
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASSWORD // your email password or app password
  },
  tls: {
    rejectUnauthorized: false // Bypasses certificate verification
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection established');
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  try {
    // Send email to admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Where to send form submissions
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <h3>Message:</h3>
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    // Send auto-reply to user
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Thank you for contacting us - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Thank You for Contacting Us</h2>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
          <p>Here's a summary of your message:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 4px; margin: 15px 0;">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p>Our team will review your message and respond within 1-2 business days.</p>
          <p>Best regards,<br>The Team</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated response. Please do not reply to this email.</p>
        </div>
      `
    };
    
    await transporter.sendMail(autoReplyOptions);
    
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send message, please try again later' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('Server is up and running');
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;


