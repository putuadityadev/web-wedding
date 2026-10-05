import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: rsvps, error } = await admin
      .from('rsvps')
      .select('id, wish, wish_visible, created_at, guests(name)')
      .not('wish', 'is', null)
      .neq('wish', '')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wishes = (rsvps || []).map((r: any) => ({
      id: r.id,
      name: r.guests?.name || 'Tamu Undangan',
      wish: r.wish,
      visible: r.wish_visible !== false,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ ok: true, data: wishes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat daftar ucapan';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();

    const { id, visible } = body as { id: string; visible: boolean };
    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID harus diisi' }, { status: 400 });
    }

    const { error } = await admin
      .from('rsvps')
      .update({ wish_visible: visible, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui status ucapan';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID harus diisi' }, { status: 400 });
    }

    // Set wish to null rather than deleting entire RSVP attendance record
    const { error } = await admin
      .from('rsvps')
      .update({ wish: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus ucapan';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
