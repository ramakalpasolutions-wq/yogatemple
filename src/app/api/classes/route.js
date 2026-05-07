// src/app/api/classes/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';
import { createMeetEvent }  from '@/lib/googleMeet';
import {
  sendAdminClassEmail,
  notifyUsersForNewClass,
  sendPersonalClassNotification,
} from '@/lib/mailer';

const LEVEL_MAP = {
  Beginner:'BEGINNER', Intermediate:'INTERMEDIATE',
  Advanced:'ADVANCED', 'All Levels':'ALL_LEVELS',
  BEGINNER:'BEGINNER', INTERMEDIATE:'INTERMEDIATE',
  ADVANCED:'ADVANCED', ALL_LEVELS:'ALL_LEVELS',
};
const TYPE_MAP = {
  live:'LIVE', recorded:'RECORDED',
  LIVE:'LIVE', RECORDED:'RECORDED',
};
const CAT_MAP = {
  Hatha:'HATHA', Vinyasa:'VINYASA', Ashtanga:'ASHTANGA',
  Yin:'YIN', Restorative:'RESTORATIVE', Power:'POWER',
  Kundalini:'KUNDALINI', Prenatal:'PRENATAL', Kids:'KIDS',
  Meditation:'MEDITATION', Pranayama:'PRANAYAMA',
  HATHA:'HATHA', VINYASA:'VINYASA', ASHTANGA:'ASHTANGA',
  YIN:'YIN', RESTORATIVE:'RESTORATIVE', POWER:'POWER',
  KUNDALINI:'KUNDALINI', PRENATAL:'PRENATAL', KIDS:'KIDS',
  MEDITATION:'MEDITATION', PRANAYAMA:'PRANAYAMA',
};

async function requireAdmin() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role?.toUpperCase() === 'ADMIN') return true;
  } catch (_) {}
  try {
    const { verifyAdminToken } = await import('@/lib/adminAuth');
    const tok = await verifyAdminToken();
    if (tok) return true;
  } catch (_) {}
  return false;
}

function generateMeetLink(title = '') {
  const safe = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'yoga';
  const rand = Math.random().toString(36).slice(2, 6);
  return `https://meet.jit.si/YogaTemple-${safe}-${rand}`;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category  = searchParams.get('category');
    const type      = searchParams.get('type');
    const isPremium = searchParams.get('isPremium');
    const personal  = searchParams.get('personal');

    let currentUserId = null;
    try {
      const session = await getServerSession(authOptions);
      currentUserId = session?.user?.id || null;
    } catch (_) {}

    let classes = [];

    if (personal === 'true') {
      if (!currentUserId) return NextResponse.json([], { status: 200 });
      classes = await prisma.class.findMany({
        where: {
          isActive:     true,
          isPublished:  true,
          isPersonal:   true,
          targetUserId: currentUserId,
        },
        orderBy: { scheduledAt: 'asc' },
      });
    } else {
      const where = {
        isActive:   true,
        isPublished: true,
        isPersonal:  false,
      };
      if (category && category !== 'ALL') where.category = category.toUpperCase();
      if (type     && type     !== 'ALL') where.type     = type.toUpperCase();
      if (isPremium !== null && isPremium !== undefined && isPremium !== '') {
        where.isPremium = isPremium === 'true';
      }
      classes = await prisma.class.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }

    // ★ DEBUG LOG — check server terminal to see image values
    console.log('[GET /api/classes] Sample images:',
      classes.slice(0, 3).map(c => ({
        id:    c.id,
        title: c.title,
        image: c.image,
      }))
    );

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Classes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await req.json();

    // ★ Log exactly what arrives
    console.log('[POST /api/classes] Received body keys:', Object.keys(body));
    console.log('[POST /api/classes] image:', body.image);
    console.log('[POST /api/classes] thumbnail:', body.thumbnail);

    const {
      title,
      description     = '',
      instructor      = 'Yoga Temple',
      level           = 'ALL_LEVELS',
      type            = 'live',
      category        = 'HATHA',
      duration        = 60,
      maxParticipants = 30,
      isPremium       = false,
      image           = null,
      thumbnail       = null,
      videoUrl        = null,
      videoKey        = null,
      videoProvider   = null,
      scheduledAt     = null,
      price           = 0,
      tags            = [],
      isPersonal      = false,
      targetUserId    = null,
    } = body;

    // ★ Resolve image — accept either field name
    const resolvedImage = image || thumbnail || null;
    console.log('[POST /api/classes] resolvedImage:', resolvedImage);

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    if (isPersonal && !targetUserId) {
      return NextResponse.json(
        { error: 'Target user required for personal class' },
        { status: 400 }
      );
    }

    let targetUser = null;
    if (isPersonal && targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true, subscription: true },
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }
    }

    const normalLevel    = LEVEL_MAP[level]    || 'ALL_LEVELS';
    const normalType     = TYPE_MAP[type]      || 'LIVE';
    const normalCategory = CAT_MAP[category]   || 'HATHA';

    let meetLink = null;
    let eventId  = null;

    if (normalType === 'LIVE') {
      try {
        const meetData = await createMeetEvent({
          title, description, scheduledAt, durationMinutes: duration,
        });
        meetLink = meetData.meetLink;
        eventId  = meetData.eventId;
        console.log('✅ Meet link created:', meetLink);
      } catch (err) {
        console.error('⚠️ Meet creation failed:', err.message);
        meetLink = generateMeetLink(title);
        eventId  = `jitsi_${Date.now()}`;
      }
    }

    const newClass = await prisma.class.create({
      data: {
        title:           title.trim(),
        description:     description.trim(),
        instructor:      instructor.trim() || 'Yoga Temple',
        level:           normalLevel,
        type:            normalType,
        category:        normalCategory,
        duration:        Number(duration)        || 60,
        maxParticipants: Number(maxParticipants) || 30,
        isPremium:       Boolean(isPremium),
        // ★ THE KEY LINE — save resolvedImage to 'image' field
        image:           resolvedImage,
        videoUrl:        normalType === 'RECORDED' ? (videoUrl  || null) : null,
        videoKey:        normalType === 'RECORDED' ? (videoKey  || null) : null,
        videoProvider:   normalType === 'RECORDED' ? (videoProvider || null) : null,
        googleMeetLink:  meetLink,
        calendarEventId: eventId,
        scheduledAt:     scheduledAt ? new Date(scheduledAt) : null,
        price:           Number(price) || 0,
        tags:            Array.isArray(tags) ? tags : [],
        isActive:        true,
        isPublished:     true,
        isPersonal:      Boolean(isPersonal),
        targetUserId:    isPersonal ? targetUserId : null,
      },
    });

    // ★ Verify it saved correctly
    console.log(`✅ Class created: ${newClass.id} | "${newClass.title}" | image: ${newClass.image}`);

    Promise.allSettled([
      sendAdminClassEmail({
        adminEmail: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
        adminName:  'Admin',
        classData:  newClass,
      }),
      isPersonal && targetUser
        ? sendPersonalClassNotification({ user: targetUser, classData: newClass })
        : notifyUsersForNewClass({ classData: newClass }),
    ]).catch(e => console.error('Notification error:', e.message));

    return NextResponse.json(newClass, { status: 201 });

  } catch (error) {
    console.error('Class create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 });

    const body = await req.json();
    const updateData = {};

    if (body.title           !== undefined) updateData.title           = body.title;
    if (body.description     !== undefined) updateData.description     = body.description;
    if (body.instructor      !== undefined) updateData.instructor      = body.instructor;
    if (body.level           !== undefined) updateData.level           = LEVEL_MAP[body.level]  || body.level;
    if (body.category        !== undefined) updateData.category        = CAT_MAP[body.category] || body.category;
    if (body.isPremium       !== undefined) updateData.isPremium       = Boolean(body.isPremium);
    if (body.isActive        !== undefined) updateData.isActive        = Boolean(body.isActive);
    if (body.isPublished     !== undefined) updateData.isPublished     = Boolean(body.isPublished);
    if (body.videoUrl        !== undefined) updateData.videoUrl        = body.videoUrl;
    if (body.videoKey        !== undefined) updateData.videoKey        = body.videoKey;
    if (body.videoProvider   !== undefined) updateData.videoProvider   = body.videoProvider;
    if (body.googleMeetLink  !== undefined) updateData.googleMeetLink  = body.googleMeetLink;
    if (body.price           !== undefined) updateData.price           = Number(body.price)           || 0;
    if (body.duration        !== undefined) updateData.duration        = Number(body.duration)        || 60;
    if (body.maxParticipants !== undefined) updateData.maxParticipants = Number(body.maxParticipants) || 30;
    if (body.scheduledAt     !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    // ★ Accept both 'image' and 'thumbnail' in PATCH too
    if (body.image     !== undefined) updateData.image = body.image;
    if (body.thumbnail !== undefined) updateData.image = body.thumbnail; // map thumbnail → image

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.class.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Class PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 });

    const cls = await prisma.class.findUnique({ where: { id } });
    await prisma.class.delete({ where: { id } });

    if (cls?.calendarEventId) {
      import('@/lib/googleMeet')
        .then(({ deleteMeetEvent }) => deleteMeetEvent(cls.calendarEventId))
        .catch(e => console.error('Calendar delete failed:', e.message));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Class DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}