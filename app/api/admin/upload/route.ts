import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/m4v',
  'video/ogg',
  'video/x-matroska',
  'video/x-msvideo',
];

const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/m4a',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
};

const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_AUDIO_SIZE = 30 * 1024 * 1024; // 30 MB

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isVideo =
      file.type.startsWith('video/') ||
      ['mp4', 'webm', 'mov', 'm4v', 'mkv'].includes(rawExt);
    const isAudio =
      file.type.startsWith('audio/') ||
      ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(rawExt);

    const maxSize = isVideo
      ? MAX_VIDEO_SIZE
      : isAudio
      ? MAX_AUDIO_SIZE
      : MAX_IMAGE_SIZE;

    const maxSizeMb = isVideo ? '100MB' : '30MB';
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(1)}MB) melebihi batas maksimal ${maxSizeMb}` },
        { status: 400 }
      );
    }

    // Determine resolved MIME type with extension fallback
    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream' || !ALLOWED_MIME_TYPES.includes(contentType)) {
      if (rawExt && EXTENSION_MIME_MAP[rawExt]) {
        contentType = EXTENSION_MIME_MAP[rawExt];
      }
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Format file tidak didukung (${file.type || rawExt || 'unknown'}). Format yang didukung: JPG, PNG, WEBP, AVIF, MP3, WAV, M4A, MP4, WEBM, MOV.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = rawExt || (contentType.split('/')[1] || 'webp');
    const cleanFileName = `${Date.now()}_${nanoid(6)}.${ext}`;
    const storagePath = `${folder}/${cleanFileName}`;

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isSupabaseConfigured) {
      try {
        const adminClient = createAdminClient();
        const bucketName = 'wedding-assets';

        let uploadRes = await adminClient.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        // Auto-heal: If bucket not found, attempt to create bucket and retry
        if (
          uploadRes.error &&
          (uploadRes.error.message?.toLowerCase().includes('bucket not found') ||
            (uploadRes.error as { statusCode?: number }).statusCode === 404)
        ) {
          console.warn('[Upload] Bucket "wedding-assets" not found, attempting auto-creation...');
          await adminClient.storage.createBucket(bucketName, { public: true });
          uploadRes = await adminClient.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
              contentType,
              upsert: true,
            });
        }

        if (uploadRes.error) {
          console.error('[Upload Error] Supabase Storage failed:', uploadRes.error);
          // Fall through to local fallback below
        } else {
          const { data } = adminClient.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          return NextResponse.json({
            ok: true,
            url: data.publicUrl,
            filename: cleanFileName,
          });
        }
      } catch (storageErr) {
        console.error('[Upload Error] Exception communicating with Supabase Storage:', storageErr);
        // Fall through to local fallback
      }
    }

    // Local fallback: store in public/uploads/
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, cleanFileName);
    fs.writeFileSync(localFilePath, buffer);

    const localUrl = `/uploads/${folder}/${cleanFileName}`;
    return NextResponse.json({
      ok: true,
      url: localUrl,
      filename: cleanFileName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload gagal';
    console.error('[Upload Fatal Error]:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
