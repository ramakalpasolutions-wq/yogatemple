// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// ── Safe dynamic mailer import ──
async function sendRegistrationOTP(email, otp, name) {
  try {
    const mailer = await import('@/lib/mailer');
    
    // Try all common export names
    const sendFn =
      mailer.sendOTPEmail ||
      mailer.sendOtp ||
      mailer.sendOTP ||
      mailer.sendEmail ||
      mailer.default?.sendOTPEmail ||
      mailer.default?.sendOtp ||
      mailer.default?.sendOTP ||
      mailer.default?.sendEmail ||
      (typeof mailer.default === 'function' ? mailer.default : null);

    if (typeof sendFn === 'function') {
      await sendFn(email, otp, name);
      console.log(`✅ OTP email sent to ${email}`);
    } else {
      // Log all available exports for debugging
      console.warn('⚠️ No email function found. Available exports:', Object.keys(mailer));
      console.log(`📧 DEV — OTP for ${email}: ${otp}`);
    }
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    console.log(`📧 DEV fallback — OTP for ${email}: ${otp}`);
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const {
      name, email, phone, password,
      address, howKnow, preferredTime,
    } = await req.json();

    // ── Validation ──
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Check existing ──
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing?.isVerified) {
      return NextResponse.json(
        { error: 'Email already registered. Please sign in.' },
        { status: 400 }
      );
    }

    // ── Hash password ──
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Generate OTP ──
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // ── Build structured address field ──
    const addressParts = [];
    if (address?.trim())       addressParts.push(`Problems: ${address.trim()}`);
    if (howKnow?.trim())       addressParts.push(`Source: ${howKnow.trim()}`);
    if (preferredTime?.trim()) addressParts.push(`Preferred Time: ${preferredTime.trim()}`);
    const addressData = addressParts.join(' | ') || null;

    // ── Upsert user ──
    if (existing) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          name:       name.trim(),
          password:   hashedPassword,
          phone:      phone?.trim() || null,
          address:    addressData,
          otp,
          otpExpiry,
          isVerified: false,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name:       name.trim(),
          email:      normalizedEmail,
          phone:      phone?.trim() || null,
          password:   hashedPassword,
          address:    addressData,
          otp,
          otpExpiry,
          isVerified:      false,
          isEmailVerified: false,
          isPhoneVerified: false,
          role:            'USER',
        },
      });
    }

    // ── Send OTP email (non-blocking) ──
    await sendRegistrationOTP(normalizedEmail, otp, name.trim());

    return NextResponse.json({
      message: 'Registration successful! Please check your email for the OTP.',
      email: normalizedEmail,
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed: ' + error.message },
      { status: 500 }
    );
  }
}