// src/app/api/video/[classId]/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';
import { getPresignedGetUrl, getPublicUrl } from '@/lib/r2';

export async function GET(req, { params }) {
  try {
    const { classId } = params;

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls || !cls.isActive) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (!cls.videoUrl && !cls.videoKey) {
      return NextResponse.json({ error: 'No video for this class' }, { status: 404 });
    }

    /* ── FREE class → return public URL directly, no auth needed ── */
    if (!cls.isPremium) {
      // If stored as R2 key, build public URL
      const url = cls.videoKey
        ? (getPublicUrl(cls.videoKey) || cls.videoUrl)
        : cls.videoUrl;
      return NextResponse.json({ url, type: 'public' });
    }

    /* ── PREMIUM class → check subscription ── */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Login required to watch premium videos' }, { status: 401 });
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const isActive =
      sub?.isActive === true &&
      sub?.endDate &&
      new Date(sub.endDate) > new Date();

    if (!isActive) {
      return NextResponse.json(
        { error: 'Active subscription required. Subscribe to watch premium classes.' },
        { status: 403 },
      );
    }

    /* ── Category match ── */
    if (sub.category && cls.category) {
      const userCat = sub.category.toUpperCase();
      const clsCat  = cls.category.toUpperCase();
      if (userCat !== clsCat) {
        return NextResponse.json(
          {
            error: `Your ${userCat} subscription cannot access ${clsCat} classes.`,
            requiredCategory: clsCat,
            yourCategory: userCat,
          },
          { status: 403 },
        );
      }
    }

    /* ── Generate presigned GET URL (2 hours) ── */
    if (cls.videoKey) {
      const url = await getPresignedGetUrl(cls.videoKey, 7200);
      return NextResponse.json({ url, type: 'presigned', expiresIn: 7200 });
    }

    /* ── Fallback: videoUrl is already a public/CDN URL ── */
    return NextResponse.json({ url: cls.videoUrl, type: 'public' });

  } catch (err) {
    console.error('Video route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}