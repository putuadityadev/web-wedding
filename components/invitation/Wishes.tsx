'use client';

import React, { useState } from 'react';

export interface WishItem {
  id: string;
  name: string;
  wish: string;
  timeAgo: string;
}

const INITIAL_WISHES: WishItem[] = [
  {
    id: 'w-1',
    name: 'Bapak H. Sukardi & Keluarga',
    wish: 'Selamat menempuh hidup baru untuk Aditya dan Clarissa. Semoga senantiasa diberkahi sakinah, mawaddah, dan rahmah sepanjang hayat.',
    timeAgo: '2 jam yang lalu',
  },
  {
    id: 'w-2',
    name: 'Dimas Wicaksono',
    wish: 'Akhirnya hari yang ditunggu tiba! Selamat menempuh perjalanan baru, Dit & Clarissa. Semoga cinta kalian semakin hangat dari hari ke hari.',
    timeAgo: '5 jam yang lalu',
  },
  {
    id: 'w-3',
    name: 'Sarah & Danang',
    wish: 'Selamat ya Clarissa & Adit! Bahagia selalu dan saling menguatkan dalam setiap langkah. Doa terbaik dari kami berdua.',
    timeAgo: '1 hari yang lalu',
  },
  {
    id: 'w-4',
    name: 'Keluarga Besar dr. Bambang',
    wish: 'Turut berbahagia atas pernikahan Aditya dan Clarissa. Kiranya Tuhan melimpahkan kebahagiaan, kesehatan, dan keharmonisan selalu.',
    timeAgo: '2 hari yang lalu',
  },
  {
    id: 'w-5',
    name: 'Nadia & Kevin',
    wish: 'Happy wedding! Semoga perjalanan indah kalian berdua selalu dipenuhi tawa dan berkah tanpa akhir.',
    timeAgo: '3 hari yang lalu',
  },
  {
    id: 'w-6',
    name: 'Rian Pratama',
    wish: 'Selamat kawan! Semoga langgeng sampai kakek nenek, dilancarkan segala urusan dan resepsinya nanti.',
    timeAgo: '3 hari yang lalu',
  },
];

interface WishesProps {
  newWish?: { name: string; wish: string } | null;
}

export function Wishes({ newWish }: WishesProps) {
  const [wishes] = useState<WishItem[]>(INITIAL_WISHES);
  const [visibleCount, setVisibleCount] = useState(6);

  const allWishes = React.useMemo(() => {
    if (newWish && newWish.wish) {
      return [
        {
          id: `w-user-${newWish.name}`,
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
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none border-t border-[var(--hairline)]"
    >
      <div className="max-w-5xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[var(--hairline)] pb-6 mb-12">
          <div className="flex items-center gap-3">
            <span className="label-eyebrow text-[var(--deep)] tracking-[0.25em]">
              DINDING UCAPAN
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--baby-blue)]" />
          </div>
          <span className="label-eyebrow text-[var(--ink)] opacity-50 tracking-[0.2em] mt-2 sm:mt-0">
            DOA &amp; HARAPAN DARI KERABAT
          </span>
        </div>

        {/* Wishes Columns */}
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

        {/* Load More Button */}
        {visibleCount < wishes.length && (
          <div className="flex justify-center mt-12">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="label-eyebrow px-6 py-3 border border-[var(--ink)] rounded-[var(--radius-sm)] hover:bg-[var(--mist)] transition-colors tracking-[0.18em]"
            >
              MUAT LEBIH BANYAK
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
