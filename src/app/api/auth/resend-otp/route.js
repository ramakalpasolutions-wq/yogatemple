// src/app/api/auth/resend-otp/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mailer';

function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const otp       = genOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data:  { otp, otpExpiry },
    });

    await sendOTPEmail(email, otp, user.name);

    return NextResponse.json({ message: 'OTP resent!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}