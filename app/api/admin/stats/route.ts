import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (!isSupabaseConfigured) {
      // Mock stats for development
      return NextResponse.json({
        ok: true,
        data: {
          totalGuests: 142,
          totalSeats: 284,
          openedCount: 98,
          openedPercentage: 69,
          attendingCount: 84,
          notAttendingCount: 12,
          unrespondedCount: 46,
          withoutPhoneCount: 8,
          needsReviewCount: 2,
          recentRsvps: [
            {
              id: '1',
              guestName: 'Bapak Budi & Keluarga',
              status: 'attending',
              pax: 2,
              wish: 'Selamat menempuh hidup baru Dharma & Lutfhy! Bahagia selalu selamanya.',
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              guestName: 'Kadek Mahendra',
              status: 'attending',
              pax: 1,
              wish: 'Rahajeng ngemargiang pawiwahan bli Dharma!',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: '3',
              guestName: 'Siti Rahmawati & Rekan',
              status: 'not_attending',
              pax: 0,
              wish: 'Mohon maaf belum bisa hadir langsung, doa terbaik untuk kalian berdua.',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
          ],
        },
      });
    }

    const admin = createAdminClient();

    // Query guests stats
    const { data: guests, error: guestsErr } = await admin
      .from('guests')
      .select('id, phone, max_pax, open_count, needs_review');

    // Query rsvps
    const { data: rsvps, error: rsvpsErr } = await admin
      .from('rsvps')
      .select('id, guest_id, status, pax, wish, created_at')
      .order('created_at', { ascending: false });

    if (guestsErr || rsvpsErr) {
      throw new Error(guestsErr?.message || rsvpsErr?.message);
    }

    const totalGuests = guests.length;
    const totalSeats = guests.reduce((sum, g) => sum + (g.max_pax || 2), 0);
    const openedCount = guests.filter((g) => g.open_count > 0).length;
    const openedPercentage = totalGuests > 0 ? Math.round((openedCount / totalGuests) * 100) : 0;
    const withoutPhoneCount = guests.filter((g) => !g.phone).length;
    const needsReviewCount = guests.filter((g) => g.needs_review).length;

    const attendingCount = rsvps.filter((r) => r.status === 'attending').length;
    const notAttendingCount = rsvps.filter((r) => r.status === 'not_attending').length;
    const unrespondedCount = Math.max(0, totalGuests - (attendingCount + notAttendingCount));

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
        recentRsvps: rsvps.slice(0, 10),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
