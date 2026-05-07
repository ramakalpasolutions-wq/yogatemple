// src/app/api/admin/contacts/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ── helper: normalise status coming from DB ──────────────────────────────────
function normaliseContact(c) {
  return {
    ...c,
    // MongoDB may have stored lowercase before schema was applied
    status: (c.status || 'NEW').toString().toUpperCase(),
  };
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    // ── Fetch raw without enum filter so old lowercase docs still come back ──
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contacts.map(normaliseContact));
  } catch (error) {
    console.error('Contacts GET error:', error);

    // ── Fallback: query MongoDB directly if Prisma enum clash ──
    if (
      error.message?.includes('not found in enum') ||
      error.message?.includes('ContactStatus')
    ) {
      try {
        const { MongoClient, ObjectId } = await import('mongodb');
        const client = new MongoClient(process.env.DATABASE_URL);
        await client.connect();
        const dbName = process.env.DATABASE_URL.split('/').pop().split('?')[0];
        const db = client.db(dbName);

        const raw = await db
          .collection('contacts')
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        await client.close();

        const contacts = raw.map(c => ({
          id:        c._id.toString(),
          name:      c.name,
          email:     c.email,
          phone:     c.phone || null,
          subject:   c.subject,
          message:   c.message,
          status:    (c.status || 'NEW').toUpperCase(),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

        return NextResponse.json(contacts);
      } catch (fallbackErr) {
        console.error('Fallback contacts error:', fallbackErr);
      }
    }

    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { status } = await req.json();

    const validStatuses = ['NEW', 'READ', 'REPLIED'];
    const upperStatus = (status || '').toUpperCase();

    if (!validStatuses.includes(upperStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data:  { status: upperStatus },
    });

    return NextResponse.json(normaliseContact(updated));
  } catch (error) {
    console.error('Contacts PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contacts DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}