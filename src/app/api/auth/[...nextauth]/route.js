// src/app/api/auth/[...nextauth]/route.js
import NextAuth            from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt              from 'bcryptjs';
import prisma              from '@/lib/prisma';

/* ── helper: build clean subscription object ── */
function buildSubscription(sub) {
  if (!sub) {
    return { isActive: false, plan: 'NONE', planName: null, category: null, endDate: null };
  }

  const isStillActive =
    sub.isActive === true &&
    sub.endDate  != null  &&
    new Date(sub.endDate) > new Date();

  return {
    isActive:  isStillActive,
    plan:      sub.plan      || 'NONE',
    planName:  sub.planName  || null,   // ★ real plan name e.g. "45 Days Hatha Plan"
    category:  sub.category  || null,
    endDate:   sub.endDate   ? new Date(sub.endDate).toISOString() : null,
    startDate: sub.startDate ? new Date(sub.startDate).toISOString() : null,
  };
}

/* ── helper: fetch fresh subscription from DB ── */
async function fetchFreshSubscription(userId) {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return buildSubscription(null);

    const built = buildSubscription(sub);

    // Auto-deactivate in DB if expired but still marked active
    if (sub.isActive && !built.isActive) {
      await prisma.subscription
        .update({ where: { userId }, data: { isActive: false } })
        .catch(() => {});
    }

    return built;
  } catch {
    return buildSubscription(null);
  }
}

/* ══════════════════════════════════════════════════════════════
   AUTH OPTIONS
══════════════════════════════════════════════════════════════ */
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:     { label: 'Email',     type: 'text'     },
        phone:     { label: 'Phone',     type: 'text'     },
        password:  { label: 'Password',  type: 'password' },
        otp:       { label: 'OTP',       type: 'text'     },
        loginType: { label: 'LoginType', type: 'text'     },
      },

      async authorize(credentials) {
        const { email, phone, password, otp, loginType } = credentials || {};

        /* ── OTP login ── */
        if (loginType === 'otp') {
          const user = await prisma.user.findFirst({
            where:   email ? { email: email.toLowerCase() } : { phone },
            include: { subscription: true },
          });

          if (!user)            throw new Error('Account not found');
          if (!user.isVerified) throw new Error('Account not verified');

          if (email && user.otp) {
            if (user.otp !== otp)            throw new Error('Invalid OTP');
            if (new Date() > user.otpExpiry) throw new Error('OTP expired');
            await prisma.user.update({
              where: { id: user.id },
              data:  { otp: null, otpExpiry: null, lastLogin: new Date() },
            });
          } else if (phone && user.phoneOtp) {
            if (user.phoneOtp !== otp)            throw new Error('Invalid OTP');
            if (new Date() > user.phoneOtpExpiry) throw new Error('OTP expired');
            await prisma.user.update({
              where: { id: user.id },
              data:  { phoneOtp: null, phoneOtpExpiry: null, lastLogin: new Date() },
            });
          } else {
            throw new Error('No OTP pending. Please request a new OTP.');
          }

          return {
            id:           user.id,
            name:         user.name,
            email:        user.email,
            role:         user.role,
            image:        user.avatar || null,
            subscription: buildSubscription(user.subscription),
          };
        }

        /* ── Password login ── */
        if (!email || !password) throw new Error('Email and password are required');

        const user = await prisma.user.findUnique({
          where:   { email: email.toLowerCase() },
          include: { subscription: true },
        });

        if (!user || !user.password) throw new Error('Invalid credentials');
        if (!user.isVerified)        throw new Error('Please verify your email first');

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error('Invalid credentials');

        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLogin: new Date() },
        });

        return {
          id:           user.id,
          name:         user.name,
          email:        user.email,
          role:         user.role,
          image:        user.avatar || null,
          subscription: buildSubscription(user.subscription),
        };
      },
    }),
  ],

  /* ── Callbacks ── */
  callbacks: {

    /* ── JWT ── */
    async jwt({ token, user, trigger, session: updateData }) {
      // On initial sign-in
      if (user) {
        token.id           = user.id;
        token.role         = user.role;
        token.subscription = user.subscription;
      }

      // On manual session.update()
      if (trigger === 'update' && updateData?.subscription) {
        token.subscription = updateData.subscription;
      }

      // Refresh from DB on every token re-issue
      if (token.id) {
        token.subscription = await fetchFreshSubscription(token.id);

        try {
          const freshUser = await prisma.user.findUnique({
            where:  { id: token.id },
            select: { role: true },
          });
          if (freshUser) token.role = freshUser.role;
        } catch {}
      }

      return token;
    },

    /* ── Session — what useSession() returns to the client ── */
    async session({ session, token }) {
      if (!token?.sub) return session;

      session.user.id = token.sub;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id:              true,
            name:            true,
            email:           true,
            phone:           true,
            avatar:          true,
            role:            true,
            isVerified:      true,
            isEmailVerified: true,
            isPhoneVerified: true,
            isActive:        true,
            subscription: {
              select: {
                plan:      true,
                planName:  true,      // ★ read directly — no extra DB lookups
                category:  true,
                isActive:  true,
                startDate: true,
                endDate:   true,
              },
            },
          },
        });

        if (!dbUser) return session;

        /* Basic user fields */
        session.user.role            = dbUser.role;
        session.user.phone           = dbUser.phone;
        session.user.avatar          = dbUser.avatar;
        session.user.isVerified      = dbUser.isVerified;
        session.user.isEmailVerified = dbUser.isEmailVerified;
        session.user.isPhoneVerified = dbUser.isPhoneVerified;
        session.user.isActive        = dbUser.isActive;

        /* Subscription */
        if (dbUser.subscription) {
          const sub = dbUser.subscription;

          const isReallyActive =
            sub.isActive === true &&
            sub.endDate  != null  &&
            new Date(sub.endDate) > new Date();

          // ★ planName stored directly in subscription record
          // Fallback: dynamic lookup for OLD subscriptions that predate this fix
          let planName = sub.planName || null;

          if (!planName && sub.razorpayOrderId) {
            // Only for existing users who subscribed before planName was saved
            try {
              const payment = await prisma.payment.findFirst({
                where:  { razorpayOrderId: sub.razorpayOrderId },
                select: { plan: true },
              });
              if (payment?.plan) {
                const pp = await prisma.pricingPlan.findUnique({
                  where:  { key: payment.plan },
                  select: { name: true },
                });
                if (pp?.name) {
                  planName = pp.name;
                  // Back-fill planName into the subscription so this lookup
                  // only happens once
                  prisma.subscription
                    .update({
                      where: { userId: token.sub },
                      data:  { planName: pp.name },
                    })
                    .catch(() => {});
                }
              }
            } catch {}
          }

          // Final fallback to enum value
          if (!planName) planName = sub.plan || 'Premium';

          session.user.subscription = {
            plan:      sub.plan,
            planName,              // ★ "45 Days Hatha Plan" not "QUARTERLY"
            category:  sub.category,
            isActive:  isReallyActive,
            startDate: sub.startDate,
            endDate:   sub.endDate,
          };
        } else {
          session.user.subscription = null;
        }

      } catch (err) {
        console.error('Session callback error:', err);
      }

      return session;
    },
  },

  pages: {
    signIn: '/auth',
    error:  '/auth',
  },

  session: {
    strategy:  'jwt',
    maxAge:    30 * 24 * 60 * 60, // 30 days
    updateAge: 60 * 60,           // refresh token every 1 hour
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };