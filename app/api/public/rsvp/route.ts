import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhoneNumber } from '@/lib/guests/phone';

export const dynamic = 'force-dynamic';

const rsvpSchema = z.object({
  token: z.string().min(1).max(64),
  status: z.enum(['attending', 'not_attending']),
  pax: z.number().int().min(0).max(20).optional().default(1),
  wish: z.string().max(500).nullable().optional(),
  phone: z.string().max(32).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: parsed.error.issues.map((i) => i.message).join(', '),
          },
        },
        { status: 400 }
      );
    }

    const { token, status, pax, wish, phone } = parsed.data;
    const admin = createAdminClient();

    // 1. Find guest by token
    const { data: guest, error: guestErr } = await admin
      .from('guests')
      .select('id, phone, max_pax')
      .eq('token', token)
      .maybeSingle();

    if (guestErr || !guest) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'GUEST_NOT_FOUND',
            message: 'Tamu dengan link undangan ini tidak ditemukan.',
          },
        },
        { status: 404 }
      );
    }

    // Flexible pax limit (up to 20 for families/groups, without rigid restriction to 2)
    const actualPax = status === 'attending' ? Math.min(Math.max(1, pax), 20) : 0;
    const trimmedWish = wish?.trim() || null;
    const now = new Date().toISOString();

    // 2. Upsert RSVP
    const { error: rsvpErr } = await admin.from('rsvps').upsert(
      {
        guest_id: guest.id,
        status,
        pax: actualPax,
        wish: trimmedWish,
        wish_visible: true,
        updated_at: now,
      },
      { onConflict: 'guest_id' }
    );

    if (rsvpErr) {
      throw new Error(rsvpErr.message);
    }

    // 3. Update guest phone if missing
    if (phone && !guest.phone) {
      const cleanPhone = normalizePhoneNumber(phone);
      if (cleanPhone) {
        await admin
          .from('guests')
          .update({ phone: cleanPhone, updated_at: now })
          .eq('id', guest.id);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        token,
        status,
        pax: actualPax,
        wish: trimmedWish,
        updatedAt: now,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
