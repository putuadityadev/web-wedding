import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const admin = createAdminClient();

    // Query guests stats
    const { data: guests, error: guestsErr } = await admin
      .from('guests')
      .select('id, phone, max_pax, open_count, needs_review');

    // Query rsvps with guest name
    const { data: rsvps, error: rsvpsErr } = await admin
      .from('rsvps')
      .select('id, guest_id, status, pax, wish, created_at, guests(name)')
      .order('created_at', { ascending: false });

    if (guestsErr || rsvpsErr) {
      throw new Error(guestsErr?.message || rsvpsErr?.message);
    }

    const guestList = guests || [];
    const rsvpList = rsvps || [];

    const totalGuests = guestList.length;
    const totalSeats = guestList.reduce((sum, g) => sum + (g.max_pax || 2), 0);
    const openedCount = guestList.filter((g) => g.open_count > 0).length;
    const openedPercentage = totalGuests > 0 ? Math.round((openedCount / totalGuests) * 100) : 0;
    const withoutPhoneCount = guestList.filter((g) => !g.phone).length;
    const needsReviewCount = guestList.filter((g) => g.needs_review).length;

    const attendingCount = rsvpList.filter((r) => r.status === 'attending').length;
    const notAttendingCount = rsvpList.filter((r) => r.status === 'not_attending').length;
    const unrespondedCount = Math.max(0, totalGuests - (attendingCount + notAttendingCount));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentRsvps = rsvpList.slice(0, 10).map((r: any) => ({
      id: r.id,
      guestName: r.guests?.name || 'Tamu Undangan',
      status: r.status,
      pax: r.pax,
      wish: r.wish,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      ok: true,
      data: {
        totalGuests,
        totalSeats,
        openedCount,
        openedPercentage,
        attendingCount,
        notAttendingCount,
        unrespondedCount,
        withoutPhoneCount,
        needsReviewCount,
        recentRsvps,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data statistik';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
