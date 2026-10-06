import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Mapping ekstensi ke MIME type standar agar browser & Supabase Storage menerima header yang tepat
const EXTENSION_TO_MIME: Record<string, string> = {
  // Gambar
  webp: 'image/webp',
  avif: 'image/avif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/m4a',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
};

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300 MB (WebM, MP4, MOV)
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB (MP3, WAV, M4A, OGG, dsb.)

export async function POST(request: Request) {
  try {
    // Verifikasi sesi admin
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Sesi admin tidak valid atau telah berakhir. Silakan login kembali.' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      console.error('[Upload] Gagal membaca multipart form data:', parseErr);
      return NextResponse.json(
        { ok: false, error: 'Gagal memproses data unggahan. Ukuran payload mungkin melebihi kapasitas server.' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const file = formData.get('file') as File | null;
    const folder = ((formData.get('folder') as string) || 'general')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'File tidak ditemukan dalam request' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawExt = (file.name.split('.').pop() || '').toLowerCase().trim();
    const isVideo =
      file.type.startsWith('video/') ||
      ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi'].includes(rawExt);
    const isAudio =
      file.type.startsWith('audio/') ||
      ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(rawExt);

    const maxSize = isVideo
      ? MAX_VIDEO_SIZE
      : isAudio
      ? MAX_AUDIO_SIZE
      : MAX_IMAGE_SIZE;

    const maxSizeMb = isVideo ? '300MB' : isAudio ? '100MB' : '50MB';
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          ok: false,
          error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(1)}MB) melebihi batas maksimal ${maxSizeMb}`,
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolusi Content-Type yang ramah & tidak membatasi
    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream' || contentType === '') {
      if (rawExt && EXTENSION_TO_MIME[rawExt]) {
        contentType = EXTENSION_TO_MIME[rawExt];
      } else if (isVideo) {
        contentType = 'video/mp4';
      } else if (isAudio) {
        contentType = 'audio/mpeg';
      } else {
        contentType = 'image/webp';
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Tentukan ekstensi aman untuk file
    const ext =
      rawExt ||
      (contentType.startsWith('image/webp')
        ? 'webp'
        : contentType.split('/')[1] || 'bin');

    const cleanFileName = `${Date.now()}_${nanoid(8)}.${ext}`;
    const storagePath = `${folder}/${cleanFileName}`;

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    // 1. Coba simpan ke Supabase Storage (Prioritas Utama)
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

        // Auto-heal: jika bucket belum dibuat, buat secara otomatis dan coba lagi
        if (
          uploadRes.error &&
          (uploadRes.error.message?.toLowerCase().includes('bucket not found') ||
            (uploadRes.error as { statusCode?: number }).statusCode === 404)
        ) {
          console.warn('[Upload] Bucket "wedding-assets" belum ada, mencoba membuat otomatis...');
          await adminClient.storage.createBucket(bucketName, { public: true });
          uploadRes = await adminClient.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
              contentType,
              upsert: true,
            });
        }

        if (uploadRes.error) {
          console.warn('[Upload Warning] Supabase Storage upload gagal, beralih ke local fallback:', uploadRes.error.message);
        } else {
          const { data } = adminClient.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          return NextResponse.json({
            ok: true,
            url: data.publicUrl,
            filename: cleanFileName,
            size: file.size,
            contentType,
            storage: 'supabase',
          });
        }
      } catch (storageErr) {
        console.warn('[Upload Warning] Pengecualian saat koneksi ke Supabase Storage:', storageErr);
      }
    }

    // 2. Local Fallback: simpan ke public/uploads/folder/
    try {
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
        size: file.size,
        contentType,
        storage: 'local',
      });
    } catch (fsErr) {
      console.error('[Upload Fatal] Local filesystem fallback gagal:', fsErr);
      return NextResponse.json(
        {
          ok: false,
          error: 'Gagal menyimpan file ke penyimpanan cloud maupun lokal. Mohon periksa koneksi Supabase Storage.',
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengunggah';
    console.error('[Upload Fatal Error]:', err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
