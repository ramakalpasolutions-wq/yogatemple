// src/app/api/admin/bookings/route.js
import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma               from '@/lib/prisma';

/* ══════════════════════════════════════════════════════
   GET — fetch bookings (with optional source filter)
══════════════════════════════════════════════════════ */
export async function GET(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status  = searchParams.get('status');
    const source  = searchParams.get('source'); // 'floating' | null (all)
    const limit   = parseInt(searchParams.get('limit')  || '200', 10);
    const offset  = parseInt(searchParams.get('offset') || '0',   10);

    /* ── Build where clause ── */
    const where = {};

    /* Filter by status */
    if (status && status !== 'ALL') where.status = status;

    /* ── Source filter ──
       Floating button bookings have sessionTitle = 'Required Session'
       OR have notes containing 'Required Session'
       OR have type = 'REQUIRED' (if you want to add that field)
       We use sessionTitle to distinguish them.
    */
    if (source === 'floating') {
      where.OR = [
        { sessionTitle: { contains: 'Required Session', mode: 'insensitive' } },
        { notes: { contains: 'Required Session', mode: 'insensitive' } },
        { type: 'REQUIRED' },
      ];
    }

    /* ── Fetch bookings ── */
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { bookedAt: 'desc' },
      take:    limit,
      skip:    offset,
    });

    /* ── Stats from ALL bookings (not filtered) ── */
    const allBookings = await prisma.booking.findMany({
      select: { status: true, amount: true, sessionTitle: true, type: true, notes: true },
    });

    /* Floating bookings count */
    const floatingBookings = allBookings.filter(b =>
      b.sessionTitle?.toLowerCase().includes('required session') ||
      b.notes?.toLowerCase().includes('required session') ||
      b.type === 'REQUIRED'
    );

    const stats = {
      total:     allBookings.length,
      confirmed: allBookings.filter(b => b.status === 'CONFIRMED').length,
      attended:  allBookings.filter(b => b.status === 'ATTENDED').length,
      cancelled: allBookings.filter(b => b.status === 'CANCELLED').length,
      pending:   allBookings.filter(b => b.status === 'PENDING').length,
      revenue:   allBookings
        .filter(b => ['CONFIRMED', 'ATTENDED'].includes(b.status))
        .reduce((sum, b) => sum + (b.amount || 0), 0),
      /* Floating specific stats */
      floatingTotal:     floatingBookings.length,
      floatingConfirmed: floatingBookings.filter(b => b.status === 'CONFIRMED').length,
      floatingRevenue:   floatingBookings
        .filter(b => ['CONFIRMED', 'ATTENDED'].includes(b.status))
        .reduce((sum, b) => sum + (b.amount || 0), 0),
    };

    return NextResponse.json({ bookings, total: allBookings.length, stats });

  } catch (error) {
    console.error('Admin bookings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ══════════════════════════════════════════════════════
   PATCH — update booking status / meetLink / notes
══════════════════════════════════════════════════════ */
export async function PATCH(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });

    const body = await req.json();
    const { status, notes, meetLink } = body;

    const VALID_STATUSES = ['CONFIRMED', 'CANCELLED', 'ATTENDED', 'PENDING'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const data = {};
    if (status   !== undefined) data.status   = status;
    if (notes    !== undefined) data.notes    = notes;
    if (meetLink !== undefined) data.meetLink = meetLink;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Admin bookings PATCH error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ══════════════════════════════════════════════════════
   DELETE — remove a booking
══════════════════════════════════════════════════════ */
export async function DELETE(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });

    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    console.error('Admin bookings DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}