const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"Home Services" <${process.env.EMAIL_USER}>`,
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
            from: `"Home Services" <${process.env.EMAIL_USER}>`, // Using the same sender as sendEmail
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
    sendServiceOtp: (email, otp, type) => sendEmail(email, `${type} Service OTP`, `Your OTP to ${type} the service is: ${otp}`),

    // --- Job Lifecycle Emails ---
    sendJobRequestNotification: (email, providerName) => sendNotificationEmail(email, 'New Job Opportunity',
        `Hi ${providerName},<br/><br/>You have a new job request near you! Check your dashboard to view details and accept it.`),

    sendJobAcceptedNotification: (email, clientName, providerName) => sendNotificationEmail(email, 'Job Accepted',
        `Hi ${clientName},<br/><br/>Good news! <b>${providerName}</b> has accepted your service request. They will arrive at the scheduled time.`),

    sendJobCancelledNotification: (email, name, role, reason) => sendNotificationEmail(email, 'Job Cancelled',
        `Hi ${name},<br/><br/>The job has been cancelled by the ${role}.<br/>Reason: ${reason || 'No reason provided.'}`),

    sendJobCompletedNotification: (email, clientName, providerName, amount) => sendNotificationEmail(email, 'Service Completed',
        `Hi ${clientName},<br/><br/>Your service with <b>${providerName}</b> has been completed successfully.<br/>Total Amount: ₹${amount}<br/><br/>Please rate your provider in the app!`),

    // --- Admin/Status Emails ---
    sendDocumentVerificationNotification: (email, name, status, reason) => {
        const subject = status === 'approved' ? 'Documents Verified! You are Live' : 'Document Verification Failed';
        const msg = status === 'approved'
            ? `Hi ${name},<br/><br/>Congratulations! Your documents have been verified. Your account is now fully active and you can start accepting jobs.`
            : `Hi ${name},<br/><br/>Unfortunately, your document verification failed.<br/><b>Reason:</b> ${reason || 'Documents unclear or invalid'}.<br/>Please re-upload your documents in the dashboard.`;
        return sendNotificationEmail(email, subject, msg);
    },

    sendAccountStatusNotification: (email, name, status, reason, duration) => {
        const subject = `Account Status Update: ${status.toUpperCase()}`;
        let msg = `Hi ${name},<br/><br/>Your account status has changed to: <b>${status.toUpperCase()}</b>.`;

        if (status === 'suspended') {
            msg += `<br/><b>Duration:</b> ${duration ? duration + ' Days' : 'Indefinite'}`;
            msg += `<br/><b>Reason:</b> ${reason}`;
        } else if (status === 'banned') {
            msg += `<br/><b>Reason:</b> ${reason}<br/>This action is permanent.`;
        } else if (status === 'active') {
            msg += `<br/>Your account has been re-activated! Welcome back.`;
        }

        return sendNotificationEmail(email, subject, msg);
    }
};
