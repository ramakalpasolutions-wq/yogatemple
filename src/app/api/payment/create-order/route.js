// src/app/api/payment/create-order/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const VALID_CATEGORIES = [
  'HATHA', 'VINYASA', 'ASHTANGA', 'YIN', 'RESTORATIVE',
  'POWER', 'KUNDALINI', 'PRENATAL', 'KIDS', 'MEDITATION', 'PRANAYAMA',
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { plan: planKey, category } = await req.json();

    /* ── Fetch plan ── */
    const planData = await prisma.pricingPlan.findUnique({
      where: { key: planKey },
    });

    if (!planData || !planData.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
    }

    const isEnquiry      = planData.planType === 'ENQUIRY';
    const isCategoryDays = planData.planType === 'CATEGORY_DAYS' || !planData.planType;

    /* ── Category validation — only required for CATEGORY_DAYS ── */
    let normalizedCategory = null;

    if (isCategoryDays) {
      /* If planCategory is set and not ALL, use that; else require from request */
      if (planData.planCategory && planData.planCategory !== 'ALL') {
        normalizedCategory = planData.planCategory.toUpperCase();
      } else {
        /* Admin set ALL → user picks category */
        if (!category || !VALID_CATEGORIES.includes(category.toUpperCase())) {
          return NextResponse.json(
            { error: 'Please select a valid yoga category' },
            { status: 400 },
          );
        }
        normalizedCategory = category.toUpperCase();
      }

      /* Check existing active subscription */
      const existing = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });
      if (existing?.isActive && existing?.endDate && new Date(existing.endDate) > new Date()) {
        return NextResponse.json(
          { error: `You already have an active ${existing.plan} subscription valid until ${new Date(existing.endDate).toLocaleDateString('en-IN')}. Wait until it expires or contact support.` },
          { status: 400 },
        );
      }
    }

    /* ── Amount in paise ── */
    const finalAmount = Math.round(planData.price * 100);

    /* ── Create Razorpay order ── */
    let orderId = `order_demo_${Date.now()}`;

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && keyId.startsWith('rzp_')) {
      try {
        const Razorpay = require('razorpay');
        const rz = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await rz.orders.create({
          amount:   finalAmount,
          currency: 'INR',
          receipt:  `rcpt_${Date.now()}`,
          notes: {
            plan:     planKey,
            planType: planData.planType || 'CATEGORY_DAYS',
            category: normalizedCategory || 'N/A',
            userId:   session.user.id,
            userName: session.user.name,
          },
        });
        orderId = order.id;
      } catch (rzErr) {
        console.error('Razorpay order create error:', rzErr.message);
      }
    }

    /* ── Save pending payment ── */
    await prisma.payment.create({
      data: {
        userId:          session.user.id,
        plan:            planKey,
        category:        normalizedCategory,
        amount:          planData.price,
        currency:        'INR',
        razorpayOrderId: orderId,
        status:          'PENDING',
      },
    });

    return NextResponse.json({
      orderId,
      amount:   finalAmount,
      currency: 'INR',
      plan:     planKey,
      planType: planData.planType || 'CATEGORY_DAYS',
      category: normalizedCategory,
      keyId:    keyId || 'demo',
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}