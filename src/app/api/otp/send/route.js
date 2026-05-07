import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/mailer';
import { sendOTPSMS }   from '@/lib/twilio';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account with this email' },
        { status: 404 }
      );
    }

    const otp = generateOTP();
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data:  { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendOTPEmail(email, otp, user.name);
    if (user.phone) {
      try { await sendOTPSMS(user.phone, otp); }
      catch (e) { console.error('SMS error:', e.message); }
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}