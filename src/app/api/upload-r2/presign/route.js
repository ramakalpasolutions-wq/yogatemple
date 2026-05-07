// src/app/api/upload-r2/presign/route.js
import { NextResponse }     from 'next/server';
import { getPresignedPutUrl, getPublicUrl } from '@/lib/r2';
import { v4 as uuid }       from 'uuid';

const ALLOWED_VIDEO = [
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska',
];

// Auth: accept admin cookie OR NextAuth admin session
async function requireAdmin() {
  // 1. Admin JWT cookie
  try {
    const { verifyAdminToken } = await import('@/lib/adminAuth');
    const tok = await verifyAdminToken();
    if (tok) return true;
  } catch (_) {}

  // 2. NextAuth session fallback
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } =
      await import('@/app/api/auth/[...nextauth]/route');
    const session = await getServerSession(authOptions);
    if (session?.user?.role?.toUpperCase() === 'ADMIN') return true;
  } catch (_) {}

  return false;
}

export async function POST(req) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { fileName, contentType, fileSize, category } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType required' },
        { status: 400 },
      );
    }

    if (!ALLOWED_VIDEO.includes(contentType)) {
      return NextResponse.json(
        {
          error: `Unsupported type "${contentType}". Allowed: MP4, WebM, MOV, AVI, MKV`,
        },
        { status: 400 },
      );
    }

    const MAX = 500 * 1024 * 1024;
    if (fileSize && fileSize > MAX) {
      return NextResponse.json(
        {
          error: `File too large. Max 500 MB, got ${(fileSize / 1024 / 1024).toFixed(0)} MB`,
        },
        { status: 413 },
      );
    }

    const ext     = fileName.split('.').pop()?.toLowerCase() || 'mp4';
    const catSlug = category
      ? category.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : 'general';
    const key     = `videos/${catSlug}/${uuid()}.${ext}`;

    const presignedUrl = await getPresignedPutUrl(key, contentType, 3600);
    const publicUrl    = getPublicUrl(key);

    console.log(
      `🔑 Presigned PUT for ${key} (${((fileSize || 0) / 1024 / 1024).toFixed(1)} MB)`,
    );

    return NextResponse.json({ presignedUrl, key, publicUrl });

  } catch (err) {
    console.error('Presign error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}