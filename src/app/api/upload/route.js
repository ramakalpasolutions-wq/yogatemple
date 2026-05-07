// src/app/api/upload/route.js

import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Configure Cloudinary once ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helper: upload buffer via stream ───────────────────────────────────────────
function uploadStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        timeout: 120000,
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const chunkSize = 64 * 1024;
    let offset = 0;

    function writeNext() {
      if (offset >= buffer.length) {
        stream.end();
        return;
      }

      const chunk = buffer.slice(offset, offset + chunkSize);
      offset += chunkSize;

      const canContinue = stream.write(chunk);

      if (canContinue) {
        writeNext();
      } else {
        stream.once('drain', writeNext);
      }
    }

    writeNext();
  });
}

// ── Auth helper ────────────────────────────────────────────────────────────────
async function isAdmin() {
  // Admin JWT cookie
  try {
    const admin = await verifyAdminToken();

    if (admin) return true;
  } catch {}

  // NextAuth session fallback
  try {
    const { getServerSession } = await import('next-auth');

    const { authOptions } = await import(
      '@/app/api/auth/[...nextauth]/route'
    );

    const session = await getServerSession(authOptions);

    if (session?.user?.role?.toUpperCase() === 'ADMIN') {
      return true;
    }
  } catch {}

  return false;
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    // Auth check
    const adminOk = await isAdmin();

    if (!adminOk) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse multipart form
    let formData;

    try {
      formData = await req.formData();
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Failed to parse form data: ' + e.message,
        },
        { status: 400 }
      );
    }

    const file = formData.get('file');

    const type = (formData.get('type') || 'image').toLowerCase();

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = file.type || '';

    if (type === 'video' && !mimeType.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Please upload a video file' },
        { status: 400 }
      );
    }

    if (type === 'image' && !mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please upload an image file' },
        { status: 400 }
      );
    }

    // File size check
    const MAX_IMAGE = 10 * 1024 * 1024;
    const MAX_VIDEO = 100 * 1024 * 1024;

    const maxSize = type === 'video' ? MAX_VIDEO : MAX_IMAGE;

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    if (buffer.length > maxSize) {
      const limitMB = Math.round(maxSize / 1024 / 1024);

      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${limitMB} MB`,
        },
        { status: 413 }
      );
    }

    console.log(
      `📤 Uploading ${type}: ${file.name} (${(
        buffer.length / 1024
      ).toFixed(0)} KB)`
    );

    // ── Upload options ──────────────────────────────────────────────────────
    let result;

    if (type === 'video') {
      result = await uploadStream(buffer, {
        resource_type: 'video',
        folder: 'yoga-temple/videos',
        chunk_size: 6000000,
        eager: [{ format: 'mp4', quality: 'auto' }],
        eager_async: true,
      });
    } else {
      result = await uploadStream(buffer, {
        resource_type: 'image',
        folder: 'yoga-temple/images',

        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
          {
            width: 1920,
            crop: 'limit',
          },
        ],
      });
    }

    console.log(`✅ Upload success: ${result.public_id}`);

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    });
  } catch (error) {
    console.error('Upload error:', error);

    let message = 'Upload failed';

    if (
      error?.message?.includes('Timeout') ||
      error?.http_code === 499
    ) {
      message =
        'Upload timed out. Try a smaller file or check your connection.';
    } else if (error?.http_code === 401) {
      message =
        'Cloudinary credentials are invalid. Check your environment variables.';
    } else if (error?.message) {
      message = error.message;
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}