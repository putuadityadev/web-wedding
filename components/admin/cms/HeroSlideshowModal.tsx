'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/lib/content/types';
import {
  optimizeImageForUpload,
  formatBytes,
} from '@/lib/media/clientImageOptimizer';

interface HeroSlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUrls: string[];
  onApply: (urls: string[]) => void;
}

export function HeroSlideshowModal({
  isOpen,
  onClose,
  selectedUrls,
  onApply,
}: HeroSlideshowModalProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local selection list (maintains order)
  const [currentSelected, setCurrentSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');

  // Upload state
  const [uploadStage, setUploadStage] = useState<'idle' | 'optimizing' | 'uploading'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Sync selectedUrls on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentSelected([...selectedUrls]);
      fetchGallery();
    }
  }, [isOpen, selectedUrls]);

  const fetchGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/gallery?type=photo');
      const data = await res.json();
      if (data.ok && data.data?.items) {
        setItems(data.data.items);
      } else {
        setError(data.error || 'Gagal memuat foto galeri');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat foto galeri');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Must be photo
      if (it.mediaType === 'video' || it.videoSrc) return false;
      if (!it.src) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          it.title?.toLowerCase().includes(q) ||
          it.label?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search]);

  const toggleSelect = (url: string) => {
    setCurrentSelected((prev) => {
      if (prev.includes(url)) {
        return prev.filter((u) => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const selectAll = () => {
    const allFilteredUrls = filteredItems.map((it) => it.src).filter(Boolean);
    const set = new Set([...currentSelected, ...allFilteredUrls]);
    setCurrentSelected(Array.from(set));
  };

  const clearAll = () => {
    setCurrentSelected([]);
  };

  // Upload handler with client image optimization to WebP
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploadStage('optimizing');

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const optimized = await optimizeImageForUpload(file, {
          maxDimension: 2560,
          quality: 0.88,
        });

        setUploadStage('uploading');

        const formData = new FormData();
        formData.append('file', optimized.file);
        formData.append('folder', 'hero/slideshow');

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          throw new Error(data.error || `Gagal mengunggah ${file.name}`);
        }
      }

      // Add to selection
      setCurrentSelected((prev) => [...prev, ...uploadedUrls]);
      // Refetch gallery to show newly uploaded photos
      await fetchGallery();
      setActiveTab('gallery');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Gagal mengunggah foto');
    } finally {
      setUploadStage('idle');
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <h3 className="text-base font-serif font-bold text-[#0F1B2D]">
              Pilih Foto Slideshow Hero
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pilih satu atau beberapa foto dari galeri untuk ditayangkan sebagai slideshow di latar belakang Hero.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'gallery'
                  ? 'bg-[#0F1B2D] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Foto Galeri ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#0F1B2D] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              + Unggah Foto Baru
            </button>
          </div>

          {activeTab === 'gallery' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari foto..."
                className="w-full sm:w-56 px-3 py-1.5 rounded-lg text-xs border border-stone-200 focus:outline-none focus:border-[#0F1B2D]"
              />
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1.5 rounded text-xs text-stone-600 hover:bg-stone-100 font-medium whitespace-nowrap"
              >
                Pilih Semua
              </button>
              {currentSelected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2.5 py-1.5 rounded text-xs text-rose-600 hover:bg-rose-50 font-medium whitespace-nowrap"
                >
                  Kosongkan
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[320px]">
          {activeTab === 'gallery' ? (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                  <div className="w-8 h-8 border-2 border-stone-300 border-t-[#0F1B2D] rounded-full animate-spin mb-3" />
                  <span className="text-xs">Memuat foto galeri...</span>
                </div>
              ) : error ? (
                <div className="text-center py-16 text-rose-500 text-xs">
                  {error}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs">
                  Tidak ada foto ditemukan di galeri. Silakan unggah foto terlebih dahulu.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {filteredItems.map((item) => {
                    const isSelected = currentSelected.includes(item.src);
                    const selectedIndex = currentSelected.indexOf(item.src) + 1;

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.src)}
                        className={`group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer border-2 transition-all duration-200 select-none ${
                          isSelected
                            ? 'border-[#0F1B2D] ring-2 ring-[#0F1B2D]/20 shadow-md scale-[0.98]'
                            : 'border-transparent hover:border-stone-300'
                        }`}
                      >
                        <Image
                          src={item.src}
                          alt={item.title || item.label || 'Foto Galeri'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Dark Gradient Overlay on Hover/Selected */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 ${
                            isSelected
                              ? 'bg-[#0F1B2D]/35'
                              : 'bg-black/0 group-hover:bg-black/20'
                          }`}
                        />

                        {/* Order Badge / Checkbox */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-[#0F1B2D] text-white flex items-center justify-center text-[11px] font-bold shadow-md">
                              {selectedIndex}
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-white/80 border border-stone-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="w-2 h-2 rounded-full bg-transparent" />
                            </span>
                          )}
                        </div>

                        {/* Title Caption */}
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white">
                          <p className="text-[10px] font-medium truncate drop-shadow-sm">
                            {item.title || item.label || 'Momen Galeri'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Upload Tab */
            <div className="max-w-md mx-auto py-10 flex flex-col items-center text-center">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => uploadInputRef.current?.click()}
                className="w-full border-2 border-dashed border-stone-300 hover:border-[#0F1B2D] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-stone-50"
              >
                <div className="w-12 h-12 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600 mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-stone-700 mb-1">
                  Klik untuk Memilih Foto
                </p>
                <p className="text-[11px] text-stone-400">
                  Dapat memilih beberapa foto sekaligus. Gambar akan otomatis dikonversi ke WebP tajam (~200KB).
                </p>
              </div>

              {uploadStage !== 'idle' && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[#0F1B2D]">
                  <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-[#0F1B2D] rounded-full animate-spin" />
                  <span>
                    {uploadStage === 'optimizing' ? 'Mengoptimasi foto ke WebP...' : 'Mengunggah ke server...'}
                  </span>
                </div>
              )}

              {uploadError && (
                <p className="mt-3 text-xs text-rose-500">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="text-xs text-stone-600">
            <span className="font-semibold text-[#0F1B2D]">{currentSelected.length}</span> foto dipilih untuk slideshow
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-200/60 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(currentSelected);
                onClose();
              }}
              disabled={currentSelected.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F1B2D] text-white hover:bg-[#1E293B] shadow-sm disabled:opacity-40 transition-all cursor-pointer"
            >
              Terapkan Foto Terpilih ({currentSelected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
