'use client';

import React, { useState, useEffect } from 'react';

export interface WishItem {
  id: string;
  name: string;
  wish: string;
  timeAgo: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} hari lalu`;
    return new Date(dateString).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  } catch {
    return 'Baru saja';
  }
}

interface WishesProps {
  newWish?: { name: string; wish: string } | null;
}

export function Wishes({ newWish }: WishesProps) {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    let isMounted = true;
    async function loadWishes() {
      try {
        const res = await fetch('/api/public/wishes');
        const json = await res.json();
        if (isMounted && json.ok && Array.isArray(json.data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: WishItem[] = json.data.map((w: any) => ({
            id: w.id,
            name: w.name,
            wish: w.wish,
            timeAgo: formatRelativeTime(w.createdAt),
          }));
          setWishes(items);
        }
      } catch {
        // Fallback gracefully to empty if network issue
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadWishes();
    return () => {
      isMounted = false;
    };
  }, []);

  const allWishes = React.useMemo(() => {
    if (newWish && newWish.wish) {
      return [
        {
          id: `w-user-${Date.now()}`,
          name: newWish.name,
          wish: newWish.wish,
          timeAgo: 'Baru saja',
        },
        ...wishes,
      ];
    }
    return wishes;
  }, [newWish, wishes]);

  const displayedWishes = allWishes.slice(0, visibleCount);

  return (
    <section
      id="wishes"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none"
    >
      <div className="max-w-5xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16 md:mb-20">
          <span className="label-eyebrow text-[var(--accent)] tracking-[0.2em] mb-4 block">
            DOA & UCAPAN
          </span>
          <h2 className="title-display text-[var(--ink)] font-light mb-4">
            Dinding Doa Restu
          </h2>
          <p className="body-m text-[var(--ink)] opacity-70">
            Ungkapan kasih dan ketulusan doa dari keluarga serta sahabat terkasih.
          </p>
        </div>

        {/* Wishes List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--ink)] opacity-40 font-mono">
            Memuat doa restu...
          </div>
        ) : allWishes.length === 0 ? (
          <div className="py-12 px-6 text-center max-w-md mx-auto border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--paper)]">
            <div className="text-2xl mb-2">💌</div>
            <p className="font-serif italic text-[var(--ink)] opacity-80 text-sm">
              Belum ada ucapan doa restu yang terkirim.
            </p>
            <p className="text-xs text-[var(--ink)] opacity-50 mt-1">
              Jadilah yang pertama memberikan doa restu untuk kedua mempelai melalui formulir kehadiran di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {displayedWishes.map((item) => (
              <div
                key={item.id}
                className="flex flex-col border-b border-[var(--hairline)] pb-6"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="label-eyebrow text-[var(--deep)] tracking-[0.16em] font-medium">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-[var(--ink)] opacity-40">
                    {item.timeAgo}
                  </span>
                </div>

                <p className="body-l font-serif text-[var(--ink)] opacity-90 leading-relaxed italic">
                  &ldquo;{item.wish}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {allWishes.length > visibleCount && (
          <div className="mt-16 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-[var(--deep)] text-[var(--deep)] hover:bg-[var(--deep)] hover:text-white transition-all duration-300 text-xs tracking-[0.2em] font-medium uppercase cursor-pointer"
            >
              <span>MUAT LEBIH BANYAK</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
