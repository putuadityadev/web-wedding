import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: rsvps, error } = await admin
      .from('rsvps')
      .select('id, wish, created_at, guests(name)')
      .eq('wish_visible', true)
      .not('wish', 'is', null)
      .neq('wish', '')
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('[Public Wishes] DB query error:', error.message);
      return NextResponse.json({ ok: true, data: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wishes = (rsvps || []).map((r: any) => ({
      id: r.id,
      name: r.guests?.name || 'Tamu Undangan',
      wish: r.wish,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      ok: true,
      data: wishes,
    });
  } catch (err: unknown) {
    console.warn('[Public Wishes] Exception:', err);
    return NextResponse.json({ ok: true, data: [] });
  }
}
