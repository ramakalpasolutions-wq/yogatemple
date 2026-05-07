// src/app/api/classes/[id]/meet-link/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

// Link unlocks 5 minutes before class
const UNLOCK_MINUTES = 5;
// Website shows countdown 10 minutes before class
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = params;

    /* Auth */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please log in', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    /* Fetch class */
    const cls = await prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        type: true,
        isPremium: true,
        isActive: true,
        isPublished: true,
        scheduledAt: true,
        duration: true,
        googleMeetLink: true,
      },
    });

    if (!cls || !cls.isActive || !cls.isPublished) {
      return NextResponse.json(
        { error: 'Class not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (cls.type !== 'LIVE') {
      return NextResponse.json(
        { error: 'Not a live class', code: 'NOT_LIVE' },
        { status: 400 }
      );
    }

    if (!cls.scheduledAt) {
      return NextResponse.json(
        { error: 'No scheduled time', code: 'NO_SCHEDULE' },
        { status: 400 }
      );
    }

    /* Premium check */
    if (cls.isPremium) {
      const sub = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: { isActive: true, endDate: true },
      });
      const valid =
        sub?.isActive && (!sub.endDate || new Date(sub.endDate) > new Date());
      if (!valid) {
        return NextResponse.json(
          { error: 'Premium subscription required', code: 'NOT_SUBSCRIBED' },
          { status: 403 }
        );
      }
    }

    /* Time calculations */
    const now         = new Date();
    const start       = new Date(cls.scheduledAt);
    const end         = new Date(start.getTime() + cls.duration * 60 * 1000);
    const unlockTime  = new Date(start.getTime() - UNLOCK_MINUTES * 60 * 1000);
    const countdownTime = new Date(start.getTime() - 10 * 60 * 1000);

    const msUntilStart    = start.getTime() - now.getTime();
    const msUntilUnlock   = unlockTime.getTime() - now.getTime();
    const msUntilCountdown = countdownTime.getTime() - now.getTime();
    const hasEnded        = now > end;
    const isLiveNow       = now >= start && now < end;

    const payload = {
      scheduledAt:       start.toISOString(),
      unlockAt:          unlockTime.toISOString(),
      countdownAt:       countdownTime.toISOString(),
      endAt:             end.toISOString(),
      msUntilStart,
      msUntilUnlock,
      msUntilCountdown,
      hasEnded,
      isLiveNow,
      unlockBeforeMin:   UNLOCK_MINUTES,
      countdownBeforeMin: 10,
    };

    /* Ended */
    if (hasEnded) {
      return NextResponse.json(
        { code: 'ENDED', ...payload },
        { status: 410 }
      );
    }

    /* Too early — more than 10 min away */
    if (msUntilCountdown > 0) {
      return NextResponse.json(
        { code: 'TOO_EARLY', ...payload },
        { status: 200 }
      );
    }

    /* Countdown phase — 10 min to 5 min */
    if (msUntilUnlock > 0) {
      return NextResponse.json(
        { code: 'COUNTDOWN', ...payload },
        { status: 200 }
      );
    }

    /* Unlocked — within 5 min or live now */
    if (!cls.googleMeetLink) {
      return NextResponse.json(
        { error: 'Meet link not set', code: 'NO_LINK' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code:       isLiveNow ? 'LIVE_NOW' : 'UNLOCKED',
      meetLink:   cls.googleMeetLink,
      classTitle: cls.title,
      ...payload,
    });

  } catch (err) {
    console.error('meet-link error:', err);
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}