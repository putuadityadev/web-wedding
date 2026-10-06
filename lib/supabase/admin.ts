import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getSecretKey(): string {
  const sec = process.env.SUPABASE_SECRET_KEY;
  if (sec && !sec.includes('...') && !sec.includes('placeholder')) {
    return sec;
  }
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (srv && !srv.includes('...') && !srv.includes('placeholder')) {
    return srv;
  }
  return sec || srv || 'placeholder-service-role-key';
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = getSecretKey();

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}
