'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check URL params for error
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'unauthorized_email' || err === 'forbidden') {
      setErrorMsg('Akses ditolak: Email Anda tidak terdaftar dalam daftar allowlist admin.');
    } else if (err === 'auth_failed') {
      setErrorMsg('Gagal melakukan autentikasi dengan Google. Silakan coba kembali.');
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const isPlaceholder =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isPlaceholder) {
        // Automatically use dev login in development when keys are placeholder
        await handleDevLogin('adityamph1@gmail.com');
        return;
      }

      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=/admin`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal login';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  const handleDevLogin = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = '/admin';
      } else {
        setErrorMsg(data.error || 'Gagal dev login');
        setLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error dev login';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6 selection:bg-[var(--baby-blue)]">
      <div className="w-full max-w-md">
        {/* Card Box */}
        <div className="bg-white/80 backdrop-blur-md border border-[var(--ink)]/15 rounded-[var(--radius-sm)] p-8 sm:p-10 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="label-eyebrow tracking-[0.25em] text-[var(--ink)] opacity-60 block text-[10px] uppercase mb-2">
              PORTAL ADMINISTRATOR
            </span>
            <h1 className="font-serif text-3xl text-[var(--ink)] font-light tracking-tight">
              Dharma & Lutfhy
            </h1>
            <p className="text-xs text-[var(--ink)] opacity-70 mt-2">
              Kelola undangan, konten acara, RSVP, dan buku tamu secara terpusat.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-sm bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-[var(--radius-sm)] bg-[#0F1B2D] text-white hover:bg-[#1E293B] active:scale-[0.99] transition-all duration-200 text-xs font-medium tracking-wider uppercase shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Menghubungkan...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.44 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.1z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.56 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          {/* Allowlist Notice */}
          <div className="mt-8 pt-6 border-t border-[var(--ink)]/10 text-center">
            <span className="text-[11px] text-[var(--ink)] opacity-50 block leading-relaxed">
              Hanya email yang telah terdaftar dalam sistem allowlist yang diizinkan masuk.
            </span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-[var(--ink)] opacity-40 mt-6 tracking-wider">
          © 2026 Dharma & Lutfhy Wedding Dashboard
        </p>
      </div>
    </div>
  );
}
