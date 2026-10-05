import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id } = await context.params;

    const { data: guest, error: fetchErr } = await admin
      .from('guests')
      .select('internal_note')
      .eq('id', id)
      .single();

    if (fetchErr || !guest) {
      return NextResponse.json({ ok: false, error: 'Tamu tidak ditemukan' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let note = guest.internal_note || '';

    // Replace existing blast tag or append
    if (note.includes('[BLASTED:')) {
      note = note.replace(/\[BLASTED:[^\]]+\]/, `[BLASTED:${now}]`);
    } else {
      note = (note ? note + ' ' : '') + `[BLASTED:${now}]`;
    }

    const { error: updateErr } = await admin
      .from('guests')
      .update({ internal_note: note, updated_at: now })
      .eq('id', id);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    return NextResponse.json({ ok: true, blastedAt: now });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mencatat status blast';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
