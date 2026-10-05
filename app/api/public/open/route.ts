import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const openSchema = z.object({
  token: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = openSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Token tidak valid.',
          },
        },
        { status: 400 }
      );
    }

    const { token } = parsed.data;
    const admin = createAdminClient();

    // Fetch guest to get current open_count and first_opened_at
    const { data: guest, error: fetchErr } = await admin
      .from('guests')
      .select('id, open_count, first_opened_at')
      .eq('token', token)
      .maybeSingle();

    if (fetchErr || !guest) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'GUEST_NOT_FOUND',
            message: 'Tamu tidak ditemukan.',
          },
        },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const currentCount = guest.open_count || 0;

    await admin
      .from('guests')
      .update({
        open_count: currentCount + 1,
        last_opened_at: now,
        first_opened_at: guest.first_opened_at || now,
        updated_at: now,
      })
      .eq('id', guest.id);

    return NextResponse.json({
      ok: true,
      data: {
        recorded: true,
        openedAt: now,
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
