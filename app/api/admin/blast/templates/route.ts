import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { BlastTemplatesConfig, DEFAULT_BLAST_CONFIG } from '@/lib/blast/templates';

export const dynamic = 'force-dynamic';

function cleanTemplate(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/Sabtu,\s*12\s*Desember\s*2026/gi, '{{tanggal}}')
    .replace(/12\s*Desember\s*2026/gi, '{{tanggal}}')
    .replace(/Sabtu,\s*12\s*Oktober\s*2026/gi, '{{tanggal}}')
    .replace(/12\s*Oktober\s*2026/gi, '{{tanggal}}');
}

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: row, error } = await admin
      .from('site_content')
      .select('data')
      .eq('section_key', 'blast_templates')
      .maybeSingle();

    if (error || !row?.data) {
      return NextResponse.json({ ok: true, data: DEFAULT_BLAST_CONFIG });
    }

    const merged: BlastTemplatesConfig = {
      defaultTemplate: cleanTemplate(row.data.defaultTemplate) || DEFAULT_BLAST_CONFIG.defaultTemplate,
      groupTemplates: Object.fromEntries(
        Object.entries(row.data.groupTemplates || {}).map(([k, v]) => [k, cleanTemplate(v as string)])
      ),
      groupTones: row.data.groupTones || {},
      toneTemplates: {
        formal: cleanTemplate(row.data.toneTemplates?.formal) || DEFAULT_BLAST_CONFIG.toneTemplates.formal,
        warm: cleanTemplate(row.data.toneTemplates?.warm) || DEFAULT_BLAST_CONFIG.toneTemplates.warm,
        casual: cleanTemplate(row.data.toneTemplates?.casual) || DEFAULT_BLAST_CONFIG.toneTemplates.casual,
      },
    };

    return NextResponse.json({ ok: true, data: merged });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Data template tidak valid' },
        { status: 400 }
      );
    }

    const sanitizedData = {
      ...body,
      defaultTemplate: cleanTemplate(body.defaultTemplate),
      groupTemplates: Object.fromEntries(
        Object.entries(body.groupTemplates || {}).map(([k, v]) => [k, cleanTemplate(v as string)])
      ),
      toneTemplates: {
        formal: cleanTemplate(body.toneTemplates?.formal),
        warm: cleanTemplate(body.toneTemplates?.warm),
        casual: cleanTemplate(body.toneTemplates?.casual),
      },
    };

    const admin = createAdminClient();
    const { error } = await admin
      .from('site_content')
      .upsert(
        {
          section_key: 'blast_templates',
          data: sanitizedData,
          updated_at: new Date().toISOString(),
          updated_by: adminUser.email,
        },
        { onConflict: 'section_key' }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan template blast';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
