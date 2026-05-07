// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // ── Auth: cookie-based admin token ──
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    const [
      totalUsers,
      totalClasses,
      totalBookings,
      newContacts,
      activeSubscriptions,
      recentUsers,
      recentBookings,
      payments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.class.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.contact.count({ where: { status: 'NEW' } }),
      prisma.subscription.count({ where: { isActive: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id:        true,
          name:      true,
          email:     true,
          role:      true,
          createdAt: true,
        },
      }),
      prisma.booking.findMany({
        orderBy: { bookedAt: 'desc' },
        take: 5,
        include: {
          user:  { select: { name: true } },
          class: { select: { title: true } },
        },
      }),
      prisma.payment.findMany({
        where:  { status: 'PAID' },
        select: { amount: true },
      }),
    ]);

    const totalRevenue = payments.reduce(
      (sum, p) => sum + (p.amount || 0), 0
    );

    const formattedBookings = recentBookings.map(b => ({
      _id:          b.id,
      sessionTitle: b.class?.title || b.sessionTitle || 'Unknown',
      user:         b.user,
      scheduledAt:  b.scheduledAt,
      createdAt:    b.bookedAt,
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalClasses,
        totalBookings,
        newContacts,
        activeSubscriptions,
        totalRevenue,
      },
      recentUsers:    recentUsers.map(u => ({ ...u, _id: u.id })),
      recentBookings: formattedBookings,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    );
  }
}