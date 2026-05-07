// src/app/api/admin/hero/route.js
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

async function checkAdmin() {
  // Try admin cookie
  const adminToken = await verifyAdminToken();
  if (adminToken) return true;

  // Fallback: NextAuth session
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    const session = await getServerSession(authOptions);
    if (session?.user?.role?.toUpperCase() === 'ADMIN') return true;
  } catch {}

  return false;
}

export async function GET() {
  try {
    const heroSettings = await prisma.siteSetting.findMany({
      where:   { key: { startsWith: 'hero_image_' } },
      orderBy: { createdAt: 'desc' },
    });

    const heroImages = heroSettings.map(s => {
      let data;
      try { data = JSON.parse(s.value); }
      catch { data = { imageUrl: s.value }; }
      return {
        id:        s.id,
        _id:       s.id,
        imageUrl:  data.imageUrl,
        publicId:  data.publicId || '',
        title:     data.title || 'Hero Image',
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json(heroImages);
  } catch (error) {
    console.error('Hero GET error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { imageUrl, publicId, title } = await req.json();

    const key     = `hero_image_${Date.now()}`;
    const setting = await prisma.siteSetting.create({
      data: {
        key,
        value: JSON.stringify({
          imageUrl,
          publicId: publicId || '',
          title:    title || 'Hero Image',
        }),
      },
    });

    return NextResponse.json({
      id: setting.id, _id: setting.id,
      imageUrl, publicId,
    }, { status: 201 });
  } catch (error) {
    console.error('Hero POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    await prisma.siteSetting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hero DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}