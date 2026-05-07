import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user)            return NextResponse.json({ error: 'User not found' },                        { status: 404 });
    if (user.otp !== otp) return NextResponse.json({ error: 'Invalid OTP' },                          { status: 400 });
    if (new Date() > user.otpExpiry)
                          return NextResponse.json({ error: 'OTP expired. Request a new one.' },       { status: 400 });

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data:  { isVerified: true, otp: null, otpExpiry: null },
    });

    try { await sendWelcomeEmail(email, user.name); }
    catch (e) { console.error('Welcome email failed:', e.message); }

    return NextResponse.json({ message: 'Email verified! You can now sign in. 🙏' });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}