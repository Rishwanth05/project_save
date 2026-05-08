const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = process.env.SENDGRID_FROM;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, otp, purpose = 'verify') {
  const subjects = {
    verify: 'Project SAVE — Verify your email',
    login: 'Project SAVE — Your login OTP',
    delete: 'Project SAVE — Confirm account deletion',
  };

  const intros = {
    verify: 'Thanks for signing up! Use this OTP to verify your email address.',
    login: 'Use this OTP to complete your login.',
    delete: '⚠️ You requested to delete your account. Use this OTP to confirm.',
  };

  const msg = {
    to: toEmail,
    from: FROM,
    subject: subjects[purpose] || subjects.verify,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <div style="background:#16a34a;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">🛡️ Project SAVE</h1>
        </div>
        <p style="color:#0f172a;font-size:16px;margin-bottom:8px">${intros[purpose]}</p>
        <div style="background:#fff;border:2px solid #e2e8f0;border-radius:10px;padding:24px;text-align:center;margin:20px 0">
          <p style="color:#64748b;font-size:13px;margin:0 0 8px">Your one-time code</p>
          <p style="color:#16a34a;font-size:42px;font-weight:800;letter-spacing:10px;margin:0">${otp}</p>
          <p style="color:#94a3b8;font-size:12px;margin:12px 0 0">Expires in 10 minutes</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center">If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
}

module.exports = { generateOTP, sendOTPEmail };