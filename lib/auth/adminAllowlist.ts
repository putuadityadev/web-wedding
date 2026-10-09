import { createAdminClient } from '@/lib/supabase/admin';

export const FALLBACK_ADMIN_EMAILS = [
  'adityamph1@gmail.com',
  'arisiki123@gmail.com',
  'putuadityasatriawan4@gmail.com',
];

/**
 * Check whether an email is authorized as an admin.
 * Queries the `admin_emails` table in Supabase using the service role client.
 * Falls back to the static allowlist if the database is unreachable.
 */
export async function isAllowedAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_emails')
      .select('email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!error && data?.email) {
      return true;
    }
  } catch (err) {
    console.warn('[AdminAuth] DB check failed, using fallback list:', err);
  }

  return FALLBACK_ADMIN_EMAILS.includes(cleanEmail);
}

/**
 * Get all authorized admin emails from the Supabase `admin_emails` table.
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_emails')
      .select('email')
      .order('email', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((row) => row.email.toLowerCase().trim());
    }
  } catch (err) {
    console.warn('[AdminAuth] Failed to load admin_emails from DB, using fallback list:', err);
  }

  return FALLBACK_ADMIN_EMAILS;
}
