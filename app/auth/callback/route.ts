import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAllowedAdminEmail } from '@/lib/auth/adminAllowlist';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/admin';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user || !data.user.email) {
      console.error('[Auth Callback] Exchange code error:', error);
      return NextResponse.redirect(new URL('/admin/login?error=auth_failed', request.url));
    }

    const email = data.user.email.toLowerCase();

    // Verify email against database admin_emails allowlist (with fallback)
    const isAllowed = await isAllowedAdminEmail(email);
    if (!isAllowed) {
      console.warn('[Auth Callback] Unauthorized admin email attempt:', email);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized_email', request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL('/admin/login?error=no_code', request.url));
}
