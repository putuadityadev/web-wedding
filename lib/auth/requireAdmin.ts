import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminUser {
  id: string;
  email: string;
}

export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    throw new Error('UNAUTHORIZED');
  }

  const userEmail = user.email.toLowerCase();

  // Validate against admin_emails allowlist in Supabase
  const adminClient = createAdminClient();
  const { data: allowedAdmin, error: queryError } = await adminClient
    .from('admin_emails')
    .select('email')
    .eq('email', userEmail)
    .maybeSingle();

  if (queryError || !allowedAdmin) {
    throw new Error('FORBIDDEN');
  }

  return {
    id: user.id,
    email: userEmail,
  };
}
