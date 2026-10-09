import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent, updateSectionContent } from '@/lib/content/service';
import { SiteContent } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const content = await getSiteContent();
    return NextResponse.json({ ok: true, data: content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

const ALLOWED_SECTIONS: (keyof SiteContent)[] = [
  'cover',
  'hero',
  'quote',
  'prayer',
  'couple',
  'story',
  'event',
  'gallery',
  'gift',
  'footer',
  'audio',
  'branding',
];

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();

    let body: { section?: keyof SiteContent; data?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Format JSON body tidak valid' },
        { status: 400 }
      );
    }

    const { section, data } = body;

    if (!section || typeof section !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Nama section wajib disertakan' },
        { status: 400 }
      );
    }

    if (!ALLOWED_SECTIONS.includes(section as keyof SiteContent)) {
      return NextResponse.json(
        { ok: false, error: `Section "${section}" tidak dikenal dalam sistem` },
        { status: 400 }
      );
    }

    if (data === undefined || data === null || typeof data !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Data konten untuk section ini wajib berupa objek data valid' },
        { status: 400 }
      );
    }

    const result = await updateSectionContent(section as keyof SiteContent, data, admin.email);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Terjadi kegagalan saat memperbarui data di database' },
        { status: 500 }
      );
    }

    // Immediately revalidate public and preview pages so edits reflect seamlessly
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout'); // Purges cache across entire site including sub-routes & layouts
      revalidatePath('/', 'page');
      revalidatePath('/u/[token]', 'page');
      revalidatePath('/preview', 'page');
      revalidatePath('/admin/content', 'page');
      revalidatePath('/admin/branding', 'page');
      revalidatePath('/admin/guests', 'page');
      revalidatePath('/admin/blast', 'page');
    } catch (revalErr) {
      console.warn('[CMS] Revalidation warning:', revalErr);
    }

    return NextResponse.json({ ok: true, message: `Section "${section}" berhasil diperbarui` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan konten';
    const status = message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('sesi') ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
