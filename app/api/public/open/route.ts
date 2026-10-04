import { NextResponse } from 'next/server';
import { z } from 'zod';

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

    // In Phase 1 mock, acknowledge successfully
    return NextResponse.json({
      ok: true,
      data: {
        recorded: true,
        openedAt: new Date().toISOString(),
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
