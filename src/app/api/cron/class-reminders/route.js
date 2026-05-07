import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  sendReminderToUser,
  sendPremiumClassReminderToUser,
  sendReminderToAdmin,
} from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Milestones in minutes
const MILESTONES = [60, 30, 10];
const WINDOW = 2; // ±2 minute window

export async function GET(req) {
  /* ── Security ── */
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET || 'yoga-temple-cron-2024';

  if (authHeader !== `Bearer ${secret}`) {
    console.log('❌ Cron auth failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = [];

    console.log(`\n🕐 Cron running: ${now.toISOString()}`);

    for (const milestone of MILESTONES) {
      const windowStart = new Date(
        now.getTime() + (milestone - WINDOW) * 60 * 1000
      );
      const windowEnd = new Date(
        now.getTime() + (milestone + WINDOW) * 60 * 1000
      );

      console.log(
        `🔍 [${milestone}min] Window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`
      );

      /* ── Fetch ALL live classes in this window ── */
      const classes = await prisma.class.findMany({
        where: {
          type:        'LIVE',
          isActive:    true,
          isPublished: true,
          scheduledAt: { gte: windowStart, lte: windowEnd },
          NOT: {
            reminderMilestones: { has: String(milestone) },
          },
        },
      });

      console.log(
        `📋 [${milestone}min] Found ${classes.length} live class(es)`
      );

      for (const cls of classes) {
        const classCategory = cls.category?.toUpperCase();
        const isPremium     = cls.isPremium === true;

        console.log(
          `\n📌 "${cls.title}" | isPremium=${isPremium} | category=${classCategory}`
        );

        const classData = {
          title:       cls.title,
          category:    cls.category,
          level:       cls.level,
          scheduledAt: cls.scheduledAt?.toISOString(),
          duration:    cls.duration,
          instructor:  cls.instructor,
          meetLink:    cls.googleMeetLink,
          isPremium,
          milestone,
        };

        let usersSent  = 0;
        let totalTarget = 0;

        /* ════════════════════════════════════════
           CASE A — FREE LIVE CLASS
           → Send to ALL active + verified users
        ════════════════════════════════════════ */
        if (!isPremium) {
          const allUsers = await prisma.user.findMany({
            where: {
              isVerified: true,
              isActive:   true,
              role:       'USER', // exclude admins/instructors
            },
            select: { id: true, email: true, name: true },
          });

          totalTarget = allUsers.length;
          console.log(
            `   🆓 FREE class → sending to ${totalTarget} verified users`
          );

          for (const user of allUsers) {
            if (!user.email) continue;
            try {
              const ok = await sendReminderToUser({
                userEmail: user.email,
                userName:  user.name || 'Yogi',
                classData,
              });
              if (ok) usersSent++;
              // Small delay to avoid Gmail rate limits
              await new Promise(r => setTimeout(r, 80));
            } catch (err) {
              console.error(
                `   ❌ Failed to send to ${user.email}:`, err.message
              );
            }
          }
        }

        /* ════════════════════════════════════════
           CASE B — PREMIUM LIVE CLASS
           → Send ONLY to active subscribers
             whose category EXACTLY matches
             this class's category
        ════════════════════════════════════════ */
        else {
          const categorySubscribers = await prisma.subscription.findMany({
            where: {
              isActive: true,
              endDate:  { gt: now },
              // Exact category match — case-insensitive via normalization
              category: classCategory,
            },
            include: {
              user: {
                select: {
                  id:       true,
                  email:    true,
                  name:     true,
                  isActive: true,
                  isVerified: true,
                },
              },
            },
          });

          totalTarget = categorySubscribers.length;
          console.log(
            `   👑 PREMIUM class (${classCategory}) → ${totalTarget} matching subscribers`
          );

          for (const sub of categorySubscribers) {
            // Skip inactive or unverified users
            if (!sub.user?.email)            continue;
            if (!sub.user?.isActive)         continue;
            if (!sub.user?.isVerified)       continue;

            try {
              const ok = await sendPremiumClassReminderToUser({
                userEmail: sub.user.email,
                userName:  sub.user.name || 'Yogi',
                classData,
              });
              if (ok) usersSent++;
              await new Promise(r => setTimeout(r, 80));
            } catch (err) {
              console.error(
                `   ❌ Failed to send to ${sub.user.email}:`, err.message
              );
            }
          }
        }

        /* ── Admin alert at 30min for ALL live classes ── */
        if (milestone === 30) {
          try {
            await sendReminderToAdmin({
              classData,
              attendeeCount: totalTarget,
            });
            console.log(`   📧 Admin notified (30min alert)`);
          } catch (err) {
            console.error('   ❌ Admin alert failed:', err.message);
          }
        }

        /* ── Mark milestone as sent ── */
        await prisma.class.update({
          where: { id: cls.id },
          data: {
            reminderMilestones: { push: String(milestone) },
            reminderSent:       true,
          },
        });

        const result = {
          classId:    cls.id,
          title:      cls.title,
          category:   classCategory,
          isPremium,
          milestone,
          usersSent,
          totalTarget,
        };

        results.push(result);

        console.log(
          `   ✅ Done — ${usersSent}/${totalTarget} emails sent`
        );
      }
    }

    return NextResponse.json({
      success:   true,
      processed: results.length,
      results,
      checkedAt: now.toISOString(),
    });

  } catch (err) {
    console.error('❌ Cron error:', err);
    return NextResponse.json(
      { error: err.message || 'Cron failed' },
      { status: 500 }
    );
  }
}