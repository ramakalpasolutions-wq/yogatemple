// src/app/api/admin/pricing/route.js
import { NextResponse }     from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma               from '@/lib/prisma';

/* GET — fetch all plans ordered by sortOrder */
export async function GET() {
  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (err) {
    console.error('Pricing GET:', err);
    return NextResponse.json([]);
  }
}

/* PUT — create or update a single plan */
export async function PUT(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      key, price, features, badge, name,
      period, icon, sortOrder,
      /* ── NEW fields ── */
      planType,        // 'ENQUIRY' | 'CATEGORY_DAYS'
      durationDays,    // number — how many days the plan lasts (null for ENQUIRY)
      category,        // 'ALL' | 'HATHA' | 'VINYASA' … (null/ALL for ENQUIRY)
    } = body;

    if (!key)                             return NextResponse.json({ error: 'Plan key required'   }, { status: 400 });
    if (price === undefined || price < 0) return NextResponse.json({ error: 'Valid price required' }, { status: 400 });
    if (!name?.trim())                    return NextResponse.json({ error: 'Plan name required'   }, { status: 400 });

    /* ── Validate planType ── */
    const validTypes = ['ENQUIRY', 'CATEGORY_DAYS'];
    const resolvedType = validTypes.includes(planType) ? planType : 'CATEGORY_DAYS';

    /* ── For CATEGORY_DAYS: durationDays required ── */
    if (resolvedType === 'CATEGORY_DAYS') {
      if (!durationDays || Number(durationDays) < 1) {
        return NextResponse.json(
          { error: 'Duration (days) is required for category plans' },
          { status: 400 },
        );
      }
    }

    const VALID_CATS = [
      'ALL','HATHA','VINYASA','ASHTANGA','YIN','RESTORATIVE',
      'POWER','KUNDALINI','PRENATAL','KIDS','MEDITATION','PRANAYAMA',
    ];

    const data = {
      price:       Number(price),
      features:    Array.isArray(features)
        ? features.filter(f => typeof f === 'string' && f.trim())
        : [],
      badge:       badge  || '',
      name:        name.trim(),
      period:      period || '',
      icon:        icon   || '🧘',
      sortOrder:   Number(sortOrder) || 0,
      isActive:    true,
      /* ── New fields ── */
      planType:    resolvedType,
      durationDays: resolvedType === 'ENQUIRY' ? null : (Number(durationDays) || null),
      planCategory: resolvedType === 'ENQUIRY'
        ? null
        : (VALID_CATS.includes(category?.toUpperCase()) ? category.toUpperCase() : 'ALL'),
    };

    const plan = await prisma.pricingPlan.upsert({
      where:  { key },
      update: data,
      create: { key, ...data },
    });

    return NextResponse.json(plan);
  } catch (err) {
    console.error('Pricing PUT:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* PATCH — bulk reorder plans */
export async function PATCH(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { orderedKeys } = await req.json();

    if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    await Promise.all(
      orderedKeys.map((key, index) =>
        prisma.pricingPlan.update({
          where: { key },
          data:  { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true, updated: orderedKeys.length });
  } catch (err) {
    console.error('Pricing PATCH:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* DELETE — permanently remove a plan */
export async function DELETE(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Plan key required' }, { status: 400 });
    }

    await prisma.pricingPlan.delete({ where: { key } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pricing DELETE:', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}