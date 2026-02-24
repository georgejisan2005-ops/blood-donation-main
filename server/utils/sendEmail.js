const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use 'gmail' service correctly with App Passwords
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"EduDonor" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error to prevent registration rollback if email fails (unless critical)
    // For now, logging it is enough, but in production we might want to handle it better.
    return null;
  }
};

module.exports = sendEmail;
