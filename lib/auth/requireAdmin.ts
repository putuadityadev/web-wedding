import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAllowedAdminEmail } from '@/lib/auth/adminAllowlist';

export interface AdminUser {
  id: string;
  email: string;
}

export async function requireAdmin(): Promise<AdminUser> {
  const cookieStore = await cookies();

  // In development mode, check for dev admin session cookie when Supabase keys are placeholder
  if (process.env.NODE_ENV === 'development') {
    const devEmail = cookieStore.get('dev_admin_session')?.value?.toLowerCase();
    if (devEmail) {
      const isAllowedDev = await isAllowedAdminEmail(devEmail);
      if (isAllowedDev) {
        return {
          id: 'dev-admin-id',
          email: devEmail,
        };
      }
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

  // Verify against Supabase admin_emails table (with fallback)
  const isAllowed = await isAllowedAdminEmail(userEmail);
  if (!isAllowed) {
    throw new Error('FORBIDDEN');
  }

  return {
    id: user.id,
    email: userEmail,
  };
}
