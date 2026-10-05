'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminHeaderProps {
  currentEmail: string;
}

export function AdminHeader({ currentEmail }: AdminHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Ringkasan & Statistik';
    if (pathname.startsWith('/admin/content')) return 'Editor Konten Undangan (CMS)';
    if (pathname.startsWith('/admin/guests')) return 'Manajemen Buku Tamu';
    if (pathname.startsWith('/admin/import')) return 'Import & Export CSV';
    if (pathname.startsWith('/admin/wishes')) return 'Moderasi Dinding Doa & Ucapan';
    if (pathname.startsWith('/admin/settings')) return 'Pengaturan Acara & Sistem';
    return 'Admin Console';
  };

  return (
    <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-4 bg-white border-b border-[#0F1B2D]/10 sticky top-0 z-20 shadow-xs">
      {/* Title & Breadcrumb */}
      <div>
        <h1 className="font-serif text-xl text-[#0F1B2D] font-medium tracking-tight">
          {getPageTitle()}
        </h1>
        <p className="text-[11px] text-[#0F1B2D]/50 font-mono mt-0.5">
          Wedding Portal · {currentEmail}
        </p>
      </div>

      {/* Action links */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F1B2D]/5 hover:bg-[#0F1B2D]/10 text-[#0F1B2D] text-xs font-medium tracking-wide transition-all border border-[#0F1B2D]/10"
        >
          <span>Lihat Undangan Publik</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 12L12 4M12 4H6M12 4V10"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
