import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAllowedAdminEmail, FALLBACK_ADMIN_EMAILS } from '@/lib/auth/adminAllowlist';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'Disabled in production' }, { status: 403 });
  }

  const { email } = await request.json().catch(() => ({ email: FALLBACK_ADMIN_EMAILS[0] }));
  const targetEmail = (email || FALLBACK_ADMIN_EMAILS[0]).toLowerCase();

  const isAllowed = await isAllowedAdminEmail(targetEmail);
  if (!isAllowed) {
    return NextResponse.json({ ok: false, error: 'Email tidak diizinkan' }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set('dev_admin_session', targetEmail, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true, email: targetEmail });
}
