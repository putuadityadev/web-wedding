import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminUser {
  id: string;
  email: string;
}

const ALLOWED_ADMIN_EMAILS = [
  'adityamph1@gmail.com',
  'arisiki123@gmail.com',
];

export async function requireAdmin(): Promise<AdminUser> {
  const cookieStore = await cookies();

  // In development mode, check for dev admin session cookie when Supabase keys are placeholder
  if (process.env.NODE_ENV === 'development') {
    const devEmail = cookieStore.get('dev_admin_session')?.value?.toLowerCase();
    if (devEmail && ALLOWED_ADMIN_EMAILS.includes(devEmail)) {
      return {
        id: 'dev-admin-id',
        email: devEmail,
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    throw new Error('UNAUTHORIZED');
  }

  const userEmail = user.email.toLowerCase();

  // Primary check: Hardcoded strict allowlist
  if (!ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
    throw new Error('FORBIDDEN');
  }

  // Secondary check: Database admin_emails allowlist if table exists
  try {
    const adminClient = createAdminClient();
    const { data: allowedAdmin, error: queryError } = await adminClient
      .from('admin_emails')
      .select('email')
      .eq('email', userEmail)
      .maybeSingle();

    if (!queryError && !allowedAdmin) {
      throw new Error('FORBIDDEN');
    }
  } catch (dbErr) {
    // If table not yet migrated, fallback to strict ALLOWED_ADMIN_EMAILS
    console.warn('[Auth] DB check skipped or unmigrated, using allowlist array:', dbErr);
  }

  return {
    id: user.id,
    email: userEmail,
  };
}
