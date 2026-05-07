import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:              true,
        name:            true,
        email:           true,
        phone:           true,
        address:         true,   // preferred time + problems + source
        avatar:          true,
        role:            true,
        isVerified:      true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive:        true,
        provider:        true,
        lastLogin:       true,
        createdAt:       true,
        updatedAt:       true,
        subscription: {
          select: {
            plan:              true,
            category:          true,
            isActive:          true,
            startDate:         true,
            endDate:           true,
            razorpayOrderId:   true,
            razorpayPaymentId: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id:                true,
            plan:              true,
            category:          true,
            amount:            true,
            currency:          true,
            status:            true,
            razorpayOrderId:   true,
            razorpayPaymentId: true,
            createdAt:         true,
          },
        },
      },
    });

    // Enrich each user: resolve planName from pricingPlan
    const enriched = await Promise.all(
      users.map(async (u) => {
        let planName = u.subscription?.plan || null;

        if (u.subscription?.razorpayOrderId) {
          try {
            const payment = await prisma.payment.findFirst({
              where:  { razorpayOrderId: u.subscription.razorpayOrderId },
              select: { plan: true },
            });
            if (payment?.plan) {
              const pricingPlan = await prisma.pricingPlan.findUnique({
                where:  { key: payment.plan },
                select: { name: true },
              });
              if (pricingPlan?.name) planName = pricingPlan.name;
            }
          } catch {}
        }

        // Check subscription actually active
        const sub = u.subscription;
        const isReallyActive =
          sub?.isActive === true &&
          sub?.endDate != null &&
          new Date(sub.endDate) > new Date();

        return {
          ...u,
          subscription: sub
            ? { ...sub, isActive: isReallyActive, planName }
            : null,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const updateData = {};

    if (body.role     !== undefined) updateData.role     = body.role;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const user = await prisma.user.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}