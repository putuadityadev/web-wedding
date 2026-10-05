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
  sectionLabel = 'TANDA KASIH',
  sectionTitle = 'Doa Restu & Amplop Digital',
  sectionDesc = 'Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih secara digital, Anda dapat menggunakan informasi rekening berikut.',
  accounts,
}: GiftProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (accountNumber: string, index: number) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1800);
  };

  return (
    <section
      id="gift"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Intro Text */}
        <div className="text-center max-w-xl mx-auto mb-10">
          {sectionLabel && (
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--baby-blue)]" />
              <span className="label-eyebrow tracking-[0.25em] text-[11px] text-[var(--ink)] opacity-60 uppercase">
                {sectionLabel}
              </span>
            </div>
          )}
          <h3 className="display-m text-3xl sm:text-4xl text-[var(--ink)] font-serif mb-4">
            {sectionTitle}
          </h3>
          {sectionDesc && (
            <p className="body-base text-[var(--ink)] opacity-80 leading-relaxed">
              {sectionDesc}
            </p>
          )}
        </div>

        {/* Accordion Container */}
        <div className="border border-[var(--hairline)] rounded-[var(--radius-sm)] bg-white/40 overflow-hidden max-w-2xl mx-auto">
          {/* Accordion Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--mist)]/40 transition-colors"
            aria-expanded={isOpen}
          >
            <span className="label-eyebrow tracking-[0.2em] text-[var(--ink)] font-medium">
              LIHAT NOMOR REKENING
            </span>
            <span className="font-mono text-xl text-[var(--deep)] transition-transform duration-300">
              {isOpen ? '−' : '+'}
            </span>
          </button>

          {/* Accordion Content with animated CSS grid */}
          <div
            className={`grid transition-all duration-400 ease-[var(--ease-out)] ${
              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-6 pb-6 pt-2 divide-y divide-[var(--hairline)]">
                {accounts.map((acc, index) => {
                  const isCopied = copiedIndex === index;

                  return (
                    <div
                      key={acc.accountNumber}
                      className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col">
                        <span className="label-eyebrow text-[var(--deep)] tracking-[0.2em] mb-1">
                          {acc.bank}
                        </span>
                        <span className="font-mono text-xl sm:text-2xl text-[var(--ink)] tabular-nums tracking-wider">
                          {acc.accountNumber}
                        </span>
                        <span className="body-base text-[var(--ink)] opacity-70 text-sm mt-0.5">
                          a.n. {acc.accountName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(acc.accountNumber, index)}
                        className={`self-start sm:self-auto label-eyebrow px-4 py-2 border rounded-[var(--radius-sm)] transition-all duration-300 tracking-[0.16em] ${
                          isCopied
                            ? 'bg-[var(--baby-blue)] border-[var(--deep)] text-[var(--ink)]'
                            : 'border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--mist)]'
                        }`}
                      >
                        {isCopied ? 'TERSLIN' : 'SALIN'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
