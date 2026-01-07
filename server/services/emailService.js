const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'homeservice1811@gmail.com',
        pass: 'iiie knlt czrt hlpz'
    } // TODO: Move to .env
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: '"Home Services" <homeservice1811@gmail.com>',
            to,
            subject,
            text
        });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error('Email sending failed:', err);
        throw err; // Re-throw to handle in caller
    }
};

// Send General Notification
const sendNotificationEmail = async (to, subject, message) => {
    try {
        const mailOptions = {
            from: '"Home Services" <homeservice1811@gmail.com>', // Using the same sender as sendEmail
            to,
            subject: subject,
            html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #4F46E5;">Home Services Update</h2>
                    <p style="font-size: 16px;">${message}</p>
                    <hr/>
                    <p style="font-size: 12px; color: #888;">This is an automated message.</p>
                   </div>`
        };
        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent to ${to}`);
    } catch (err) {
        console.error("Email Error:", err);
        throw err; // Re-throw to handle in caller
    }
};

module.exports = {
    sendWelcomeEmail: (email, name) => sendEmail(email, 'Welcome to Home Services', `Hi ${name},\n\nWelcome to our platform! We are excited to have you.`),
    sendPasswordReset: (email, token) => sendEmail(email, 'Password Reset', `Your reset code is: ${token}\n\nOr click here: http://localhost:5173/reset-password/${token}`),
    sendServiceOtp: (email, otp, type) => sendEmail(email, `${type} Service OTP`, `Your OTP to ${type} the service is: ${otp}`)
};
