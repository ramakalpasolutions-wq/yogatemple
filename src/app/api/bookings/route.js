import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendBookingConfirmationSMS } from '@/lib/twilio';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where:   { userId: session.user.id },
      include: { class: { select: { title: true, googleMeetLink: true } } },
      orderBy: { bookedAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Booking a specific class
    if (body.classId) {
      const yogaClass = await prisma.class.findUnique({
        where: { id: body.classId },
      });

      if (!yogaClass) {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 });
      }

      // Check if already booked
      const existing = await prisma.booking.findFirst({
        where: { userId: session.user.id, classId: body.classId },
      });

      if (existing) {
        return NextResponse.json({ error: 'Already booked this class' }, { status: 400 });
      }

      const booking = await prisma.booking.create({
        data: {
          userId:       session.user.id,
          classId:      body.classId,
          sessionTitle: yogaClass.title,
          type:         yogaClass.type === 'LIVE' ? 'LIVE' : 'RECORDED',
          scheduledAt:  yogaClass.scheduledAt || new Date(),
          status:       'CONFIRMED',
          meetLink:     yogaClass.googleMeetLink || null,
          amount:       yogaClass.price || 0,
        },
      });

      // Increment enrolled count
      await prisma.class.update({
        where: { id: body.classId },
        data:  { enrolledCount: { increment: 1 } },
      });

      return NextResponse.json(booking, { status: 201 });
    }

    // Booking a counseling/training session
    if (!body.sessionTitle || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'Session title and date required' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId:       session.user.id,
        sessionTitle: body.sessionTitle,
        type:         body.type   || 'counseling',
        scheduledAt:  new Date(body.scheduledAt),
        status:       'CONFIRMED',
        notes:        body.notes  || null,
        amount:       Number(body.amount) || 0,
      },
    });

    // SMS confirmation
    if (session.user.phone) {
      try {
        const dateStr = new Date(body.scheduledAt).toLocaleString('en-IN');
        await sendBookingConfirmationSMS(
          session.user.phone,
          body.sessionTitle,
          dateStr
        );
      } catch (e) {
        console.error('SMS error:', e.message);
      }
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Booking create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}