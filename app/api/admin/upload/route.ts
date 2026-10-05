import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

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

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: `Ukuran file melebihi batas ${isVideo ? '50MB' : '15MB'}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Format file tidak didukung: ${file.type}. Format yang didukung: JPG, PNG, WEBP, AVIF, MP3, MP4, WEBM, MOV.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Derive extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const cleanFileName = `${Date.now()}_${nanoid(6)}.${ext}`;
    const storagePath = `${folder}/${cleanFileName}`;

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const { error: uploadError } = await adminClient.storage
        .from('wedding-assets')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('[Upload Error] Supabase Storage:', uploadError);
        return NextResponse.json(
          { ok: false, error: uploadError.message },
          { status: 500 }
        );
      }

      const { data } = adminClient.storage
        .from('wedding-assets')
        .getPublicUrl(storagePath);

      return NextResponse.json({
        ok: true,
        url: data.publicUrl,
        filename: cleanFileName,
      });
    }

    // Local development fallback: store in public/uploads/
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
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
