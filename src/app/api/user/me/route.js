// src/app/api/user/me/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id:             true,
        name:           true,
        email:          true,
        phone:          true,
        address:        true,
        avatar:         true,
        role:           true,
        isVerified:     true,
        isEmailVerified:true,
        isPhoneVerified:true,
        isActive:       true,
        provider:       true,
        lastLogin:      true,
        createdAt:      true,
        updatedAt:      true,
        subscription: {
          select: {
            plan:      true,
            category:  true,
            isActive:  true,
            startDate: true,
            endDate:   true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}   