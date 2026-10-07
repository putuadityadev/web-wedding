'use client';

import React, { useState } from 'react';
import { BankAccount } from '@/lib/guests/view';

export interface GiftProps {
  sectionLabel?: string;
  sectionTitle?: string;
  sectionDesc?: string;
  accounts: BankAccount[];
}

export function Gift({
  sectionTitle = 'Doa Restu & Amplop Digital',
  sectionDesc = 'Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih secara digital, Anda dapat menggunakan informasi rekening berikut.',
  accounts,
}: GiftProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <section
      id="gift"
      className="relative w-full py-16 sm:py-20 md:py-24 px-[var(--gutter)] bg-[var(--paper)] select-none"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Intro Text: Clean Minimalist, No Blue Dot */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
          {sectionTitle && (
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--ink)] font-normal tracking-tight mb-3">
              {sectionTitle}
            </h3>
          )}
          {sectionDesc && (
            <p className="body-base text-sm sm:text-base text-[var(--ink)] opacity-75 max-w-lg mx-auto leading-relaxed">
              {sectionDesc}
            </p>
          )}
        </div>

        {/* Minimalist Bank Account Cards — Open Directly (No Extra Step) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
          {accounts.map((acc, index) => {
            const isCopied = copiedIndex === index;

            return (
              <div
                key={`${acc.bank}-${acc.accountNumber}-${index}`}
                className="relative bg-white/80 backdrop-blur-md border border-[var(--ink)]/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(15,27,45,0.03)] flex flex-col justify-between gap-5 transition-all hover:border-[var(--ink)]/20"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono tracking-wider font-semibold uppercase text-[var(--deep)] bg-[var(--mist)]/80 px-2.5 py-1 rounded-md">
                      {acc.bank}
                    </span>
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-normal text-[var(--ink)] tracking-wider mt-2 select-all">
                    {acc.accountNumber}
                  </div>
                  <div className="text-xs text-[var(--ink)] opacity-60 mt-1 font-sans">
                    Atas nama: <span className="text-[var(--ink)] opacity-90 font-medium">{acc.accountName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(acc.accountNumber, index)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 text-white font-medium shadow-xs'
                      : 'bg-[var(--paper)] text-[var(--ink)] border border-[var(--ink)]/15 hover:bg-white hover:border-[var(--ink)]/30'
                  }`}
                  aria-label={`Salin nomor rekening ${acc.bank}`}
                >
                  {isCopied ? (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>NOMOR TERSALIN</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>SALIN REKENING</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
