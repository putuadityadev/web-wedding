'use client';

import React, { useState } from 'react';

interface WishItem {
  id: string;
  name: string;
  wish: string;
  createdAt: string;
  visible: boolean;
}

const INITIAL_WISHES: WishItem[] = [
  {
    id: 'w-1',
    name: 'Bapak Budi & Keluarga',
    wish: 'Selamat menempuh hidup baru Dharma & Lutfhy! Semoga senantiasa dipenuhi cinta kasih, berkah kedamaian, dan kebahagiaan abadi selamanya.',
    createdAt: '2026-10-04T14:32:00Z',
    visible: true,
  },
  {
    id: 'w-2',
    name: 'Kadek Mahendra',
    wish: 'Rahajeng ngemargiang pawiwahan bli Dharma & mbak Lutfhy! Bahagia selalu dan langgeng kanti riwekas.',
    createdAt: '2026-10-04T16:15:00Z',
    visible: true,
  },
  {
    id: 'w-3',
    name: 'Siti Rahmawati & Rekan',
    wish: 'Mohon maaf belum bisa hadir langsung di Bangli, doa tulus dari kami agar acara lancar dan kedua mempelai diberkahi keharmonisan selamanya.',
    createdAt: '2026-10-04T18:45:00Z',
    visible: true,
  },
];

export default function AdminWishesPage() {
  const [wishes, setWishes] = useState<WishItem[]>(INITIAL_WISHES);

  const toggleVisibility = (id: string) => {
    setWishes(
      wishes.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus ucapan ini secara permanen?')) {
      setWishes(wishes.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
          MODERASI KOMUNITAS
        </span>
        <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
          Dinding Doa & Ucapan Tamu
        </h2>
        <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
          Saring dan moderasi ucapan doa restu yang tampil pada bagian publik dinding ucapan undangan.
        </p>
      </div>

      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] shadow-xs divide-y divide-[#0F1B2D]/5">
        {wishes.map((item) => (
          <div key={item.id} className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-base font-medium text-[#0F1B2D]">{item.name}</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                    item.visible
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}
                >
                  {item.visible ? 'TAMPIL' : 'DISEMBUNYIKAN'}
                </span>
              </div>
              <p className="text-xs text-[#0F1B2D]/80 leading-relaxed font-light">
                &ldquo;{item.wish}&rdquo;
              </p>
              <span className="text-[10px] text-[#0F1B2D]/40 font-mono block">
                {new Date(item.createdAt).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleVisibility(item.id)}
                className="px-3 py-1.5 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-xs text-[#0F1B2D] transition-colors"
              >
                {item.visible ? 'Sembunyikan' : 'Tampilkan'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1.5 rounded text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
