// src/app/api/admin/me/route.js
import { NextResponse }      from 'next/server';
import { verifyAdminToken }  from '@/lib/adminAuth';
import prisma                from '@/lib/prisma';

export async function GET() {
  try {
    const payload = await verifyAdminToken();
    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const admin = await prisma.adminAccount.findUnique({
      where:  { id: payload.adminId },
      select: { id: true, name: true, email: true, username: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin account not found or disabled' },
        { status: 401 },
      );
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error('Admin me error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 },
    );
  }
}