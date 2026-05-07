// src/app/api/admin/enquiries/route.js
import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma               from '@/lib/prisma';

/* GET — all enquiry leads */
export async function GET(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'NEW'|'CONTACTED'|'CLOSED'|null

    const where = {};
    if (status && status !== 'ALL') where.status = status;

    const leads = await prisma.enquiryLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const all = await prisma.enquiryLead.findMany({
      select: { status: true, amount: true },
    });

    const stats = {
      total:     all.length,
      newLeads:  all.filter(l => l.status === 'NEW').length,
      contacted: all.filter(l => l.status === 'CONTACTED').length,
      closed:    all.filter(l => l.status === 'CLOSED').length,
      revenue:   all.reduce((s, l) => s + (l.amount || 0), 0),
    };

    return NextResponse.json({ leads, stats });
  } catch (err) {
    console.error('Enquiries GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* PATCH — update lead status / adminNotes */
export async function PATCH(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    const body = await req.json();
    const data = {};

    const VALID = ['NEW', 'CONTACTED', 'CLOSED'];
    if (body.status && VALID.includes(body.status)) data.status = body.status;
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const lead = await prisma.enquiryLead.update({ where: { id }, data });
    return NextResponse.json(lead);
  } catch (err) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* DELETE */
export async function DELETE(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    await prisma.enquiryLead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}