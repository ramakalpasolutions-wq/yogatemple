
// src/lib/mailer.js

import nodemailer from 'nodemailer';

/* =========================================================
   CONFIG
========================================================= */

const isDev = process.env.NODE_ENV !== 'production';

const EMAIL_CONFIG = {
  gmailUser:
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER,

  gmailPass:
    process.env.GMAIL_PASS ||
    process.env.EMAIL_PASS,

  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpSecure: process.env.SMTP_SECURE === 'true',

  adminEmail:
    process.env.ADMIN_EMAIL ||
    process.env.GMAIL_USER,

  siteUrl:
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000',
};

/* =========================================================
   HELPERS
========================================================= */

function getSender() {
  return `"Yoga Temple 🧘" <${EMAIL_CONFIG.gmailUser}>`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =========================================================
   TRANSPORTER
========================================================= */

let transporter = null;

export function createTransporter() {
  if (transporter) return transporter;

  try {
    // SMTP PRIORITY
    if (
      EMAIL_CONFIG.smtpHost &&
      EMAIL_CONFIG.smtpUser &&
      EMAIL_CONFIG.smtpPass
    ) {
      transporter = nodemailer.createTransport({
        host: EMAIL_CONFIG.smtpHost,
        port: EMAIL_CONFIG.smtpPort,
        secure: EMAIL_CONFIG.smtpSecure,
        auth: {
          user: EMAIL_CONFIG.smtpUser,
          pass: EMAIL_CONFIG.smtpPass,
        },
      });

      console.log('✅ SMTP transporter initialized');
      return transporter;
    }

    // GMAIL FALLBACK
    if (
      EMAIL_CONFIG.gmailUser &&
      EMAIL_CONFIG.gmailPass
    ) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL_CONFIG.gmailUser,
          pass: EMAIL_CONFIG.gmailPass,
        },
      });

      console.log('✅ Gmail transporter initialized');
      return transporter;
    }

    console.warn('⚠️ No email configuration found');
    return null;
  } catch (error) {
    console.error('❌ Transporter creation failed:', error);
    return null;
  }
}

/* =========================================================
   BASE TEMPLATE
========================================================= */

function emailLayout({
  title,
  subtitle,
  content,
  footer,
  emoji = '🪷',
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
  </head>

  <body style="
    margin:0;
    padding:0;
    background:#f4faf6;
    font-family:Arial,sans-serif;
  ">

    <div style="
      max-width:620px;
      margin:40px auto;
      background:#ffffff;
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 10px 40px rgba(0,0,0,0.08);
    ">

      <div style="
        background:linear-gradient(
          135deg,
          #0a3d2e 0%,
          #2ea065 100%
        );
        padding:42px 30px;
        text-align:center;
      ">

        <div style="
          font-size:54px;
          margin-bottom:12px;
        ">
          ${emoji}
        </div>

        <h1 style="
          color:#fff;
          margin:0;
          font-size:30px;
          font-weight:700;
          font-family:Georgia,serif;
        ">
          ${title}
        </h1>

        ${
          subtitle
            ? `
        <p style="
          color:rgba(255,255,255,0.8);
          margin-top:12px;
          font-size:14px;
        ">
          ${subtitle}
        </p>
        `
            : ''
        }

      </div>

      <div style="padding:38px 32px;">
        ${content}
      </div>

      <div style="
        border-top:1px solid #eaeaea;
        padding:22px;
        text-align:center;
        background:#fafafa;
      ">
        ${
          footer ||
          `
          <p style="
            color:#999;
            font-size:12px;
            margin:0;
          ">
            © ${new Date().getFullYear()}
            Yoga Temple
          </p>
          `
        }
      </div>

    </div>
  </body>
  </html>
  `;
}

/* =========================================================
   GENERIC SEND MAIL
========================================================= */

export async function sendMail({
  to,
  subject,
  html,
  text = '',
  retries = 2,
}) {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━
📧 DEV EMAIL
TO: ${to}
SUBJECT: ${subject}
━━━━━━━━━━━━━━━━━━━━━━
      `);

      return true;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await transporter.sendMail({
          from: getSender(),
          to,
          subject,
          html,
          text,
        });

        console.log(`✅ Email sent → ${to}`);
        return true;
      } catch (error) {
        console.error(
          `❌ Attempt ${attempt + 1} failed:`,
          error.message
        );

        if (attempt < retries) {
          await sleep(1000);
        }
      }
    }

    return false;
  } catch (error) {
    console.error('❌ sendMail error:', error);
    return false;
  }
}

/* =========================================================
   TEST CONNECTION
========================================================= */

export async function testEmailConnection() {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn('⚠️ No transporter configured');
      return false;
    }

    await transporter.verify();

    console.log('✅ Email connection successful');
    return true;
  } catch (error) {
    console.error(
      '❌ Email connection failed:',
      error.message
    );

    return false;
  }
}

/* =========================================================
   OTP EMAIL
========================================================= */

export async function sendOTPEmail(
  email,
  otp,
  name = 'Yogi'
) {
  const html = emailLayout({
    emoji: '🔐',

    title: 'Verify Your Account',

    subtitle:
      'Secure authentication for Yoga Temple',

    content: `
      <h2 style="
        color:#1a1208;
        margin-top:0;
      ">
        Namaste, ${name}! 🙏
      </h2>

      <p style="
        color:#555;
        line-height:1.7;
        font-size:15px;
      ">
        Use the OTP below to verify your email
        address and complete registration.
      </p>

      <div style="
        margin:30px 0;
        text-align:center;
        padding:28px;
        border-radius:18px;
        background:#f4faf6;
        border:2px dashed #4cd389;
      ">

        <p style="
          font-size:12px;
          letter-spacing:2px;
          color:#666;
          font-weight:700;
          margin-bottom:16px;
        ">
          YOUR OTP
        </p>

        <div style="
          font-size:52px;
          letter-spacing:14px;
          color:#005f2b;
          font-weight:900;
          font-family:monospace;
        ">
          ${otp}
        </div>

        <p style="
          margin-top:18px;
          color:#777;
          font-size:13px;
        ">
          Valid for 10 minutes
        </p>

      </div>

      <p style="
        color:#999;
        font-size:13px;
        line-height:1.7;
      ">
        Do not share this OTP with anyone.
      </p>
    `,
  });

  return sendMail({
    to: email,
    subject: `🔐 Yoga Temple OTP: ${otp}`,
    html,
    text: `Your OTP is ${otp}`,
  });
}

/* =========================================================
   WELCOME EMAIL
========================================================= */

export async function sendWelcomeEmail(
  email,
  name = 'Yogi'
) {
  const html = emailLayout({
    emoji: '🎉',

    title: 'Welcome to Yoga Temple',

    subtitle:
      'Your wellness journey begins now',

    content: `
      <h2>Namaste, ${name}! 🙏</h2>

      <p style="
        line-height:1.7;
        color:#555;
      ">
        Your email has been verified successfully.
      </p>

      <div style="
        margin:28px 0;
        background:#f4faf6;
        padding:24px;
        border-radius:16px;
      ">
        <p>🧘 Live Yoga Classes</p>
        <p>🥗 Nutrition Guidance</p>
        <p>🌿 Ayurvedic Wellness</p>
        <p>📱 Flexible Learning</p>
      </div>

      <div style="text-align:center;">
        <a
          href="${EMAIL_CONFIG.siteUrl}/auth"
          style="
            display:inline-block;
            background:#2ea065;
            color:#fff;
            padding:16px 34px;
            border-radius:12px;
            text-decoration:none;
            font-weight:700;
          "
        >
          Start Your Journey →
        </a>
      </div>
    `,
  });

  return sendMail({
    to: email,
    subject: `🎉 Welcome to Yoga Temple, ${name}!`,
    html,
  });
}

/* =========================================================
   BOOKING CONFIRMATION
========================================================= */

export async function sendBookingConfirmationEmail({
  email,
  name,
  bookingId,
  date,
  time,
  amount,
}) {
  const formattedDate = new Date(
    `${date}T00:00:00`
  ).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = emailLayout({
    emoji: '✅',

    title: 'Booking Confirmed',

    subtitle:
      'Your required session has been scheduled',

    content: `
      <h2>Namaste, ${name}! 🙏</h2>

      <div style="
        background:#f4faf6;
        border-radius:16px;
        padding:24px;
        margin-top:20px;
      ">

        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>

      </div>

      <p style="
        margin-top:24px;
        line-height:1.7;
        color:#666;
      ">
        Our team will contact you shortly.
      </p>
    `,
  });

  return sendMail({
    to: email,
    subject: `✅ Booking Confirmed`,
    html,
  });
}

/* =========================================================
   ADMIN BOOKING EMAIL
========================================================= */

export async function sendAdminBookingNotification({
  customerName,
  customerEmail,
  bookingId,
  amount,
}) {
  const html = emailLayout({
    emoji: '🔔',

    title: 'New Booking Received',

    subtitle:
      'Admin notification',

    content: `
      <h2>New Booking Alert 🚀</h2>

      <div style="
        background:#f4faf6;
        padding:24px;
        border-radius:16px;
      ">
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
      </div>
    `,
  });

  return sendMail({
    to: EMAIL_CONFIG.adminEmail,
    subject: `🔔 New Booking`,
    html,
  });
}