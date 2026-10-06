'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/lib/content/types';
import {
  optimizeImageForUpload,
  formatBytes,
} from '@/lib/media/clientImageOptimizer';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: GalleryItem) => void;
  mediaType?: 'image' | 'video' | 'audio' | 'any';
  currentValue?: string;
  title?: string;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  mediaType = 'image',
  currentValue = '',
  title = 'Pilih dari Pustaka Galeri',
}: MediaLibraryModalProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'browse' (pilih dari galeri) | 'upload' (unggah baru langsung)
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Filter & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Upload state
  const [uploadStage, setUploadStage] = useState<'idle' | 'optimizing' | 'uploading'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch gallery items when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/api/admin/gallery')
      .then((res) => res.json())
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && res.data?.items) {
          setItems(res.data.items);
          // Auto select if currentValue matches an existing item
          if (currentValue) {
            const found = res.data.items.find(
              (it: GalleryItem) => it.src === currentValue || it.videoSrc === currentValue
            );
            if (found) setSelectedItem(found);
          }
        } else {
          setError(res.error || 'Gagal memuat galeri');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Gagal memuat galeri');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentValue]);

  // Filter items sesuai pencarian dan tipe media yang diminta
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Filter tipe media
      const isVideo = it.mediaType === 'video' || Boolean(it.videoSrc);
      if (mediaType === 'video' && !isVideo) return false;
      if (mediaType === 'image' && isVideo) return false;

      // Sub-filter tabs
      if (typeFilter === 'photo' && isVideo) return false;
      if (typeFilter === 'video' && !isVideo) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = it.title?.toLowerCase().includes(q);
        const matchLabel = it.label?.toLowerCase().includes(q);
        const matchCategory = it.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchLabel && !matchCategory) return false;
      }

      return true;
    });
  }, [items, mediaType, typeFilter, search]);

  if (!isOpen) return null;

  const handleConfirmSelect = () => {
    if (!selectedItem) return;
    const url =
      selectedItem.mediaType === 'video' && selectedItem.videoSrc
        ? selectedItem.videoSrc
        : selectedItem.src;
    onSelect(url, selectedItem);
    onClose();
  };

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadError(null);

    try {
      let fileToUpload = rawFile;
      const isImg =
        rawFile.type.startsWith('image/') ||
        mediaType === 'image' ||
        /\.(jpe?g|png|webp|avif|heic|heif|bmp)$/i.test(rawFile.name);

      if (isImg && !rawFile.type.startsWith('video/') && !rawFile.type.startsWith('audio/')) {
        setUploadStage('optimizing');
        try {
          const opt = await optimizeImageForUpload(rawFile, { maxDimension: 2560, quality: 0.85 });
          if (opt && opt.file) fileToUpload = opt.file;
        } catch (e) {
          console.warn('[PickerUpload] Optimasi client dilewati:', e);
        }
      }

      setUploadStage('uploading');
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', 'gallery');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let uploadResult: { ok?: boolean; url?: string; error?: string } = {};
      try {
        uploadResult = JSON.parse(responseText);
      } catch {
        throw new Error(`Respon upload tidak valid (${res.status})`);
      }

      if (!res.ok || !uploadResult.ok || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload gagal');
      }

      const uploadedUrl = uploadResult.url;
      const isVideoFile =
        fileToUpload.type.startsWith('video/') ||
        /\.(mp4|webm|mov|m4v)$/i.test(fileToUpload.name);

      // Simpan langsung ke koleksi galeri
      const newGalleryItem: Partial<GalleryItem> = {
        label: isVideoFile ? 'MOMEN VIDEO' : 'DOKUMENTASI',
        title: rawFile.name.replace(/\.[^/.]+$/, ''),
        src: uploadedUrl,
        mediaType: isVideoFile ? 'video' : 'photo',
        videoSrc: isVideoFile ? uploadedUrl : undefined,
        aspectRatio: isVideoFile ? '16/9' : '4/5',
        isPrimary: false,
      };

      const addRes = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newGalleryItem }),
      });

      const addJson = await addRes.json().catch(() => ({}));
      if (addJson.ok && addJson.items?.[0]) {
        const created = addJson.items[0];
        setItems((prev) => [created, ...prev]);
        setSelectedItem(created);
      }

      // Langsung pilih dan tutup modal
      onSelect(uploadedUrl, newGalleryItem as GalleryItem);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah media baru';
      setUploadError(msg);
    } finally {
      setUploadStage('idle');
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#0F1B2D]/15 text-[#0F1B2D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#0F1B2D]/10 flex items-center justify-between bg-[#F9FAFB] shrink-0">
          <div>
            <h3 className="text-base font-serif font-semibold text-[#0F1B2D] flex items-center gap-2">
              <span>🖼️</span>
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-[#0F1B2D]/55 font-mono mt-0.5">
              Pilih foto atau video dari penyimpanan galeri tanpa perlu upload ulang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-[#0F1B2D]/70 hover:text-[#0F1B2D] flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Toolbar */}
        <div className="px-5 py-3 border-b border-[#0F1B2D]/10 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-white text-[#0F1B2D] shadow-xs font-semibold'
                  : 'text-[#0F1B2D]/60 hover:text-[#0F1B2D]'
              }`}
            >
              Pilih dari Galeri ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-[#0F1B2D] shadow-xs font-semibold'
                  : 'text-[#0F1B2D]/60 hover:text-[#0F1B2D]'
              }`}
            >
              <span>+</span>
              <span>Unggah Baru</span>
            </button>
          </div>

          {activeTab === 'browse' && (
            <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
              {/* Type Filter */}
              {mediaType === 'any' && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'photo' | 'video')}
                  className="px-2.5 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white text-[#0F1B2D]"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="photo">Foto Saja</option>
                  <option value="video">Video Saja</option>
                </select>
              )}

              {/* Search Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama momen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
                <span className="absolute left-2.5 top-2 text-[#0F1B2D]/40 text-xs">🔍</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#F4F6F9]">
          {activeTab === 'browse' ? (
            <>
              {loading ? (
                <div className="py-24 text-center">
                  <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
                  <p className="text-xs font-mono text-[#0F1B2D]/60">Memuat koleksi galeri...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center">
                  {error}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-20 text-center text-[#0F1B2D]/50 font-mono text-xs">
                  <span className="text-3xl block mb-2">🖼️</span>
                  <span>Tidak ada media ditemukan dalam galeri.</span>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="px-3.5 py-1.5 rounded bg-[#0F1B2D] text-white text-xs font-medium cursor-pointer"
                    >
                      Unggah Foto Baru Sekarang
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredItems.map((item) => {
                    const isVideo = item.mediaType === 'video' || Boolean(item.videoSrc);
                    const itemUrl = isVideo && item.videoSrc ? item.videoSrc : item.src;
                    const isSelected = selectedItem?.id === item.id || itemUrl === currentValue;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        onDoubleClick={() => {
                          setSelectedItem(item);
                          handleConfirmSelect();
                        }}
                        className={`group relative rounded-lg overflow-hidden bg-white border-2 cursor-pointer transition-all flex flex-col shadow-2xs hover:shadow-md ${
                          isSelected
                            ? 'border-[#0F1B2D] ring-2 ring-[#0F1B2D]/20 shadow-sm'
                            : 'border-transparent hover:border-stone-300'
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative w-full aspect-4/5 bg-stone-100 overflow-hidden">
                          {isVideo ? (
                            <div className="relative w-full h-full bg-black/80 flex items-center justify-center">
                              <video
                                src={item.videoSrc || item.src}
                                poster={item.posterSrc || item.src}
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono font-bold text-white uppercase tracking-wider">
                                VIDEO
                              </div>
                            </div>
                          ) : (
                            <Image
                              src={item.src}
                              alt={item.title || 'Galeri'}
                              fill
                              unoptimized={true}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}

                          {/* Selected Check Badge */}
                          {isSelected && (
                            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#0F1B2D] text-white flex items-center justify-center text-xs font-bold shadow-md">
                              ✓
                            </div>
                          )}

                          {/* Primary Beranda Badge */}
                          {item.isPrimary && (
                            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono text-amber-300 font-bold backdrop-blur-xs">
                              ★ Beranda
                            </div>
                          )}
                        </div>

                        {/* Title Caption */}
                        <div className="p-2 bg-white">
                          <p className="text-[11px] font-medium text-[#0F1B2D] truncate" title={item.title}>
                            {item.title || 'Momen'}
                          </p>
                          <p className="text-[9px] font-mono text-[#0F1B2D]/50 uppercase tracking-wider truncate">
                            {item.label} · {item.aspectRatio}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Upload Baru Langsung */
            <div className="max-w-xl mx-auto py-10">
              <div className="p-8 rounded-xl border-2 border-dashed border-[#0F1B2D]/20 bg-white text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#0F1B2D]/5 text-2xl flex items-center justify-center mx-auto text-[#0F1B2D]">
                  {uploadStage === 'optimizing' ? '⚡' : uploadStage === 'uploading' ? '⏳' : '📤'}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#0F1B2D]">
                    {uploadStage === 'optimizing'
                      ? 'Mengompres & Mengoptimasi Foto...'
                      : uploadStage === 'uploading'
                      ? 'Mengunggah ke Supabase Storage...'
                      : 'Pilih File untuk Diunggah'}
                  </h4>
                  <p className="text-xs text-[#0F1B2D]/55 mt-1 font-mono">
                    Format foto bebas (AVIF, HEIC, JPG, PNG, WebP) otomatis dikonversi ke WebP ringan dan tersimpan ke galeri.
                  </p>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
                    {uploadError}
                  </div>
                )}

                <input
                  ref={uploadInputRef}
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*,video/*'}
                  onChange={handleUploadNew}
                  disabled={uploadStage !== 'idle'}
                  className="hidden"
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={uploadStage !== 'idle'}
                    className="px-5 py-2.5 rounded-lg bg-[#0F1B2D] hover:bg-[#0F1B2D]/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {uploadStage !== 'idle' ? 'Memproses...' : 'Pilih File dari Komputer/Ponsel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#0F1B2D]/10 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs font-mono text-[#0F1B2D]/60 truncate max-w-md">
            {selectedItem ? (
              <span>
                Terpilih: <strong>{selectedItem.title}</strong> ({selectedItem.label})
              </span>
            ) : (
              <span>Klik salah satu foto untuk memilih.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 text-xs font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedItem}
              className="px-5 py-2 rounded-lg bg-[#0F1B2D] hover:bg-[#0F1B2D]/90 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              Gunakan Media Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
