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

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { section, data } = body as {
      section: keyof SiteContent;
      data: unknown;
    };

    if (!section || !data) {
      return NextResponse.json(
        { ok: false, error: 'Section dan data harus diisi' },
        { status: 400 }
      );
    }

    const result = await updateSectionContent(section, data, admin.email);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    // Immediately revalidate public and preview pages so edits reflect seamlessly
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout'); // Purges cache across entire site including sub-routes & layouts
      revalidatePath('/', 'page');
      revalidatePath('/u/[token]', 'page');
      revalidatePath('/preview', 'page');
      revalidatePath('/admin/content', 'page');
    } catch (revalErr) {
      console.warn('[CMS] Revalidation warning:', revalErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan konten';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
