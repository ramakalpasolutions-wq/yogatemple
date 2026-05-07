// src/lib/mailer.js
import nodemailer from 'nodemailer';
import {
  classReminderUserEmail,
  classReminderAdminEmail,
  classCreatedAdminEmail,
  newClassUserEmail,
} from './classEmailTemplates';

/* ─────────────────────────────────────────
   Credentials helper
───────────────────────────────────────── */
function getCredentials() {
  const user =
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER ||
    process.env.EMAIL_FROM;

  const pass =
    process.env.GMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASS;

  return { user, pass };
}

function createTransporter() {
  const { user, pass } = getCredentials();

  if (!user || !pass) {
    console.warn('⚠️  Email not configured.');
    console.warn('    Add GMAIL_USER and GMAIL_PASS to .env.local');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function getSender() {
  const { user } = getCredentials();
  return `"Yoga Temple 🧘" <${user}>`;
}

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.GMAIL_USER  ||
    process.env.EMAIL_USER
  );
}

/* ─────────────────────────────────────────
   Generic sendMail — used by verify route
   and other places that import sendMail
───────────────────────────────────────── */
export async function sendMail({ to, subject, html, text }) {
  try {
    const t = createTransporter();
    if (!t) {
      console.log(`📧 DEV sendMail → ${to} | ${subject}`);
      return false;
    }
    await t.sendMail({
      from: getSender(),
      to,
      subject,
      html,
      text: text || '',
    });
    console.log(`✅ sendMail → ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ sendMail error → ${to}:`, err.message);
    return false;
  }
}

/* ─────────────────────────────────────────
   1. Test connection
───────────────────────────────────────── */
export async function testEmailConnection() {
  try {
    const t = createTransporter();
    if (!t) return false;
    await t.verify();
    console.log('✅ Email connection OK');
    return true;
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    return false;
  }
}

/* ─────────────────────────────────────────
   2. OTP Email (Registration & Resend)
───────────────────────────────────────── */
export async function sendOTPEmail(email, otp, name = 'Yogi') {
  try {
    console.log(`📧 Sending OTP email to ${email} | OTP: ${otp}`);

    const t = createTransporter();
    if (!t) {
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`📧  DEV OTP for ${email}`);
      console.log(`🔑  OTP CODE: ${otp}`);
      console.log(`${'═'.repeat(50)}\n`);
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
      </head>
      <body style="margin:0;padding:0;background:#f4faf6;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,95,43,0.12);">
          <div style="background:linear-gradient(135deg,#0a3d2e 0%,#2ea065 100%);padding:36px 32px;text-align:center;">
            <div style="font-size:52px;margin-bottom:10px;line-height:1;">🪷</div>
            <h1 style="color:#ffffff;font-size:26px;margin:0 0 6px;font-family:Georgia,serif;font-weight:700;">
              Yoga Temple
            </h1>
            <p style="color:rgba(255,255,255,0.75);font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">
              ॐ వ్యాయామం · ఆహారం · ఔషధం ॐ
            </p>
          </div>
          <div style="padding:36px 32px;">
            <h2 style="color:#1a1208;font-size:22px;margin:0 0 10px;font-family:Georgia,serif;">
              Namaste, ${name}! 🙏
            </h2>
            <p style="color:#6b5a3e;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Thank you for joining <strong>Yoga Temple</strong>. Please use the OTP below to verify your email address and complete your registration.
            </p>
            <div style="background:linear-gradient(135deg,rgba(76,211,137,0.08),rgba(0,95,43,0.04));border:2px dashed #4cd389;border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:28px;">
              <p style="color:#6b5a3e;font-size:11px;margin:0 0 14px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">
                ✨ Your Verification OTP
              </p>
              <div style="letter-spacing:16px;font-size:48px;font-weight:900;color:#005f2b;font-family:'Courier New',monospace;padding-left:16px;margin-bottom:14px;">
                ${otp}
              </div>
              <p style="color:#9a8a6a;font-size:13px;margin:0;">
                ⏰ This OTP is valid for <strong style="color:#005f2b;">10 minutes</strong> only
              </p>
            </div>
            <div style="background:#f4faf6;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="color:#6b5a3e;font-size:13px;font-weight:700;margin:0 0 10px;">How to verify:</p>
              <ol style="color:#6b5a3e;font-size:13px;line-height:1.8;margin:0;padding-left:18px;">
                <li>Go back to the Yoga Temple registration page</li>
                <li>Enter the 6-digit OTP shown above</li>
                <li>Click "Verify &amp; Go to Sign In"</li>
              </ol>
            </div>
            <p style="color:#9a8a6a;font-size:12px;line-height:1.6;margin:0 0 8px;">
              🔒 If you did not create an account with Yoga Temple, please ignore this email.
            </p>
            <p style="color:#9a8a6a;font-size:12px;line-height:1.6;margin:0;">
              Do not share this OTP with anyone.
            </p>
            <div style="border-top:1px solid #c8e6d4;margin-top:28px;padding-top:20px;text-align:center;">
              <p style="color:#9a8a6a;font-size:11px;margin:0 0 6px;letter-spacing:1px;font-style:italic;">
                ॐ Lokāḥ Samastāḥ Sukhino Bhavantu ॐ
              </p>
              <p style="color:#c8e6d4;font-size:10px;margin:0;">
                🔐 Yoga Temple © ${new Date().getFullYear()} · Secure Email
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await t.sendMail({
      from:    getSender(),
      to:      email,
      subject: `🪷 Your Yoga Temple OTP: ${otp}`,
      html,
      text: `Namaste ${name},\n\nYour Yoga Temple verification OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nDo not share this OTP with anyone.\n\nॐ Yoga Temple`,
    });

    console.log(`✅ OTP email sent successfully → ${email}`);
  } catch (err) {
    console.error(`❌ sendOTPEmail error (${email}):`, err.message);
    console.log(`📧 FALLBACK OTP for ${email}: ${otp}`);
  }
}

/* ─────────────────────────────────────────
   3. Welcome Email (after email verified)
───────────────────────────────────────── */
export async function sendWelcomeEmail(email, name = 'Yogi') {
  try {
    console.log(`📧 Sending welcome email to ${email}`);

    const t = createTransporter();
    if (!t) {
      console.log(`📧 DEV: Welcome email skipped for ${email} (no transporter)`);
      return;
    }

    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
      </head>
      <body style="margin:0;padding:0;background:#f4faf6;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,95,43,0.12);">
          <div style="background:linear-gradient(135deg,#0a3d2e 0%,#2ea065 100%);padding:36px 32px;text-align:center;">
            <div style="font-size:52px;margin-bottom:10px;line-height:1;">🎉</div>
            <h1 style="color:#ffffff;font-size:26px;margin:0 0 6px;font-family:Georgia,serif;font-weight:700;">
              Welcome to Yoga Temple!
            </h1>
            <p style="color:rgba(255,255,255,0.75);font-size:12px;margin:0;letter-spacing:2px;">
              Your journey begins now 🌿
            </p>
          </div>
          <div style="padding:36px 32px;">
            <h2 style="color:#1a1208;font-size:22px;margin:0 0 10px;font-family:Georgia,serif;">
              Namaste, ${name}! 🙏
            </h2>
            <p style="color:#6b5a3e;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Your email has been <strong style="color:#2ea065;">successfully verified</strong> and your account is now active. Welcome to our wellness community!
            </p>
            <div style="margin-bottom:28px;">
              ${[
                ['🧘', 'Live Yoga Classes', 'Join our expert-led sessions daily'],
                ['🥗', 'Nutrition Guidance', 'Personalized diet and wellness tips'],
                ['💊', 'Ayurvedic Insights', 'Ancient wisdom for modern wellness'],
                ['📱', 'Flexible Schedule',  'Practice at your convenience'],
              ].map(([icon, title, desc]) => `
                <div style="display:flex;align-items:flex-start;gap:14px;padding:12px 0;border-bottom:1px solid #f4faf6;">
                  <span style="font-size:24px;flex-shrink:0;">${icon}</span>
                  <div>
                    <p style="color:#1a1208;font-size:14px;font-weight:700;margin:0 0 2px;">${title}</p>
                    <p style="color:#9a8a6a;font-size:12px;margin:0;">${desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${siteUrl}/auth"
                 style="display:inline-block;background:linear-gradient(135deg,#4cd389,#2ea065);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(0,95,43,0.25);">
                🧘 Sign In &amp; Start Your Practice
              </a>
            </div>
            <div style="border-top:1px solid #c8e6d4;padding-top:20px;text-align:center;">
              <p style="color:#9a8a6a;font-size:11px;margin:0 0 6px;letter-spacing:1px;font-style:italic;">
                ॐ Lokāḥ Samastāḥ Sukhino Bhavantu ॐ
              </p>
              <p style="color:#c8e6d4;font-size:10px;margin:0;">
                🔐 Yoga Temple © ${new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await t.sendMail({
      from:    getSender(),
      to:      email,
      subject: `🎉 Welcome to Yoga Temple, ${name}! Your account is ready 🪷`,
      html,
      text: `Namaste ${name},\n\nWelcome to Yoga Temple! Your email is verified and your account is now active.\n\nSign in here: ${siteUrl}/auth\n\nॐ Yoga Temple`,
    });

    console.log(`✅ Welcome email sent → ${email}`);
  } catch (err) {
    console.error(`❌ sendWelcomeEmail error (${email}):`, err.message);
  }
}

/* ─────────────────────────────────────────
   4. Admin — class created email
───────────────────────────────────────── */
export async function sendAdminClassEmail({ adminEmail, adminName, classData }) {
  try {
    const t = createTransporter();
    if (!t) return;

    const { subject, html } = classCreatedAdminEmail({
      adminName: adminName || 'Admin',
      classData,
    });

    await t.sendMail({
      from:    getSender(),
      to:      adminEmail || getAdminEmail(),
      subject,
      html,
    });

    console.log(`📧 Admin created email sent → ${adminEmail}`);
  } catch (err) {
    console.error('sendAdminClassEmail error:', err.message);
  }
}

/* ─────────────────────────────────────────
   5. notifyAllUsers — DEPRECATED
───────────────────────────────────────── */
export async function notifyAllUsers({ users, classData }) {
  console.warn(
    '⚠️  notifyAllUsers() is deprecated. Use notifyUsersForNewClass() instead.'
  );
}

/* ─────────────────────────────────────────
   5b. notifyUsersForNewClass
       FREE class  → ALL verified active users
       PREMIUM class → ONLY matching category subscribers
───────────────────────────────────────── */
export async function notifyUsersForNewClass({ classData }) {
  const t = createTransporter();
  if (!t) {
    console.log('📧 DEV: notifyUsersForNewClass — no transporter configured');
    return;
  }

  const isPremium     = classData.isPremium === true;
  const classCategory = classData.category?.toUpperCase();
  let   recipients    = [];

  /* ── FREE class → all verified active users ── */
  if (!isPremium) {
    try {
      const { default: prisma } = await import('./prisma.js');
      recipients = await prisma.user.findMany({
        where:  { isVerified: true, isActive: true, role: 'USER' },
        select: { email: true, name: true },
      });
      console.log(
        `📧 FREE class "${classData.title}" → notifying ${recipients.length} verified users`
      );
    } catch (err) {
      console.error('notifyUsersForNewClass — fetch all users error:', err.message);
      return;
    }
  }

  /* ── PREMIUM class → only exact category subscribers ── */
  else {
    try {
      const { default: prisma } = await import('./prisma.js');
      const now = new Date();

      const subscriptions = await prisma.subscription.findMany({
        where: { isActive: true, endDate: { gt: now }, category: classCategory },
        include: {
          user: {
            select: {
              email:      true,
              name:       true,
              isActive:   true,
              isVerified: true,
              role:       true,
            },
          },
        },
      });

      recipients = subscriptions
        .filter(sub =>
          sub.user?.email     &&
          sub.user?.isActive  &&
          sub.user?.isVerified &&
          sub.user?.role === 'USER'
        )
        .map(sub => ({ email: sub.user.email, name: sub.user.name }));

      console.log(
        `📧 PREMIUM class "${classData.title}" (${classCategory}) → ${recipients.length} ${classCategory} subscribers`
      );

      if (recipients.length === 0) {
        console.log(`   ℹ️  No active ${classCategory} subscribers — skipping emails`);
        return;
      }
    } catch (err) {
      console.error('notifyUsersForNewClass — fetch subscribers error:', err.message);
      return;
    }
  }

  /* ── Send emails ── */
  let sent = 0, failed = 0;

  for (const user of recipients) {
    if (!user?.email) continue;
    try {
      const { subject, html } = newClassUserEmail({
        userName:  user.name || 'Yogi',
        classData,
      });

      await t.sendMail({ from: getSender(), to: user.email, subject, html });
      sent++;
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      failed++;
      console.error(`notifyUsersForNewClass → ${user.email}:`, err.message);
    }
  }

  console.log(`📧 notifyUsersForNewClass complete: ${sent} sent, ${failed} failed`);
}

/* ─────────────────────────────────────────
   6. Send reminder → single user (FREE class)
───────────────────────────────────────── */
export async function sendReminderToUser({ userEmail, userName, classData }) {
  try {
    const t = createTransporter();
    if (!t) return false;

    const { subject, html } = classReminderUserEmail({
      userName: userName || 'Yogi',
      classData,
    });

    await t.sendMail({ from: getSender(), to: userEmail, subject, html });
    console.log(`📧 Free reminder sent → ${userEmail}`);
    return true;
  } catch (err) {
    console.error(`sendReminderToUser → ${userEmail}:`, err.message);
    return false;
  }
}

/* ─────────────────────────────────────────
   7. Send reminder → admin
───────────────────────────────────────── */
export async function sendReminderToAdmin({ classData, attendeeCount }) {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail) { console.warn('⚠️  ADMIN_EMAIL not set'); return false; }

    const t = createTransporter();
    if (!t) return false;

    const { subject, html } = classReminderAdminEmail({ classData, attendeeCount });
    await t.sendMail({ from: getSender(), to: adminEmail, subject, html });
    console.log(`📧 Admin reminder sent → ${adminEmail}`);
    return true;
  } catch (err) {
    console.error('sendReminderToAdmin error:', err.message);
    return false;
  }
}

/* ─────────────────────────────────────────
   8. Booking Confirmation → User
───────────────────────────────────────── */
export async function sendBookingConfirmationEmail({
  email, name, bookingId, date, time, amount, paymentId,
}) {
  try {
    const t = createTransporter();
    if (!t) {
      console.log(`📧 DEV: Booking confirmation for ${email} | Booking #${bookingId}`);
      return;
    }

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4faf6;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,95,43,0.12);">
          <div style="background:linear-gradient(135deg,#0a3d2e,#2ea065);padding:32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:10px;">✅</div>
            <h1 style="color:#fff;font-size:24px;margin:0 0 6px;font-family:Georgia,serif;">Booking Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;">Your required session is scheduled</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#1a1208;font-size:20px;margin:0 0 10px;font-family:Georgia,serif;">
              Namaste, ${name}! 🙏
            </h2>
            <p style="color:#6b5a3e;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Your required session has been successfully booked and payment confirmed.
            </p>
            <div style="background:#f0faf4;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid rgba(76,211,137,0.2);">
              <h3 style="color:#005f2b;font-size:13px;font-weight:700;margin:0 0 14px;letter-spacing:1px;text-transform:uppercase;">
                📋 Booking Details
              </h3>
              ${[
                ['📅', 'Date',        dateFormatted],
                ['⏰', 'Time',        time],
                ['💰', 'Amount Paid', `₹${amount}`],
                ['🆔', 'Booking Ref', `#${bookingId.slice(-8).toUpperCase()}`],
                ['💳', 'Payment ID',  paymentId || '—'],
              ].map(([icon, label, value]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(76,211,137,0.1);">
                  <span style="color:#6b5a3e;font-size:13px;">${icon} ${label}</span>
                  <span style="color:#1a1208;font-size:13px;font-weight:700;">${value}</span>
                </div>
              `).join('')}
            </div>
            <div style="background:#fff8e7;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid rgba(196,154,54,0.2);">
              <p style="color:#6b5a3e;font-size:13px;margin:0;line-height:1.6;">
                💡 <strong>What's next?</strong> Our team will contact you shortly to confirm your session details and share the meeting link.
              </p>
            </div>
            <div style="border-top:1px solid #c8e6d4;padding-top:20px;text-align:center;">
              <p style="color:#9a8a6a;font-size:11px;margin:0;font-style:italic;">ॐ Lokāḥ Samastāḥ Sukhino Bhavantu ॐ</p>
              <p style="color:#c8e6d4;font-size:10px;margin:6px 0 0;">🔐 Yoga Temple © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await t.sendMail({
      from:    getSender(),
      to:      email,
      subject: `✅ Booking Confirmed — Required Session on ${dateFormatted}`,
      html,
      text: `Namaste ${name},\n\nYour required session is confirmed!\n\nDate: ${dateFormatted}\nTime: ${time}\nAmount: ₹${amount}\nBooking Ref: #${bookingId.slice(-8).toUpperCase()}\n\nॐ Yoga Temple`,
    });

    console.log(`✅ Booking confirmation sent → ${email}`);
  } catch (err) {
    console.error(`❌ sendBookingConfirmationEmail error:`, err.message);
  }
}

/* ─────────────────────────────────────────
   9. Booking Notification → Admin
───────────────────────────────────────── */
export async function sendAdminBookingNotificationEmail({
  userName, userEmail, userPhone, bookingId, date, time, amount, paymentId,
}) {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      console.warn('⚠️ ADMIN_EMAIL not set — skipping admin booking notification');
      return;
    }

    const t = createTransporter();
    if (!t) {
      console.log(`📧 DEV: Admin booking notification | User: ${userName} | Date: ${date} ${time}`);
      return;
    }

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4faf6;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,95,43,0.12);">
          <div style="background:linear-gradient(135deg,#1a1208,#3d2b00);padding:28px 32px;display:flex;align-items:center;gap:16px;">
            <div style="font-size:40px;flex-shrink:0;">🔔</div>
            <div>
              <h1 style="color:#ffd78c;font-size:20px;margin:0 0 4px;font-family:Georgia,serif;">New Booking Alert!</h1>
              <p style="color:rgba(255,215,140,0.7);font-size:12px;margin:0;">A new required session has been booked</p>
            </div>
          </div>
          <div style="background:linear-gradient(135deg,rgba(76,211,137,0.08),rgba(0,95,43,0.04));padding:16px 32px;border-bottom:2px solid rgba(76,211,137,0.15);">
            <div style="display:inline-flex;align-items:center;gap:8px;background:#2ea065;color:#fff;padding:6px 16px;border-radius:50px;font-size:11px;font-weight:700;letter-spacing:1px;">
              ✅ PAYMENT CONFIRMED · ₹${amount}
            </div>
          </div>
          <div style="padding:28px 32px;">
            <h3 style="color:#005f2b;font-size:12px;font-weight:700;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">
              👤 Customer Details
            </h3>
            <div style="background:#f9f9f9;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #e8e8e8;">
              ${[
                ['👤', 'Name',  userName],
                ['✉️', 'Email', userEmail],
                ['📱', 'Phone', userPhone || '—'],
              ].map(([icon, label, value]) => `
                <div style="display:flex;gap:12px;padding:6px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#9a8a6a;font-size:13px;width:80px;flex-shrink:0;">${icon} ${label}</span>
                  <span style="color:#1a1208;font-size:13px;font-weight:600;">${value}</span>
                </div>
              `).join('')}
            </div>
            <h3 style="color:#005f2b;font-size:12px;font-weight:700;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">
              📅 Session Details
            </h3>
            <div style="background:#f0faf4;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid rgba(76,211,137,0.2);">
              ${[
                ['📅', 'Date',        dateFormatted],
                ['⏰', 'Time',        time],
                ['💰', 'Amount',      `₹${amount}`],
                ['🆔', 'Booking Ref', `#${bookingId.slice(-8).toUpperCase()}`],
                ['💳', 'Payment ID',  paymentId || '—'],
              ].map(([icon, label, value]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(76,211,137,0.1);">
                  <span style="color:#6b5a3e;font-size:13px;">${icon} ${label}</span>
                  <span style="color:#005f2b;font-size:13px;font-weight:700;">${value}</span>
                </div>
              `).join('')}
            </div>
            <div style="background:linear-gradient(135deg,rgba(239,68,68,0.06),rgba(239,68,68,0.03));border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px;margin-bottom:20px;">
              <p style="color:#dc2626;font-size:13px;font-weight:700;margin:0 0 6px;">⚠️ Action Required</p>
              <p style="color:#6b5a3e;font-size:13px;margin:0;line-height:1.6;">
                Please contact the customer to confirm session details and share the meeting link before the scheduled time.
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/bookings"
                 style="display:inline-block;background:linear-gradient(135deg,#005f2b,#2ea065);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
                📋 View in Admin Panel →
              </a>
            </div>
            <div style="border-top:1px solid #c8e6d4;margin-top:24px;padding-top:16px;text-align:center;">
              <p style="color:#9a8a6a;font-size:10px;margin:0;">
                Yoga Temple Admin Notification · ${new Date().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await t.sendMail({
      from:    getSender(),
      to:      adminEmail,
      subject: `🔔 New Booking: ${userName} — ${dateFormatted} at ${time} · ₹${amount}`,
      html,
      text: `New Booking!\n\nCustomer: ${userName}\nEmail: ${userEmail}\nPhone: ${userPhone}\nDate: ${dateFormatted}\nTime: ${time}\nAmount: ₹${amount}\nBooking Ref: #${bookingId.slice(-8).toUpperCase()}`,
    });

    console.log(`✅ Admin booking notification sent → ${adminEmail}`);
  } catch (err) {
    console.error(`❌ sendAdminBookingNotificationEmail error:`, err.message);
  }
}

/* ─────────────────────────────────────────
   10. Premium Class Reminder → Category Subscriber
───────────────────────────────────────── */
export async function sendPremiumClassReminderToUser({ userEmail, userName, classData }) {
  try {
    const t = createTransporter();
    if (!t) {
      console.log(`📧 DEV: Premium reminder for ${userEmail} | ${classData.title} | ${classData.milestone}min`);
      return true;
    }

    const {
      milestone = 30, title, category, level,
      scheduledAt, duration, instructor, meetLink,
    } = classData;

    const milestoneEmoji =
      milestone <= 10 ? '🚨' : milestone <= 30 ? '⏰' : '🔔';
    const milestoneColor =
      milestone <= 10 ? '#ef4444' : milestone <= 30 ? '#f59e0b' : '#3b82f6';
    const milestoneLabel = `${milestone} minute${milestone !== 1 ? 's' : ''}`;
    const showJoinButton = milestone <= 10;

    const timeString = new Date(scheduledAt).toLocaleString('en-IN', {
      dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    });

    const catEmojis = {
      HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
      YIN:'🌙', RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
      KIDS:'🧒', MEDITATION:'🧠', PRANAYAMA:'🌬️',
    };
    const catEmoji = catEmojis[category?.toUpperCase()] || '🧘';
    const siteUrl  = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,${milestoneColor},${milestoneColor}cc);padding:36px 32px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">${milestoneEmoji}</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">
      Your Premium Class Starts in ${milestoneLabel}!
    </h1>
    <p style="color:rgba(255,255,255,0.88);margin:10px 0 0;font-size:15px;">
      Get ready, ${userName} 🧘
    </p>
  </div>
  <div style="background:linear-gradient(135deg,rgba(196,154,54,0.12),rgba(196,154,54,0.06));padding:10px 32px;text-align:center;border-bottom:1px solid rgba(196,154,54,0.2);">
    <span style="color:#c49a36;font-size:12px;font-weight:700;letter-spacing:1px;">
      👑 PREMIUM ${category?.toUpperCase()} CLASS — EXCLUSIVE FOR SUBSCRIBERS
    </span>
  </div>
  <div style="padding:32px;">
    <div style="background:#f9f4e8;border:1px solid rgba(196,154,54,0.25);border-radius:12px;padding:22px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="font-size:28px;">${catEmoji}</span>
        <h2 style="color:#1a1208;margin:0;font-size:20px;">${title}</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:7px 0;color:#6b5a3e;width:38%;">📅 Date &amp; Time</td><td style="padding:7px 0;color:#1a1208;font-weight:600;">${timeString}</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:7px 0;color:#6b5a3e;">⏱ Duration</td><td style="padding:7px 0;color:#1a1208;font-weight:600;">${duration} minutes</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:7px 0;color:#6b5a3e;">👤 Instructor</td><td style="padding:7px 0;color:#1a1208;font-weight:600;">${instructor}</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:7px 0;color:#6b5a3e;">${catEmoji} Style</td><td style="padding:7px 0;color:#1a1208;font-weight:600;">${category}</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:7px 0;color:#6b5a3e;">📊 Level</td><td style="padding:7px 0;color:#1a1208;font-weight:600;">${level?.replace('_', ' ')}</td></tr>
      </table>
    </div>
    ${showJoinButton && meetLink ? `
    <div style="text-align:center;margin-bottom:24px;">
      <p style="color:#005f2b;font-weight:700;font-size:14px;margin-bottom:14px;">🔓 Your exclusive meeting room is ready!</p>
      <a href="${meetLink}" style="display:inline-block;background:linear-gradient(135deg,#c49a36,#f0c060);color:#000;padding:16px 44px;border-radius:50px;font-size:16px;font-weight:700;text-decoration:none;box-shadow:0 6px 20px rgba(196,154,54,0.35);">
        👑 Join Premium Class Now →
      </a>
      <p style="color:#9a8a6a;font-size:11px;margin-top:12px;">
        Direct link: <a href="${meetLink}" style="color:#c49a36;word-break:break-all;">${meetLink}</a>
      </p>
    </div>
    ` : `
    <div style="background:#fffbeb;border:1px solid rgba(196,154,54,0.3);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 8px;">⏰ Your premium class starts in ${milestoneLabel}</p>
      <p style="color:#92400e;font-size:13px;margin:0 0 14px;">The join link will appear in your premium classes page 10 minutes before class.</p>
      <a href="${siteUrl}/premium-classes" style="display:inline-block;background:linear-gradient(135deg,#c49a36,#f0c060);color:#000;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:700;text-decoration:none;">
        View My Premium Classes →
      </a>
    </div>
    `}
    <div style="background:#f8fffe;border-radius:10px;padding:18px;border:1px solid #c8e6d4;">
      <p style="color:#005f2b;font-weight:700;font-size:13px;margin:0 0 10px;">🌿 Premium Class Preparation:</p>
      <ul style="color:#6b5a3e;font-size:13px;margin:0;padding-left:18px;line-height:1.9;">
        <li>Roll out your yoga mat in a quiet, well-lit space</li>
        <li>Have water and any props nearby (blocks, strap)</li>
        <li>Wear comfortable, flexible clothing</li>
        <li>Test your camera, microphone and internet connection</li>
        <li>Join 2–3 minutes early to settle in</li>
      </ul>
    </div>
  </div>
  <div style="background:linear-gradient(135deg,rgba(196,154,54,0.08),rgba(196,154,54,0.04));border-top:1px solid rgba(196,154,54,0.2);padding:18px 32px;text-align:center;">
    <p style="color:#c49a36;font-size:12px;font-weight:700;margin:0 0 4px;">👑 Yoga Temple Premium Member</p>
    <p style="color:#9a8a6a;font-size:11px;margin:0;">© ${new Date().getFullYear()} Yoga Temple · Namaste 🙏</p>
  </div>
</div>
</body>
</html>`;

    await t.sendMail({
      from:    getSender(),
      to:      userEmail,
      subject: `${milestoneEmoji} Your Premium ${category} Class "${title}" starts in ${milestoneLabel}!`,
      html,
      text: `Namaste ${userName},\n\nYour premium ${category} class "${title}" starts in ${milestoneLabel}!\n\nTime: ${timeString}\nInstructor: ${instructor}\nDuration: ${duration} minutes\n\n${
        showJoinButton && meetLink
          ? `Join Now: ${meetLink}`
          : `Visit ${siteUrl}/premium-classes to join when it starts.`
      }\n\nॐ Yoga Temple Premium`,
    });

    console.log(`✅ Premium reminder (${milestone}min) sent → ${userEmail}`);
    return true;
  } catch (err) {
    console.error(`sendPremiumClassReminderToUser → ${userEmail}:`, err.message);
    return false;
  }
}

/* ─────────────────────────────────────────
   11. Personal Class Notification → Specific User
───────────────────────────────────────── */
export async function sendPersonalClassNotification({ user, classData }) {
  try {
    const t = createTransporter();
    if (!t) {
      console.log(`📧 DEV: Personal class notification for ${user.email} | ${classData.title}`);
      return;
    }

    const {
      title, category, level, scheduledAt,
      duration, instructor, googleMeetLink, isPremium,
    } = classData;

    const catEmojis = {
      HATHA:'🌅', VINYASA:'🌊', ASHTANGA:'🔥', POWER:'⚡',
      YIN:'🌙', RESTORATIVE:'🌿', KUNDALINI:'✨', PRENATAL:'🤰',
      KIDS:'🧒', MEDITATION:'🧠', PRANAYAMA:'🌬️',
    };
    const catEmoji = catEmojis[category?.toUpperCase()] || '🧘';
    const siteUrl  = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const timeString = scheduledAt
      ? new Date(scheduledAt).toLocaleString('en-IN', {
          dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata',
        })
      : null;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a1208,#c49a36);padding:36px 32px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">🎯</div>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">A Class Has Been Scheduled For You!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:15px;">Namaste, ${user.name} 🙏</p>
  </div>
  <div style="background:linear-gradient(135deg,rgba(196,154,54,0.15),rgba(196,154,54,0.08));padding:12px 32px;text-align:center;border-bottom:1px solid rgba(196,154,54,0.25);">
    <span style="color:#c49a36;font-size:12px;font-weight:700;letter-spacing:1px;">
      ✨ PERSONALLY SCHEDULED FOR YOU — ${user.name?.toUpperCase()}
    </span>
  </div>
  <div style="padding:32px;">
    <div style="background:#f9f4e8;border:1px solid rgba(196,154,54,0.25);border-radius:12px;padding:22px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:28px;">${catEmoji}</span>
        <div>
          <h2 style="color:#1a1208;margin:0;font-size:20px;">${title}</h2>
          ${isPremium ? `<span style="font-size:11px;color:#c49a36;font-weight:700;">👑 PREMIUM CLASS</span>` : ''}
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${timeString ? `<tr><td style="padding:8px 0;color:#6b5a3e;width:38%;">📅 Scheduled For</td><td style="padding:8px 0;color:#1a1208;font-weight:700;">${timeString}</td></tr>` : ''}
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:8px 0;color:#6b5a3e;">⏱ Duration</td><td style="padding:8px 0;color:#1a1208;font-weight:600;">${duration} minutes</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:8px 0;color:#6b5a3e;">👤 Instructor</td><td style="padding:8px 0;color:#1a1208;font-weight:600;">${instructor}</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:8px 0;color:#6b5a3e;">${catEmoji} Style</td><td style="padding:8px 0;color:#1a1208;font-weight:600;">${category}</td></tr>
        <tr style="border-top:1px solid rgba(196,154,54,0.1);"><td style="padding:8px 0;color:#6b5a3e;">📊 Level</td><td style="padding:8px 0;color:#1a1208;font-weight:600;">${level?.replace('_', ' ')}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <p style="color:#1a1208;font-size:14px;font-weight:700;margin-bottom:14px;">
        🎯 This class was personally scheduled for you based on your preferred time!
      </p>
      <a href="${siteUrl}/premium-classes" style="display:inline-block;background:linear-gradient(135deg,#c49a36,#f0c060);color:#000;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 6px 20px rgba(196,154,54,0.35);">
        View My Personal Classes →
      </a>
    </div>
    <div style="background:#f0faf4;border:1px solid rgba(76,211,137,0.2);border-radius:10px;padding:14px;">
      <p style="color:#005f2b;font-size:13px;margin:0;line-height:1.6;">
        🔔 You will receive reminder emails <strong>1 hour</strong>, <strong>30 minutes</strong>, and <strong>10 minutes</strong> before the class starts.
      </p>
    </div>
  </div>
  <div style="background:linear-gradient(135deg,rgba(196,154,54,0.08),rgba(196,154,54,0.04));border-top:1px solid rgba(196,154,54,0.2);padding:18px 32px;text-align:center;">
    <p style="color:#c49a36;font-size:12px;font-weight:700;margin:0 0 4px;">🎯 Personally Scheduled · Yoga Temple</p>
    <p style="color:#9a8a6a;font-size:11px;margin:0;">© ${new Date().getFullYear()} Yoga Temple · Namaste 🙏</p>
  </div>
</div>
</body>
</html>`;

    await t.sendMail({
      from:    getSender(),
      to:      user.email,
      subject: `🎯 A ${category} Class Has Been Personally Scheduled For You — ${timeString || title}`,
      html,
      text: `Namaste ${user.name},\n\nA ${category} class "${title}" has been personally scheduled for you!\n\n${timeString ? `Time: ${timeString}\n` : ''}Instructor: ${instructor}\nDuration: ${duration} minutes\n\nVisit: ${siteUrl}/premium-classes\n\nॐ Yoga Temple`,
    });

    console.log(`✅ Personal class notification sent → ${user.email}`);
  } catch (err) {
    console.error(`sendPersonalClassNotification → ${user.email}:`, err.message);
  }
}