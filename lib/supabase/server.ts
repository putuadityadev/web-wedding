import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    getAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Invoked from Server Component
          }
        },
      },
    }
  );
}
