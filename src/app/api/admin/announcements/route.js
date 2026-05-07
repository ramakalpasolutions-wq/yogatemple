// src/app/api/admin/announcements/route.js
import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma               from '@/lib/prisma';

const DEFAULTS = [
  {
    key:     'live_session_left',
    title:   '🔴 Live Session',
    line1:   'New Batch Starts',
    line2:   'First Monday of Every Month',
    badge:   'JOIN NOW',
    color:   '#ef4444',
    visible: true,
  },
  {
    key:     'live_session_right',
    title:   '🧘 Online Classes',
    line1:   'Morning & Evening Batches',
    line2:   'All Levels Welcome',
    badge:   'ENROLL',
    color:   '#2ea065',
    visible: true,
  },
];

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ['announcement_left', 'announcement_right'] } },
    });

    const map = Object.fromEntries(rows.map(r => [r.key, JSON.parse(r.value)]));

    return NextResponse.json({
      left:  map['announcement_left']  ?? DEFAULTS[0],
      right: map['announcement_right'] ?? DEFAULTS[1],
    });
  } catch {
    return NextResponse.json({ left: DEFAULTS[0], right: DEFAULTS[1] });
  }
}

export async function PUT(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { side, data } = await req.json();
    if (!['left', 'right'].includes(side)) {
      return NextResponse.json({ error: 'side must be left or right' }, { status: 400 });
    }

    const key = `announcement_${side}`;
    await prisma.siteSetting.upsert({
      where:  { key },
      update: { value: JSON.stringify(data) },
      create: { key, value: JSON.stringify(data) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}