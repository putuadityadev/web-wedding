'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface WishItem {
  id: string;
  name: string;
  wish: string;
  createdAt: string;
  visible: boolean;
}

export default function AdminWishesPage() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchWishes = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/wishes');
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal mengambil data ucapan');
      }
      setWishes(json.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala memuat data ucapan';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    const nextVisible = !currentVisible;
    try {
      const res = await fetch('/api/admin/wishes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, visible: nextVisible }),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal mengubah status');
      }

      setWishes((prev) =>
        prev.map((w) => (w.id === id ? { ...w, visible: nextVisible } : w))
      );
      showToast(nextVisible ? 'Ucapan ditampilkan di publik.' : 'Ucapan disembunyikan dari publik.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah visibilitas';
      showToast(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus ucapan doa ini dari database?')) return;

    try {
      const res = await fetch(`/api/admin/wishes?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menghapus ucapan');
      }

      setWishes((prev) => prev.filter((w) => w.id !== id));
      showToast('Ucapan berhasil dihapus.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus ucapan';
      showToast(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-medium bg-[#0F1B2D] text-white border border-white/20 animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
            MODERASI KOMUNITAS
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
            Dinding Doa & Ucapan Tamu
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
            Saring dan moderasi ucapan doa restu yang tampil pada bagian publik dinding ucapan undangan pernikahan.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchWishes}
          className="px-3.5 py-2 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium shadow-2xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span>🔄 Segarkan Data</span>
        </button>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] p-4 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={fetchWishes}
            className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-[11px] font-medium"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Wishes List */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] shadow-xs divide-y divide-[#0F1B2D]/5">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#0F1B2D]/50 font-mono">
            <div className="w-7 h-7 border-2 border-[#0F1B2D]/20 border-t-[#0F1B2D] rounded-full animate-spin mx-auto mb-2" />
            Memuat data ucapan dari Supabase...
          </div>
        ) : wishes.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#0F1B2D]/5 text-[#0F1B2D]/60 flex items-center justify-center text-xl mx-auto mb-3">
              💌
            </div>
            <h4 className="font-serif text-base font-medium text-[#0F1B2D]">
              Belum Ada Ucapan Doa dari Tamu
            </h4>
            <p className="text-xs text-[#0F1B2D]/60 max-w-sm mx-auto mt-1">
              Saat para tamu mengirimkan ucapan melalui formulir RSVP di halaman undangan mereka, ucapan tersebut akan langsung muncul di sini.
            </p>
          </div>
        ) : (
          wishes.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-[#F9FAFB]/50 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-base font-medium text-[#0F1B2D]">
                    {item.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                      item.visible
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}
                  >
                    {item.visible ? 'TAMPIL DI PUBLIK' : 'DISEMBUNYIKAN'}
                  </span>
                </div>
                <p className="text-xs text-[#0F1B2D]/80 leading-relaxed font-light">
                  &ldquo;{item.wish}&rdquo;
                </p>
                <span className="text-[10px] text-[#0F1B2D]/40 font-mono block">
                  {new Date(item.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVisibility(item.id, item.visible)}
                  className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                    item.visible
                      ? 'border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D]'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
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
          ))
        )}
      </div>
    </div>
  );
}
