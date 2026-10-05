import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'Disabled in production' }, { status: 403 });
  }

  const { email } = await request.json().catch(() => ({ email: 'adityamph1@gmail.com' }));
  const validEmail = email === 'arisiki123@gmail.com' ? 'arisiki123@gmail.com' : 'adityamph1@gmail.com';

  const cookieStore = await cookies();
  cookieStore.set('dev_admin_session', validEmail, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true, email: validEmail });
}
