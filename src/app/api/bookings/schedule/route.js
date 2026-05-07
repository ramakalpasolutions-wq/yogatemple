// src/app/api/bookings/schedule/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createOrder, verifyPaymentSignature } from '@/lib/razorpay';
import { sendBookingConfirmationSMS } from '@/lib/twilio';
import nodemailer from 'nodemailer';

// ── Email transporter ──
function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || process.env.EMAIL_USER;
}

function getSender() {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  return `"Yoga Temple 🧘" <${user}>`;
}

// ── Send booking emails ──
async function sendBookingEmails({ userName, userEmail, userPhone, date, time, amount, paymentId, bookingId }) {
  const t = getTransporter();
  if (!t) {
    console.log('📧 Email not configured. DEV Booking:', { userName, userEmail, date, time, bookingId });
    return;
  }

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const bookingRef = `#${bookingId.slice(-8).toUpperCase()}`;

  // ── User confirmation email ──
  const userHTML = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f4faf6;font-family:Arial,sans-serif;">
      <div style="max-width:540px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,95,43,0.12);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0a3d2e,#2ea065);padding:32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:10px;">✅</div>
          <h1 style="color:#fff;font-size:24px;margin:0 0 6px;font-family:Georgia,serif;">Booking Confirmed!</h1>
          <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;">Your required session is scheduled 🙏</p>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <h2 style="color:#1a1208;font-size:19px;margin:0 0 8px;font-family:Georgia,serif;">
            Namaste, ${userName}! 🙏
          </h2>
          <p style="color:#6b5a3e;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Your required session has been successfully booked and payment is confirmed.
          </p>

          <!-- Details Card -->
          <div style="background:#f0faf4;border-radius:14px;padding:20px;border:1px solid rgba(76,211,137,0.2);margin-bottom:20px;">
            <h3 style="color:#005f2b;font-size:12px;font-weight:700;margin:0 0 14px;letter-spacing:1px;text-transform:uppercase;">
              📋 Session Details
            </h3>
            ${[
              ['👤', 'Name',        userName],
              ['✉️', 'Email',       userEmail],
              ['📱', 'Phone',       userPhone || '—'],
              ['📅', 'Date',        formattedDate],
              ['⏰', 'Time',        time],
              ['💰', 'Amount Paid', `₹${amount}`],
              ['🆔', 'Booking Ref', bookingRef],
              ['💳', 'Payment ID',  paymentId || '—'],
            ].map(([icon, label, value], i, arr) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;${i < arr.length - 1 ? 'border-bottom:1px solid rgba(76,211,137,0.12);' : ''}">
                <span style="color:#6b5a3e;font-size:13px;">${icon} ${label}</span>
                <span style="color:#1a1208;font-size:13px;font-weight:700;text-align:right;max-width:60%;word-break:break-word;">${value}</span>
              </div>
            `).join('')}
          </div>

          <!-- Note -->
          <div style="background:#fff8e7;border-radius:12px;padding:14px;border:1px solid rgba(196,154,54,0.2);margin-bottom:24px;">
            <p style="color:#6b5a3e;font-size:13px;margin:0;line-height:1.6;">
              💡 <strong>What's next?</strong> Our team will contact you to confirm the session and share any joining details.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #c8e6d4;padding-top:18px;text-align:center;">
            <p style="color:#9a8a6a;font-size:11px;margin:0 0 4px;font-style:italic;">
              ॐ Lokāḥ Samastāḥ Sukhino Bhavantu ॐ
            </p>
            <p style="color:#c8e6d4;font-size:10px;margin:0;">🔐 Yoga Temple © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>`;

  // ── Admin notification email ──
  const adminHTML = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f4faf6;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,95,43,0.12);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1208,#3d2b00);padding:24px 32px;display:flex;align-items:center;gap:14px;">
          <div style="font-size:36px;">🔔</div>
          <div>
            <h1 style="color:#ffd78c;font-size:20px;margin:0 0 4px;font-family:Georgia,serif;">New Booking Alert!</h1>
            <p style="color:rgba(255,215,140,0.65);font-size:12px;margin:0;">Payment confirmed · Action required</p>
          </div>
        </div>

        <!-- Payment Badge -->
        <div style="background:linear-gradient(135deg,rgba(76,211,137,0.08),rgba(0,95,43,0.04));padding:14px 28px;border-bottom:2px solid rgba(76,211,137,0.15);">
          <span style="display:inline-flex;align-items:center;gap:6px;background:#2ea065;color:#fff;padding:6px 16px;border-radius:50px;font-size:11px;font-weight:700;letter-spacing:1px;">
            ✅ PAYMENT CONFIRMED · ₹${amount}
          </span>
          <span style="margin-left:10px;font-size:11px;color:#9a8a6a;">
            ${new Date().toLocaleString('en-IN')}
          </span>
        </div>

        <!-- Body -->
        <div style="padding:24px 28px;">

          <!-- Customer -->
          <h3 style="color:#005f2b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">👤 Customer Details</h3>
          <div style="background:#f9f9f9;border-radius:12px;padding:14px;border:1px solid #e8e8e8;margin-bottom:18px;">
            ${[
              ['👤', 'Name',  userName],
              ['✉️', 'Email', userEmail],
              ['📱', 'Phone', userPhone || '—'],
            ].map(([icon, label, value]) => `
              <div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f0f0f0;">
                <span style="color:#9a8a6a;font-size:13px;min-width:80px;">${icon} ${label}</span>
                <span style="color:#1a1208;font-size:13px;font-weight:600;">${value}</span>
              </div>
            `).join('')}
          </div>

          <!-- Session -->
          <h3 style="color:#005f2b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">📅 Session Details</h3>
          <div style="background:#f0faf4;border-radius:12px;padding:14px;border:1px solid rgba(76,211,137,0.2);margin-bottom:18px;">
            ${[
              ['📅', 'Date',        formattedDate],
              ['⏰', 'Time',        time],
              ['💰', 'Amount',      `₹${amount}`],
              ['🆔', 'Booking Ref', bookingRef],
              ['💳', 'Payment ID',  paymentId || '—'],
            ].map(([icon, label, value]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(76,211,137,0.1);">
                <span style="color:#6b5a3e;font-size:13px;">${icon} ${label}</span>
                <span style="color:#005f2b;font-size:13px;font-weight:700;">${value}</span>
              </div>
            `).join('')}
          </div>

          <!-- Action Required -->
          <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.18);border-radius:12px;padding:14px;margin-bottom:20px;">
            <p style="color:#dc2626;font-size:12px;font-weight:700;margin:0 0 4px;">⚠️ Action Required</p>
            <p style="color:#6b5a3e;font-size:13px;margin:0;line-height:1.5;">
              Contact the customer to confirm the session and share any joining details before the scheduled time.
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/bookings"
               style="display:inline-block;background:linear-gradient(135deg,#005f2b,#2ea065);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
              📋 View in Admin Panel →
            </a>
          </div>

          <div style="border-top:1px solid #e8e8e8;padding-top:14px;text-align:center;">
            <p style="color:#9a8a6a;font-size:10px;margin:0;">Yoga Temple Admin Notification · Auto-generated</p>
          </div>
        </div>
      </div>
    </body>
    </html>`;

  const FROM = getSender();

  // Send to user
  try {
    await t.sendMail({
      from:    FROM,
      to:      userEmail,
      subject: `✅ Booking Confirmed — Required Session on ${formattedDate} at ${time}`,
      html:    userHTML,
      text:    `Namaste ${userName},\n\nYour required session is confirmed!\n\nDate: ${formattedDate}\nTime: ${time}\nAmount: ₹${amount}\nBooking Ref: ${bookingRef}\n\nॐ Yoga Temple`,
    });
    console.log('✅ User booking email sent →', userEmail);
  } catch (e) {
    console.error('❌ User email failed:', e.message);
  }

  // Send to admin
  try {
    const adminEmail = getAdminEmail();
    if (adminEmail) {
      await t.sendMail({
        from:    FROM,
        to:      adminEmail,
        subject: `🔔 New Booking: ${userName} — ${formattedDate} at ${time} · ₹${amount}`,
        html:    adminHTML,
        text:    `New Booking!\n\nCustomer: ${userName}\nEmail: ${userEmail}\nPhone: ${userPhone || '—'}\nDate: ${formattedDate}\nTime: ${time}\nAmount: ₹${amount}\nBooking Ref: ${bookingRef}`,
      });
      console.log('✅ Admin booking email sent →', adminEmail);
    }
  } catch (e) {
    console.error('❌ Admin email failed:', e.message);
  }
}

// ── POST ──
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Please login first' }, { status: 401 });
    }

    const body   = await req.json();
    const { action } = body;

    // ── Step 1: Create Razorpay Order ──
    if (action === 'create-order') {
      const amount  = parseInt(process.env.NEXT_PUBLIC_BOOKING_AMOUNT || process.env.BOOKING_AMOUNT || '499', 10);
      const receipt = `booking_${Date.now()}`;
      const order   = await createOrder(amount, 'INR', receipt);
      return NextResponse.json({
        orderId:  order.id,
        amount,
        currency: 'INR',
        keyId:    process.env.RAZORPAY_KEY_ID,
      });
    }

    // ── Step 2: Verify Payment & Save Booking ──
    if (action === 'verify-payment') {
      const {
        razorpayOrderId, razorpayPaymentId, razorpaySignature,
        name, phone, email, date, time,
      } = body;

      if (!name || !email || !date || !time) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Verify signature
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      const amount      = parseInt(process.env.NEXT_PUBLIC_BOOKING_AMOUNT || process.env.BOOKING_AMOUNT || '499', 10);
      const scheduledAt = new Date(`${date}T${time}:00`);

      // Save booking
      const booking = await prisma.booking.create({
        data: {
          userId:       session.user.id,
          sessionTitle: 'Required Session',
          type:         'PERSONAL',
          status:       'CONFIRMED',
          paymentId:    razorpayPaymentId,
          amount,
          scheduledAt,
          notes:        `Name: ${name} | Phone: ${phone || ''} | Email: ${email}`,
        },
      });

      // Save payment record
      await prisma.payment.create({
        data: {
          userId:            session.user.id,
          plan:              'session_booking',
          amount,
          currency:          'INR',
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          status:            'PAID',
        },
      });

      // Send emails (non-blocking)
      sendBookingEmails({
        userName:  name,
        userEmail: email,
        userPhone: phone,
        date, time, amount,
        paymentId: razorpayPaymentId,
        bookingId: booking.id,
      }).catch(e => console.error('Email send error:', e.message));

      // Send SMS (non-blocking)
      if (phone) {
        sendBookingConfirmationSMS(
          phone,
          'Required Session',
          `${new Date(date + 'T00:00:00').toLocaleDateString('en-IN')} at ${time}`,
        ).catch(() => {});
      }

      return NextResponse.json({
        success:   true,
        bookingId: booking.id,
        message:   'Booking confirmed! Check your email for the receipt.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── GET (user's own bookings) ──
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const adminView = searchParams.get('admin') === 'true';

    // Admin: return all bookings with user info
    if (adminView) {
      const bookings = await prisma.booking.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { bookedAt: 'desc' },
      });
      const total = await prisma.booking.count();
      return NextResponse.json({ bookings, total });
    }

    // User: return own bookings
    const bookings = await prisma.booking.findMany({
      where:   { userId: session.user.id },
      include: { class: { select: { title: true, googleMeetLink: true } } },
      orderBy: { bookedAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}