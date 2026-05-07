// src/app/api/admin/classes/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role?.toUpperCase() === 'ADMIN') return true;
  try {
    const { verifyAdminToken } = await import('@/lib/adminAuth');
    const tok = await verifyAdminToken();
    if (tok) return true;
  } catch (_) {}
  return false;
}

/* GET */
export async function GET() {
  try {
    const ok = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const classes = await prisma.class.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Admin classes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

/* DELETE — also deletes R2 object */
export async function DELETE(req) {
  try {
    const ok = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 });

    const cls = await prisma.class.findUnique({ where: { id } });
    await prisma.class.delete({ where: { id } });

    /* Delete R2 video (non-blocking) */
    if (cls?.videoKey) {
      try {
        const { deleteR2Object } = await import('@/lib/r2');
        await deleteR2Object(cls.videoKey);
        console.log(`🗑️ R2 object deleted: ${cls.videoKey}`);
      } catch (e) {
        console.error('R2 delete failed (non-fatal):', e.message);
      }
    }

    /* Delete Google Calendar event (non-blocking) */
    if (cls?.calendarEventId) {
      try {
        const { deleteMeetEvent } = await import('@/lib/googleMeet');
        await deleteMeetEvent(cls.calendarEventId);
      } catch (e) {
        console.error('Calendar delete failed (non-fatal):', e.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin class DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

/* PATCH — now accepts videoKey + videoUrl from R2 */
export async function PATCH(req) {
  try {
    const ok = await requireAdmin();
    if (!ok) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 });

    const body = await req.json();
    const updateData = {};

    const fields = [
      'videoUrl', 'videoKey', 'image', 'title', 'description',
      'isActive', 'isPublished', 'isPremium', 'level', 'category',
      'scheduledAt', 'instructor', 'duration', 'maxParticipants',
      'googleMeetLink', 'tags',
    ];

    for (const field of fields) {
      if (body[field] === undefined) continue;
      if (field === 'scheduledAt') {
        updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
      } else if (field === 'isPremium') {
        updateData.isPremium = Boolean(body.isPremium);
      } else {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.class.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin class PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}