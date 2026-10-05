import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete('dev_admin_session');

    return NextResponse.redirect(new URL('/admin/login', request.url), {
      status: 303,
    });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.redirect(new URL('/admin/login', request.url), {
      status: 303,
    });
  }
}
