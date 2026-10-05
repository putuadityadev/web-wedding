import { createBrowserClient } from '@supabase/ssr';

function getAnonKey(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anon && !anon.includes('...') && !anon.includes('placeholder')) {
    return anon;
  }
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (pub && !pub.includes('...') && !pub.includes('placeholder')) {
    return pub;
  }
  return anon || pub || 'placeholder-anon-key';
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    getAnonKey()
  );
}
