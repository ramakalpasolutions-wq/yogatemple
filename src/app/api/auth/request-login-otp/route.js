// src/app/api/auth/request-login-otp/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mailer';
import { sendOTPSMS } from '@/lib/twilio';

function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { identifier, type } = await req.json();
    // type: 'email' | 'phone'

    const user = await prisma.user.findFirst({
      where: type === 'email'
        ? { email: identifier.toLowerCase() }
        : { phone: identifier },
    });

    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    if (!user.isVerified) return NextResponse.json({ error: 'Account not verified' }, { status: 400 });

    const otp       = genOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP
    await prisma.user.update({
      where: { id: user.id },
      data: type === 'email'
        ? { otp, otpExpiry }
        : { phoneOtp: otp, phoneOtpExpiry: otpExpiry },
    });

    if (type === 'email') {
      await sendOTPEmail(user.email, otp, user.name);
    } else {
      const sms = await sendOTPSMS(identifier, otp);
      if (sms.skipped) console.log(`📱 Login OTP for ${identifier}: ${otp}`);
    }

    return NextResponse.json({
      message: `OTP sent to your ${type}`,
      email: user.email,
    });
  } catch (error) {
    console.error('Login OTP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}