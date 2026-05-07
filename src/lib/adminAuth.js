// src/lib/adminAuth.js
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'admin-super-secret-yoga-temple-2024'
);

// ── Cookie name — one place to change ──
const COOKIE_NAME = 'admin_token';

/* ── Verify admin token from cookies ── */
export async function verifyAdminToken() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    if (payload.role !== 'ADMIN') return null;

    return payload; // { adminId, name, email, role, iat, exp }
  } catch {
    return null;
  }
}

/* ── Require admin — throws if not authenticated ── */
export async function requireAdmin() {
  const admin = await verifyAdminToken();
  if (!admin) throw new Error('Admin authentication required');
  return admin;
}