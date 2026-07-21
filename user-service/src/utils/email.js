const { config } = require('../config');
const logger = require('../config/logger');

const sgMail = require("@sendgrid/mail");
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const minutes = (config.OTP_TTL || 300) / 60;

const IS_DEV = config.NODE_ENV !== 'production';
async function sendOtpEmail(email, otp) {
    const msg = {
        to: email,
        from: `${config.MAIL_SEND}`,
        subject: 'Your DesignKarle verification code',
        html: `
<div style="
font-family: Arial, sans-serif;
max-width: 420px;
margin: auto;
padding: 20px;
border: 1px solid #e5e5e5;
border-radius: 10px;
background: #ffffff;
box-shadow: 0 4px 10px rgba(0,0,0,0.05);
">
<div style="text-align: center; margin-bottom: 20px;">
<h2 style="color: #4A3AFF; margin: 0;">DesignKarle</h2>
</div>

<p style="font-size: 16px; color: #333;">
Hi,
</p>
<p style="font-size: 16px; color: #333;">
Thank you for signing up with DesignKarle. Please use the following One-Time Password (OTP) to complete your registration:
</p>

<div style="
text-align: center;
margin: 20px 0;
">
<span style="
display: inline-block;
font-size: 32px;
font-weight: bold;
padding: 10px 20px;
background-color: #f0f0f0;
border-radius: 5px;
letter-spacing: 5px;
color: #4A3AFF;
">
${otp}
</span>
</div>

<p style="font-size: 16px; color: #333;">
This OTP is valid for ${minutes} minutes. Please do not share this code with anyone.
</p>

<p style="font-size: 16px; color: #333;">
If you did not request this, please ignore this email.
</p>

<p style="font-size: 16px; color: #333;">
Best regards,
<br>
The DesignKarle Team
</p>
</div>
`
    };
    if (IS_DEV) {
        logger.info(`[DEV MODE] Skipping SendGrid. OTP email to ${email}: OTP = ${otp}`);
        console.log(`\n\x1b[33m╔══════════════════════════════════╗`);
        console.log(`║  📧 DEV MODE - Email Bypassed    ║`);
        console.log(`║  To     : ${email.padEnd(24)}║`);
        console.log(`║  OTP    : ${String(otp).padEnd(24)}║`);
        console.log(`╚══════════════════════════════════╝\x1b[0m\n`);
        return;
    }
    await sgMail.send(msg);
}

async function verifyOtpEmail(meta) {
    const msg = {
        to: meta.email,
        from: `${config.MAIL_SEND}`,
        subject: 'Welcome to DesignKarle, Email Verified',
        html: `
<div style="
font-family: Arial, sans-serif;
max-width: 420px;
margin: auto;
padding: 20px;
border: 1px solid #e5e5e5;
border-radius: 10px;
background: #ffffff;
">
<div style="text-align: center; margin-bottom: 20px;">
<h2 style="color: #4A3AFF; margin: 0;">DesignKarle</h2>
</div>

<p style="font-size: 16px; color: #333;">
Hi,
</p>
<p style="font-size: 16px; color: #333;">
Congratulations! Your email has been successfully verified.
</p>
<p style="font-size: 16px; color: #333;">
Welcome to DesignKarle! We are thrilled to have you on board.
</p>
<p style="font-size: 16px; color: #333;">
You can now enjoy full access to our platform.
</p>
<p style="font-size: 16px; color: #333;">
Best regards,
<br>
The DesignKarle Team
</p>
</div>
`
    };
    if (IS_DEV) {
        logger.info(`[DEV MODE] Skipping SendGrid. Welcome email to ${meta.email}`);
        return;
    }
    await sgMail.send(msg);
}

module.exports = {
    sendOtpEmail,
    verifyOtpEmail
};
