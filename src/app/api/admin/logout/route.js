// src/app/api/admin/logout/route.js
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  });
  return res;
}