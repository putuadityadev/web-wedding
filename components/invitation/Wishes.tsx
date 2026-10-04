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
    wish: 'Selamat menempuh hidup baru untuk Dharma dan Lutfhy. Semoga senantiasa diberkahi kebahagiaan, keharmonisan, dan cinta yang abadi sepanjang hayat.',
    timeAgo: '2 jam yang lalu',
  },
  {
    id: 'w-2',
    name: 'Dimas Wicaksono',
    wish: 'Akhirnya hari yang ditunggu tiba! Selamat menempuh perjalanan baru, Bli Dharma & Kak Lutfhy. Semoga cinta kalian semakin hangat dari hari ke hari.',
    timeAgo: '5 jam yang lalu',
  },
  {
    id: 'w-3',
    name: 'Sarah & Danang',
    wish: 'Selamat ya Lutfhy & Dharma! Rekan-rekan turut berbahagia dan bangga. Bahagia selalu dan saling menguatkan dalam setiap langkah.',
    timeAgo: '1 hari yang lalu',
  },
  {
    id: 'w-4',
    name: 'Keluarga Besar dr. Bambang',
    wish: 'Turut berbahagia atas pernikahan Dharma dan Lutfhy. Kiranya Tuhan Yang Maha Esa melimpahkan kebahagiaan, kesehatan, dan keharmonisan selalu.',
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
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none"
    >
      <div className="max-w-5xl mx-auto w-full">
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
