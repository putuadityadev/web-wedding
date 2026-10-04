import { NextResponse } from 'next/server';
import { z } from 'zod';

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

    const { token, status, pax, wish } = parsed.data;

    // Phase 1: Return mock success (Phase 2/5 connects to Supabase database)
    return NextResponse.json({
      ok: true,
      data: {
        token,
        status,
        pax: status === 'attending' ? pax : 0,
        wish: wish || null,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Terjadi kesalahan pada server.',
        },
      },
      { status: 500 }
    );
  }
}
