'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { GalleryItem, GalleryContent } from '@/lib/content/types';
import {
  optimizeImageForUpload,
  formatBytes,
} from '@/lib/media/clientImageOptimizer';

interface GalleryManagerProps {
  initialGallery: GalleryContent;
}

export function GalleryManager({ initialGallery }: GalleryManagerProps) {
  const [gallery, setGallery] = useState<GalleryContent>(initialGallery);
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
  const [search, setSearch] = useState('');
  const [filterPrimary, setFilterPrimary] = useState(false);

  // Loading & toast states
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Batch upload state
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    current: number;
    stage: 'optimizing' | 'uploading';
  } | null>(null);

  // Edit item modal state
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Video add modal state
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoPoster, setNewVideoPoster] = useState('');
  const [newVideoLabel, setNewVideoLabel] = useState('MOMEN VIDEO');

  const batchFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Hitung jumlah foto & video
  const photos = useMemo(
    () => gallery.items.filter((it) => it.mediaType !== 'video' && !it.videoSrc),
    [gallery.items]
  );
  const videos = useMemo(
    () => gallery.items.filter((it) => it.mediaType === 'video' || Boolean(it.videoSrc)),
    [gallery.items]
  );
  const primaryCount = useMemo(
    () => gallery.items.filter((it) => it.isPrimary !== false).length,
    [gallery.items]
  );

  // Filter items sesuai tab dan pencarian
  const currentList = useMemo(() => {
    let list = activeTab === 'photo' ? photos : videos;

    if (filterPrimary) {
      list = list.filter((it) => it.isPrimary !== false);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.label?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeTab, photos, videos, filterPrimary, search]);

  // Handler: Batch Upload Foto
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setBatchProgress({ total: files.length, current: 0, stage: 'optimizing' });

    const newUploadedItems: Partial<GalleryItem>[] = [];
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setBatchProgress({ total: files.length, current: i + 1, stage: 'optimizing' });

        // 1. Optimasi WebP otomatis di browser
        let fileToUpload = file;
        try {
          const opt = await optimizeImageForUpload(file, { maxDimension: 2560, quality: 0.85 });
          if (opt && opt.file) fileToUpload = opt.file;
        } catch (e) {
          console.warn('[Batch] Optimizer fallback:', e);
        }

        // 2. Upload file
        setBatchProgress({ total: files.length, current: i + 1, stage: 'uploading' });
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('folder', 'gallery');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadText = await uploadRes.text();
        const uploadJson = JSON.parse(uploadText);

        if (uploadRes.ok && uploadJson.ok && uploadJson.url) {
          const baseName = file.name.replace(/\.[^/.]+$/, '').trim();
          newUploadedItems.push({
            label: 'DOKUMENTASI',
            title: baseName || `Momen ${gallery.items.length + successCount + 1}`,
            src: uploadJson.url,
            aspectRatio: '4/5',
            mediaType: 'photo',
            isPrimary: false,
            category: 'Galeri',
          });
          successCount++;
        }
      }

      if (newUploadedItems.length > 0) {
        // 3. Simpan ke database via /api/admin/gallery
        const saveRes = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: newUploadedItems }),
        });

        const saveJson = await saveRes.json();
        if (saveRes.ok && saveJson.ok && saveJson.items) {
          setGallery((prev) => ({
            ...prev,
            items: [...saveJson.items, ...prev.items],
          }));
          showToast(
            'success',
            `Berhasil mengunggah ${successCount} foto baru dengan optimasi WebP otomatis!`
          );
        } else {
          throw new Error(saveJson.error || 'Gagal menyimpan item ke database');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat upload batch';
      showToast('error', msg);
    } finally {
      setBatchProgress(null);
      if (batchFileInputRef.current) batchFileInputRef.current.value = '';
    }
  };

  // Handler: Tambah Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) {
      showToast('error', 'URL file video wajib diisi');
      return;
    }

    try {
      const newVideoItem: Partial<GalleryItem> = {
        label: newVideoLabel.trim() || 'MOMEN VIDEO',
        title: newVideoTitle.trim() || 'Video Sinematik',
        src: newVideoUrl.trim(),
        videoSrc: newVideoUrl.trim(),
        posterSrc: newVideoPoster.trim() || undefined,
        aspectRatio: '16/9',
        mediaType: 'video',
        isPrimary: false,
        category: 'Video',
      };

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newVideoItem }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok || !json.items?.[0]) {
        throw new Error(json.error || 'Gagal menambahkan video');
      }

      setGallery((prev) => ({
        ...prev,
        items: [json.items[0], ...prev.items],
      }));

      setShowAddVideoModal(false);
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoPoster('');
      showToast('success', 'Video berhasil ditambahkan ke galeri!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan video';
      showToast('error', msg);
    }
  };

  // Handler: Toggle Slot Beranda (isPrimary)
  const handleTogglePrimary = async (item: GalleryItem) => {
    const nextVal = !item.isPrimary;

    // Cek batas maksimal 8 slot utama jika sedang mengaktifkan
    if (nextVal && primaryCount >= 8) {
      if (
        !confirm(
          `Sudah ada ${primaryCount} item bertanda "Slot Beranda". Beranda direkomendasikan maksimal 8 item agar track geser tetap proporsional. Tetap aktifkan?`
        )
      ) {
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: { id: item.id, isPrimary: nextVal },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal memperbarui status');
      }

      setGallery((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === item.id ? { ...it, isPrimary: nextVal } : it
        ),
      }));

      showToast(
        'success',
        nextVal
          ? `"${item.title}" ditambahkan ke Slot Beranda`
          : `"${item.title}" dilepas dari Slot Beranda`
      );
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mengupdate');
    }
  };

  // Handler: Hapus Item
  const handleDeleteItem = async (item: GalleryItem) => {
    if (!confirm(`Yakin ingin menghapus "${item.title}" dari galeri?`)) return;

    try {
      const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(String(item.id))}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal menghapus item');
      }

      setGallery((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it.id !== item.id),
      }));

      showToast('success', `"${item.title}" berhasil dihapus.`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  // Handler: Simpan Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: editingItem }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal memperbarui detail');
      }

      setGallery((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === editingItem.id ? editingItem : it)),
      }));

      setEditingItem(null);
      showToast('success', 'Detail item berhasil diperbarui!');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan detail');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 text-white animate-in slide-in-from-bottom duration-300 ${
            toast.type === 'success' ? 'bg-emerald-900' : 'bg-red-900'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="p-6 rounded-xl bg-white border border-[#0F1B2D]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <h1 className="text-xl font-serif font-bold text-[#0F1B2D]">
              Manajemen Galeri &amp; Pustaka Media
            </h1>
          </div>
          <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl">
            Kelola foto dan video pernikahan di satu tempat terpusat. Foto otomatis dikonversi ke WebP ringan
            beresolusi tinggi, dan dapat langsung dipilih di section manapun di CMS.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-[#0F1B2D]/5 text-[#0F1B2D]">
              📸 <strong>{photos.length}</strong> Foto
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#0F1B2D]/5 text-[#0F1B2D]">
              🎬 <strong>{videos.length}</strong> Video
            </span>
            <span
              className={`px-2.5 py-1 rounded-md ${
                primaryCount <= 8
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-orange-50 text-orange-900 border border-orange-200'
              }`}
            >
              ★ <strong>{primaryCount}</strong> Slot Beranda{' '}
              <span className="text-[10px] text-[#0F1B2D]/50">(rekomen 6-8)</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={batchFileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleBatchUpload}
            disabled={Boolean(batchProgress)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => batchFileInputRef.current?.click()}
            disabled={Boolean(batchProgress)}
            className="px-4 py-2.5 rounded-lg bg-[#0F1B2D] hover:bg-[#0F1B2D]/90 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>📤</span>
            <span>Batch Upload Foto</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddVideoModal(true)}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>🎬</span>
            <span>Tambah Video</span>
          </button>
        </div>
      </div>

      {/* Progress Bar for Batch Upload */}
      {batchProgress && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>
                {batchProgress.stage === 'optimizing'
                  ? `Mengompres & Mengoptimasi foto ${batchProgress.current} dari ${batchProgress.total} ke WebP...`
                  : `Mengunggah foto ${batchProgress.current} dari ${batchProgress.total} ke Supabase...`}
              </span>
            </span>
            <span className="font-mono">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 transition-all duration-300"
              style={{
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#0F1B2D]/10">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'photo'
                ? 'bg-white text-[#0F1B2D] shadow-xs font-semibold'
                : 'text-[#0F1B2D]/60 hover:text-[#0F1B2D]'
            }`}
          >
            <span>📸</span>
            <span>Koleksi Foto ({photos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'bg-white text-[#0F1B2D] shadow-xs font-semibold'
                : 'text-[#0F1B2D]/60 hover:text-[#0F1B2D]'
            }`}
          >
            <span>🎬</span>
            <span>Koleksi Video ({videos.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <button
            type="button"
            onClick={() => setFilterPrimary(!filterPrimary)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
              filterPrimary
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-[#0F1B2D]/15 text-[#0F1B2D]/70 hover:bg-stone-50'
            }`}
          >
            ★ Slot Beranda Saja
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Cari ${activeTab === 'photo' ? 'foto' : 'video'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
            />
            <span className="absolute left-2.5 top-2 text-[#0F1B2D]/40 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Grid Items (Pinterest / Masonry Style) */}
      {currentList.length === 0 ? (
        <div className="p-16 rounded-xl bg-white border border-[#0F1B2D]/10 text-center space-y-3">
          <span className="text-4xl block">🖼️</span>
          <p className="text-sm font-serif font-semibold text-[#0F1B2D]">
            Belum ada media dalam kategori ini
          </p>
          <p className="text-xs text-[#0F1B2D]/60 max-w-sm mx-auto font-mono">
            {activeTab === 'photo'
              ? 'Klik "Batch Upload Foto" untuk mengunggah banyak foto sekaligus.'
              : 'Klik "Tambah Video" untuk menyematkan video pernikahan.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {currentList.map((item) => {
            const isVideo = item.mediaType === 'video' || Boolean(item.videoSrc);

            return (
              <div
                key={item.id}
                className="break-inside-avoid rounded-xl overflow-hidden bg-white border border-[#0F1B2D]/10 shadow-2xs hover:shadow-md transition-all group flex flex-col"
              >
                {/* Media Preview Box */}
                <div
                  className="relative w-full overflow-hidden bg-stone-100"
                  style={{
                    aspectRatio:
                      item.aspectRatio === '16/10' || item.aspectRatio === '16/9'
                        ? '16/9'
                        : item.aspectRatio === '1/1'
                        ? '1/1'
                        : item.aspectRatio === '3/4'
                        ? '3/4'
                        : '4/5',
                  }}
                >
                  {isVideo ? (
                    <div className="relative w-full h-full bg-black/80 flex items-center justify-center">
                      <video
                        src={item.videoSrc || item.src}
                        poster={item.posterSrc || item.src}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-mono font-bold text-white uppercase backdrop-blur-xs">
                        VIDEO
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.title || 'Foto Galeri'}
                      fill
                      unoptimized={true}
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  )}

                  {/* Star Toggle Badge (Slot Beranda) */}
                  <button
                    type="button"
                    onClick={() => handleTogglePrimary(item)}
                    className={`absolute top-2.5 left-2.5 px-2 py-1 rounded-md text-[10px] font-mono font-bold backdrop-blur-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer ${
                      item.isPrimary
                        ? 'bg-amber-400 text-stone-900 border border-amber-300'
                        : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white border border-white/20'
                    }`}
                    title={
                      item.isPrimary
                        ? 'Item ini tampil di track utama beranda (Klik untuk melepas)'
                        : 'Klik untuk menampilkan di track utama beranda'
                    }
                  >
                    <span>★</span>
                    <span>{item.isPrimary ? 'Beranda' : 'Jadikan Beranda'}</span>
                  </button>
                </div>

                {/* Card Metadata & Actions */}
                <div className="p-3.5 space-y-2 bg-white flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#0F1B2D]/50 uppercase tracking-wider mb-1">
                      <span>{item.label}</span>
                      <span>{item.aspectRatio}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-[#0F1B2D] truncate" title={item.title}>
                      {item.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-[#0F1B2D]/5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="text-[11px] text-[#0F1B2D]/70 hover:text-[#0F1B2D] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>✏️</span>
                      <span>Edit Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="text-[11px] text-red-600 hover:text-red-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>🗑️</span>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Edit Detail Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-[#0F1B2D]/15 text-[#0F1B2D]">
            <div className="px-5 py-4 border-b border-[#0F1B2D]/10 flex items-center justify-between bg-[#F9FAFB]">
              <h3 className="text-sm font-serif font-bold text-[#0F1B2D]">
                Edit Detail Media Galeri
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-stone-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  Judul / Nama Momen
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Label Kategori
                  </label>
                  <input
                    type="text"
                    value={editingItem.label}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                    placeholder="DOKUMENTASI"
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Aspek Rasio
                  </label>
                  <select
                    value={editingItem.aspectRatio}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, aspectRatio: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                  >
                    <option value="4/5">Portrait (4:5)</option>
                    <option value="3/4">Portrait (3:4)</option>
                    <option value="1/1">Square (1:1)</option>
                    <option value="16/9">Landscape (16:9)</option>
                    <option value="16/10">Landscape (16:10)</option>
                  </select>
                </div>
              </div>

              {editingItem.mediaType === 'video' && (
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    URL Gambar Thumbnail / Poster
                  </label>
                  <input
                    type="text"
                    value={editingItem.posterSrc || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, posterSrc: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 font-mono"
                  />
                </div>
              )}

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#0F1B2D]">Slot Utama Beranda</p>
                  <p className="text-[10px] text-[#0F1B2D]/60 font-mono">
                    Tampilkan di carousel horizontal halaman utama undangan.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editingItem.isPrimary || false}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, isPrimary: e.target.checked })
                  }
                  className="w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded border border-[#0F1B2D]/15 text-xs text-[#0F1B2D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#0F1B2D] text-white text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Video Baru */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-[#0F1B2D]/15 text-[#0F1B2D]">
            <div className="px-5 py-4 border-b border-[#0F1B2D]/10 flex items-center justify-between bg-[#F9FAFB]">
              <h3 className="text-sm font-serif font-bold text-[#0F1B2D]">
                Tambah Video Pernikahan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddVideoModal(false)}
                className="text-stone-400 hover:text-stone-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  Judul Video
                </label>
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="Cinematic Teaser Dharma & Luthfi"
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  URL File Video (Direct URL WebM / MP4) *
                </label>
                <input
                  type="text"
                  required
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://... / nama-video.webm"
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  URL Thumbnail / Poster Video (Opsional)
                </label>
                <input
                  type="text"
                  value={newVideoPoster}
                  onChange={(e) => setNewVideoPoster(e.target.value)}
                  placeholder="https://... (gambar cover sebelum video diputar)"
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={newVideoLabel}
                  onChange={(e) => setNewVideoLabel(e.target.value)}
                  placeholder="MOMEN VIDEO"
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-4 py-2 rounded border border-[#0F1B2D]/15 text-xs text-[#0F1B2D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#0F1B2D] text-white text-xs font-semibold"
                >
                  Tambah Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
