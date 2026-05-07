// src/app/api/admin/login/route.js
import { NextResponse } from 'next/server';
import { SignJWT }      from 'jose';
import bcrypt           from 'bcryptjs';
import prisma           from '@/lib/prisma';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'admin-super-secret-yoga-temple-2024'
);

// ── Must match COOKIE_NAME in adminAuth.js ──
const COOKIE_NAME = 'admin_token';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 },
      );
    }

    // Find admin by username OR email
    const admin = await prisma.adminAccount.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email:    username.toLowerCase() },
        ],
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Update last login
    await prisma.adminAccount.update({
      where: { id: admin.id },
      data:  { lastLogin: new Date() },
    });

    // Generate JWT
    const token = await new SignJWT({
      adminId: admin.id,
      name:    admin.name,
      email:   admin.email,
      role:    'ADMIN',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(ADMIN_SECRET);

    // Set cookie — name MUST match COOKIE_NAME in adminAuth.js
    const res = NextResponse.json({
      success: true,
      admin:   { id: admin.id, name: admin.name, email: admin.email },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    });

    return res;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 },
    );
  }
}