// src/lib/r2.js
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
  console.warn('⚠️  CLOUDFLARE_R2_ACCOUNT_ID not set');
}

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID     || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET     = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'yoga-temple-videos';
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

/**
 * Generate a presigned PUT URL — browser uploads directly here
 */
export async function getPresignedPutUrl(key, contentType, expiresIn = 3600) {
  const cmd = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  });
  return getSignedUrl(R2, cmd, { expiresIn });
}

/**
 * Generate a presigned GET URL — for private premium video playback
 */
export async function getPresignedGetUrl(key, expiresIn = 7200) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(R2, cmd, { expiresIn });
}

/**
 * Delete object from R2
 */
export async function deleteR2Object(key) {
  try {
    await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`🗑️  R2 deleted: ${key}`);
  } catch (err) {
    console.error('R2 delete error:', err.message);
  }
}

/**
 * Build public URL (bucket must have public access enabled)
 */
export function getPublicUrl(key) {
  if (!PUBLIC_URL) return null;
  return `${PUBLIC_URL}/${key}`;
}

export { R2, BUCKET, PUBLIC_URL };