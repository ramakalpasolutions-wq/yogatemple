// src/app/api/payment/verify/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';
import crypto               from 'crypto';

const VALID_CATEGORIES = [
  'HATHA', 'VINYASA', 'ASHTANGA', 'YIN', 'RESTORATIVE',
  'POWER', 'KUNDALINI', 'PRENATAL', 'KIDS', 'MEDITATION', 'PRANAYAMA',
];

/* ── Map plan key → SubscriptionPlan enum ── */
function getPlanEnum(planKey, durationDays) {
  const map = {
    monthly:   'MONTHLY',
    quarterly: 'QUARTERLY',
    annual:    'ANNUAL',
  };
  if (map[planKey]) return map[planKey];

  if (durationDays) {
    if (durationDays <= 31)  return 'MONTHLY';
    if (durationDays <= 100) return 'QUARTERLY';
    return 'ANNUAL';
  }

  return 'MONTHLY';
}

/* ── Send enquiry emails ── */
async function sendEnquiryEmails({ user, planData, lead }) {
  try {
    const { sendMail } = await import('@/lib/mailer');

    await sendMail({
      to:      process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `📋 New Enquiry Lead — ${user.name} (₹${planData.price})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#005f2b,#2ea065);padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">📋 New Enquiry Lead</h2>
            <p style="color:rgba(255,255,255,.8);margin:6px 0 0;">Payment received — customer wants to know more</p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #c8e6d4;border-top:none;border-radius:0 0 12px 12px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;width:140px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1a1208;">${user.name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1a1208;">${user.email}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1a1208;">${user.phone || 'Not provided'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">Plan</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#2ea065;">${planData.name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">Amount Paid</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#c49a36;">₹${planData.price}</td></tr>
              <tr><td style="padding:10px 0;color:#666;">Lead ID</td><td style="padding:10px 0;font-family:monospace;font-size:12px;color:#666;">${lead.id}</td></tr>
            </table>
            <div style="margin-top:20px;padding:14px;background:#f0faf4;border-radius:8px;border:1px solid #c8e6d4;">
              <p style="margin:0;font-size:13px;color:#2ea065;font-weight:700;">⚡ Action Required</p>
              <p style="margin:6px 0 0;font-size:13px;color:#444;">Please contact this customer within 24 hours to discuss their enquiry.</p>
            </div>
            <div style="margin-top:16px;text-align:center;">
              <a href="${process.env.NEXTAUTH_URL}/admin/enquiries" style="display:inline-block;background:linear-gradient(135deg,#4cd389,#2ea065);color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;">
                View in Admin Panel →
              </a>
            </div>
          </div>
        </div>
      `,
    });

    await sendMail({
      to:      user.email,
      subject: `✅ Enquiry Registered — Yoga Temple will contact you soon`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#005f2b,#2ea065);padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">✅ Enquiry Received!</h2>
            <p style="color:rgba(255,255,255,.8);margin:6px 0 0;">Thank you, ${user.name}! We'll reach out to you shortly.</p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #c8e6d4;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#1a1208;font-size:15px;line-height:1.7;">
              Hi <strong>${user.name}</strong>,<br><br>
              Your enquiry payment of <strong style="color:#c49a36;">₹${planData.price}</strong> for the
              <strong>${planData.name}</strong> has been received successfully.
            </p>
            <div style="background:#f0faf4;border:1px solid #c8e6d4;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;font-size:13px;color:#2ea065;font-weight:700;">📞 What happens next?</p>
              <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#444;line-height:1.8;">
                <li>Our team will review your enquiry</li>
                <li>We will contact you within 24 hours</li>
                <li>We'll discuss course details, schedule & pricing</li>
              </ul>
            </div>
            <p style="font-size:12px;color:#9a8a6a;margin-top:16px;">
              Reference ID: <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">${lead.id}</code>
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Enquiry email error (non-fatal):', err.message);
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan: planKey,
      category,
      planType: clientPlanType,
    } = await req.json();

    /* ── Fetch plan from DB ── */
    const planData = await prisma.pricingPlan.findUnique({
      where: { key: planKey },
    });

    if (!planData) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }

    const isEnquiry = planData.planType === 'ENQUIRY' || clientPlanType === 'ENQUIRY';

    /* ── Category validation for CATEGORY_DAYS ── */
    let normalizedCategory = null;
    if (!isEnquiry) {
      if (planData.planCategory && planData.planCategory !== 'ALL') {
        normalizedCategory = planData.planCategory.toUpperCase();
      } else if (category && VALID_CATEGORIES.includes(category.toUpperCase())) {
        normalizedCategory = category.toUpperCase();
      } else {
        return NextResponse.json(
          { error: 'Valid yoga category is required' },
          { status: 400 },
        );
      }
    }

    /* ── Verify Razorpay signature ── */
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && keySecret.length > 10) {
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expected !== razorpay_signature) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: razorpay_order_id },
          data:  { status: 'FAILED' },
        });
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    /* ── Update payment record ── */
    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:            'PAID',
        category:          normalizedCategory,
      },
    });

    /* ════════════════════════════════════════
       ENQUIRY PLAN
    ════════════════════════════════════════ */
    if (isEnquiry) {
      const user = await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { id: true, name: true, email: true, phone: true },
      });

      const lead = await prisma.enquiryLead.create({
        data: {
          userId:            session.user.id,
          userName:          user.name,
          userEmail:         user.email,
          userPhone:         user.phone || null,
          planKey,
          planName:          planData.name,
          amount:            planData.price,
          razorpayOrderId:   razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          status:            'NEW',
        },
      });

      sendEnquiryEmails({ user, planData, lead });

      return NextResponse.json({
        message:  '✅ Enquiry registered! Our team will contact you within 24 hours.',
        type:     'ENQUIRY',
        leadId:   lead.id,
        planName: planData.name,
      });
    }

    /* ════════════════════════════════════════
       CATEGORY_DAYS PLAN
    ════════════════════════════════════════ */

    /* ── Get duration days ── */
    let days = planData.durationDays || null;

    if (!days && planData.period) {
      const match = planData.period.match(/(\d+)/);
      if (match) days = parseInt(match[1], 10);
    }

    if (!days) {
      const defaults = { monthly: 30, quarterly: 90, annual: 365 };
      days = defaults[planKey] || 30;
    }

    const planEnum = getPlanEnum(planKey, days);
    const now      = new Date();
    const endDate  = new Date();
    endDate.setDate(endDate.getDate() + days);

    /* ── Upsert subscription ── */
    await prisma.subscription.upsert({
      where:  { userId: session.user.id },
      update: {
        plan:              planEnum,
        planName:          planData.name,        // ★ saves "45 Days Hatha Plan"
        category:          normalizedCategory,
        startDate:         now,
        endDate,
        isActive:          true,
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      create: {
        userId:            session.user.id,
        plan:              planEnum,
        planName:          planData.name,        // ★ saves "45 Days Hatha Plan"
        category:          normalizedCategory,
        startDate:         now,
        endDate,
        isActive:          true,
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    return NextResponse.json({
      message:   `🎉 Subscription activated for ${normalizedCategory}!`,
      type:      'CATEGORY_DAYS',
      category:  normalizedCategory,
      plan:      planEnum,
      planKey,
      planName:  planData.name,
      days,
      endDate:   endDate.toISOString(),
      startDate: now.toISOString(),
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}