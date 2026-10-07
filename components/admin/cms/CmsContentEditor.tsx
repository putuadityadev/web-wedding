'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content/types';
import { CmsSectionPreview } from './CmsSectionPreview';
import { ImageUploadField } from './ImageUploadField';
import { HeroSlideshowModal } from './HeroSlideshowModal';

interface CmsContentEditorProps {
  initialContent: SiteContent;
}

const TABS: { id: keyof SiteContent; label: string; icon: string }[] = [
  { id: 'cover', label: 'Cover & Amplop', icon: '✉️' },
  { id: 'hero', label: 'Hero Utama', icon: '✨' },
  { id: 'quote', label: 'Kutipan & Doa Pembuka', icon: '📜' },
  { id: 'couple', label: 'Profil Mempelai', icon: '💍' },
  { id: 'story', label: 'Kisah Perjalanan', icon: '📖' },
  { id: 'event', label: 'Waktu & Lokasi', icon: '📍' },
  { id: 'gallery', label: 'Galeri Foto', icon: '🖼️' },
  { id: 'gift', label: 'Tanda Kasih (Bank)', icon: '🎁' },
  { id: 'footer', label: 'Penutup (Footer)', icon: '🌿' },
  { id: 'audio', label: 'Musik Latar', icon: '🎵' },
];

export function CmsContentEditor({ initialContent }: CmsContentEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [savedContent, setSavedContent] = useState<SiteContent>(initialContent);
  const [activeTab, setActiveTab] = useState<keyof SiteContent>('cover');
  const [mobileMode, setMobileMode] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSlideshowModalOpen, setIsSlideshowModalOpen] = useState(false);

  const isSectionDirty =
    JSON.stringify(content[activeTab]) !== JSON.stringify(savedContent[activeTab]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveActiveSection = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: activeTab,
          data: content[activeTab],
        }),
      });

      const responseText = await res.text();
      let result: { ok?: boolean; error?: string } = {};
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Respon server tidak valid (${res.status}): ${responseText.slice(0, 100) || 'Gagal menyimpan perubahan'}`);
      }

      if (!res.ok || !result.ok) {
        throw new Error(result.error || `Gagal menyimpan perubahan (${res.status})`);
      }

      setSavedContent((prev) => ({
        ...prev,
        [activeTab]: JSON.parse(JSON.stringify(content[activeTab])),
      }));
      router.refresh();
      showToast('success', `Perubahan pada section "${activeTab.toUpperCase()}" berhasil disimpan!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm(`Kembalikan data section "${activeTab.toUpperCase()}" ke nilai default bawaan?`)) {
      setContent((prev) => ({
        ...prev,
        [activeTab]: DEFAULT_SITE_CONTENT[activeTab],
      }));
      showToast('success', `Section "${activeTab}" dikembalikan ke default.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-medium tracking-wide flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-[#0F1B2D] text-white border border-white/20'
              : 'bg-red-600 text-white'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Section Nav Tabs */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-2 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isTabDirty =
              JSON.stringify(content[tab.id]) !== JSON.stringify(savedContent[tab.id]);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMode('editor');
                }}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0F1B2D] text-white shadow-xs font-semibold'
                    : 'text-[#0F1B2D]/70 hover:bg-[#0F1B2D]/5 hover:text-[#0F1B2D]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {isTabDirty && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-amber-400' : 'bg-amber-500'
                    }`}
                    title="Ada perubahan belum disimpan"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Segmented Toggle (Editor vs Preview) */}
      <div className="md:hidden flex rounded-lg p-1 bg-white border border-[#0F1B2D]/10 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileMode('editor')}
          className={`flex-1 py-2 text-xs font-medium rounded text-center transition-all ${
            mobileMode === 'editor'
              ? 'bg-[#0F1B2D] text-white shadow-xs'
              : 'text-[#0F1B2D]/70'
          }`}
        >
          ✍️ Form Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileMode('preview')}
          className={`flex-1 py-2 text-xs font-medium rounded text-center transition-all ${
            mobileMode === 'preview'
              ? 'bg-[#0F1B2D] text-white shadow-xs'
              : 'text-[#0F1B2D]/70'
          }`}
        >
          👁️ Live Preview
        </button>
      </div>

      {/* Split-View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor (7 Cols on LG) */}
        <div
          className={`lg:col-span-7 bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 sm:p-8 shadow-xs space-y-6 ${
            mobileMode === 'preview' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#0F1B2D]/10 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0F1B2D]/50 block">
                MODUL CMS
              </span>
              <h2 className="font-serif text-xl text-[#0F1B2D] font-medium mt-0.5">
                Edit Section: {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveActiveSection}
                disabled={saving}
                className={`px-4 py-2 rounded text-xs font-medium tracking-wide shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all ${
                  isSectionDirty
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/40 font-semibold'
                    : 'bg-[#0F1B2D] text-white hover:bg-[#1E293B]'
                }`}
              >
                {isSectionDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />}
                <span>{saving ? 'Menyimpan...' : isSectionDirty ? 'Simpan Perubahan ●' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>

          {/* Form Fields Per Section */}
          <div className="space-y-5">
            {/* 1. COVER FORM */}
            {activeTab === 'cover' && (
              <>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Headline / Tagline Atas Cover
                  </label>
                  <input
                    type="text"
                    value={content.cover.headline ?? content.cover.badge ?? ''}
                    placeholder="We invite you to celebrate our wedding"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        cover: {
                          ...content.cover,
                          headline: e.target.value,
                          badge: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Teks kecil elegan di bagian atas layar amplop pembuka.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Panggilan Pria (Cover)
                    </label>
                    <input
                      type="text"
                      value={content.cover.groomName}
                      placeholder="Dharma"
                      onChange={(e) =>
                        setContent({
                          ...content,
                          cover: { ...content.cover, groomName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Panggilan Wanita (Cover)
                    </label>
                    <input
                      type="text"
                      value={content.cover.brideName}
                      placeholder="Lutfhy"
                      onChange={(e) =>
                        setContent({
                          ...content,
                          cover: { ...content.cover, brideName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Teks Sapaan Tamu Undangan
                  </label>
                  <input
                    type="text"
                    value={content.cover.guestGreetingLabel ?? ''}
                    placeholder="Kepada Yth. Bapak/Ibu Tamu Undangan"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        cover: { ...content.cover, guestGreetingLabel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Misal: <em>Kepada Yth. Bapak/Ibu Tamu Undangan</em> atau <em>Dear</em>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Label Tombol Buka Undangan
                    </label>
                    <input
                      type="text"
                      value={content.cover.openButtonLabel}
                      placeholder="Buka Undangan"
                      onChange={(e) =>
                        setContent({
                          ...content,
                          cover: { ...content.cover, openButtonLabel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Format Tanggal Cover (Opsional)
                    </label>
                    <input
                      type="text"
                      value={content.cover.dateDisplay ?? ''}
                      placeholder="12 · 12 · 2026"
                      onChange={(e) =>
                        setContent({
                          ...content,
                          cover: { ...content.cover, dateDisplay: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 2. HERO FORM */}
            {activeTab === 'hero' && (
              <>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Eyebrow / Badge Atas Hero
                  </label>
                  <input
                    type="text"
                    value={content.hero.badge}
                    placeholder="THE WEDDING OF"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, badge: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Teks kecil di bagian atas judul (contoh: <em>THE WEDDING OF</em>).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Panggilan Pria di Hero
                    </label>
                    <input
                      type="text"
                      value={content.hero.groomName}
                      placeholder="Dharma"
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, groomName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Panggilan Wanita di Hero
                    </label>
                    <input
                      type="text"
                      value={content.hero.brideName}
                      placeholder="Lutfhy"
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, brideName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Format Tanggal Hero
                  </label>
                  <input
                    type="text"
                    value={content.hero.dateShort}
                    placeholder="SENIN, 12 OKTOBER 2026"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, dateShort: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Teks tanggal di bawah nama mempelai di layar utama Hero.
                  </p>
                </div>

                {/* PILIHAN MODE LATAR BELAKANG HERO */}
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1 font-semibold">
                      Mode Latar Belakang Hero
                    </label>
                    <p className="text-[11px] text-stone-500 mb-2.5">
                      Pilih format media yang ditampilkan di layar pembuka Hero (bisa foto tunggal, video berulang, atau slideshow sinematik).
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            hero: { ...content.hero, bgMode: 'image' },
                          })
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          (content.hero.bgMode || 'image') === 'image'
                            ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        📷 Foto Tunggal
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            hero: { ...content.hero, bgMode: 'video' },
                          })
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          content.hero.bgMode === 'video'
                            ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        🎬 Video Looping
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            hero: { ...content.hero, bgMode: 'slideshow' },
                          })
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          content.hero.bgMode === 'slideshow'
                            ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        🎞️ Slideshow Sinematik
                      </button>
                    </div>
                  </div>

                  {/* 1. JIKA FOTO TUNGGAL */}
                  {(content.hero.bgMode || 'image') === 'image' && (
                    <ImageUploadField
                      label="Foto Potret Utama (Hero Portrait Background)"
                      value={content.hero.portraitSrc}
                      folder="hero"
                      onChange={(url) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, portraitSrc: url },
                        })
                      }
                      hint="Foto terbaik kedua mempelai. Disarankan rasio vertikal portrait (2:3 atau 4:5)."
                    />
                  )}

                  {/* 2. JIKA VIDEO */}
                  {content.hero.bgMode === 'video' && (
                    <div className="space-y-3">
                      <ImageUploadField
                        label="Video Background (MP4 / WebM)"
                        value={content.hero.videoSrc || content.hero.portraitSrc}
                        folder="hero"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        mediaType="video"
                        onChange={(url) =>
                          setContent({
                            ...content,
                            hero: {
                              ...content.hero,
                              videoSrc: url,
                              portraitSrc: url,
                            },
                          })
                        }
                        hint="Format video disarankan MP4 atau WebM dengan rasio vertikal (9:16) dan kompresi halus."
                      />
                    </div>
                  )}

                  {/* 3. JIKA SLIDESHOW SINEMATIK */}
                  {content.hero.bgMode === 'slideshow' && (
                    <div className="space-y-4 pt-1">
                      <div>
                        <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1">
                          Sumber Foto Slideshow
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                          <label
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                              (content.hero.slideshowSource || 'gallery') === 'gallery'
                                ? 'bg-white border-[#0F1B2D] ring-1 ring-[#0F1B2D] shadow-xs'
                                : 'bg-white/60 border-stone-200 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="slideshowSource"
                              checked={(content.hero.slideshowSource || 'gallery') === 'gallery'}
                              onChange={() =>
                                setContent({
                                  ...content,
                                  hero: {
                                    ...content.hero,
                                    slideshowSource: 'gallery',
                                  },
                                })
                              }
                              className="mt-0.5 text-[#0F1B2D]"
                            />
                            <div>
                              <p className="text-xs font-semibold text-[#0F1B2D]">
                                Acak Otomatis Seluruh Galeri
                              </p>
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                Sistem secara otomatis mengambil dan mengacak foto-foto dari Galeri Foto pernikahan.
                              </p>
                            </div>
                          </label>

                          <label
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                              content.hero.slideshowSource === 'custom'
                                ? 'bg-white border-[#0F1B2D] ring-1 ring-[#0F1B2D] shadow-xs'
                                : 'bg-white/60 border-stone-200 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="slideshowSource"
                              checked={content.hero.slideshowSource === 'custom'}
                              onChange={() =>
                                setContent({
                                  ...content,
                                  hero: {
                                    ...content.hero,
                                    slideshowSource: 'custom',
                                  },
                                })
                              }
                              className="mt-0.5 text-[#0F1B2D]"
                            />
                            <div>
                              <p className="text-xs font-semibold text-[#0F1B2D]">
                                Pilih Foto Spesifik
                              </p>
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                Pilih urutan foto-foto tertentu dari galeri untuk ditayangkan bergantian.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Jika Memilih Foto Spesifik */}
                      {content.hero.slideshowSource === 'custom' && (
                        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-stone-700">
                                Daftar Foto Slideshow ({content.hero.slideshowImages?.length || 0} Foto)
                              </p>
                              <p className="text-[10px] text-stone-400">
                                Foto akan bertransisi morphing crossfade secara bergantian.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSlideshowModalOpen(true)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F1B2D] text-white hover:bg-[#1E293B] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <span>🖼️ Kelola / Pilih Foto</span>
                            </button>
                          </div>

                          {/* Thumbnails preview */}
                          {content.hero.slideshowImages && content.hero.slideshowImages.length > 0 ? (
                            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
                              {content.hero.slideshowImages.map((imgUrl, idx) => (
                                <div
                                  key={`${imgUrl}-${idx}`}
                                  className="relative group shrink-0 w-20 h-24 rounded-lg overflow-hidden border border-stone-200 bg-stone-100"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Slide ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                                    #{idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (content.hero.slideshowImages || []).filter(
                                        (_, i) => i !== idx
                                      );
                                      setContent({
                                        ...content,
                                        hero: { ...content.hero, slideshowImages: updated },
                                      });
                                    }}
                                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                    title="Hapus foto ini dari slideshow"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              onClick={() => setIsSlideshowModalOpen(true)}
                              className="py-6 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:border-[#0F1B2D] hover:text-stone-600 transition-colors cursor-pointer"
                            >
                              <span className="text-xl mb-1">🖼️</span>
                              <span className="text-xs font-medium">Belum ada foto yang dipilih</span>
                              <span className="text-[10px] text-stone-400">Klik di sini untuk memilih foto dari galeri</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pengaturan Durasi per Slide */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1">
                            Durasi Tayang per Slide (Detik)
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={2}
                              max={20}
                              value={content.hero.slideshowDuration || 5}
                              onChange={(e) =>
                                setContent({
                                  ...content,
                                  hero: {
                                    ...content.hero,
                                    slideshowDuration: Math.max(2, Math.min(20, Number(e.target.value) || 5)),
                                  },
                                })
                              }
                              className="w-24 px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                            />
                            <span className="text-xs text-stone-500">detik per foto</span>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1">
                            Transisi morphing crossfade berlangsung halus selama ~1.8 detik.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Deskripsi Alt Foto
                  </label>
                  <input
                    type="text"
                    value={content.hero.portraitAlt}
                    placeholder="Potret Pengantin"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, portraitAlt: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </>
            )}

            {/* 3. QUOTE / SALAM & DOA PEMBUKA FORM */}
            {activeTab === 'quote' && (
              <>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1 font-semibold">
                    Judul / Salam Pembuka (Header)
                  </label>
                  <input
                    type="text"
                    value={content.quote.label}
                    placeholder="OM SWASTYASTU"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        quote: { ...content.quote, label: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Judul besar terpusat di atas isi teks (contoh: <em>OM SWASTYASTU</em>, <em>BISMILLAHIRRAHMANIRRAHIM</em>, atau <em>KUTIPAN SUCI</em>).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1 font-semibold">
                    Isi Teks Doa / Kutipan Pembuka
                  </label>
                  <textarea
                    rows={4}
                    value={content.quote.text}
                    placeholder="Atas Asung Kertha Wara Nugraha Ida Sang Hyang Widhi Wasa/ Tuhan Yang Maha Esa, kami bermaksud mengundang Bapak/ Ibu/ Saudara/ i pada Upacara Manusa Yadnya Pawiwahan putra dan putri kami."
                    onChange={(e) =>
                      setContent({
                        ...content,
                        quote: { ...content.quote, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] leading-relaxed"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Teks doa restu atau kutipan yang ditampilkan terpusat di layar.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1 font-semibold">
                    Sumber / Sitasi Kutipan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={content.quote.citation || ''}
                    placeholder="Rg Veda X.85.42 (Kosongkan jika tidak ada)"
                    onChange={(e) =>
                      setContent({
                        ...content,
                        quote: { ...content.quote, citation: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                {/* PILIHAN MODE LATAR BELAKANG KUTIPAN */}
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block mb-1 font-semibold">
                      Latar Belakang Seksi Kutipan
                    </label>
                    <p className="text-[11px] text-stone-500 mb-2.5">
                      Pilih tampilan latar belakang polos bersih atau foto atmosferik sinematik dari galeri.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            quote: { ...content.quote, bgMode: 'solid' },
                          })
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          (content.quote.bgMode || 'solid') === 'solid'
                            ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        ⚪ Polos (Bersih & Elegan)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            quote: { ...content.quote, bgMode: 'image' },
                          })
                        }
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          content.quote.bgMode === 'image'
                            ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        🖼️ Foto Sinematik (Dari Galeri)
                      </button>
                    </div>
                  </div>

                  {/* Jika Memilih Foto Sinematik */}
                  {content.quote.bgMode === 'image' && (
                    <ImageUploadField
                      label="Foto Latar Belakang Kutipan"
                      value={content.quote.bgImage || ''}
                      folder="quote"
                      onChange={(url) =>
                        setContent({
                          ...content,
                          quote: { ...content.quote, bgImage: url },
                        })
                      }
                      hint="Foto akan otomatis dilapisi kontras gelap sinematik agar teks putih terbaca sangat jelas dan megah."
                    />
                  )}
                </div>
              </>
            )}

            {/* 4. COUPLE FORM */}
            {activeTab === 'couple' && (
              <>
                {/* PILIHAN MODE TAMPILAN MEMPELAI */}
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80 space-y-2 mb-4">
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/70 block font-semibold">
                    Gaya Tampilan Profil Mempelai
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2">
                    Pilih foto latar belakang layar penuh (sinematik) atau potret bingkai lengkung dengan latar belakang putih bersih.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setContent({
                          ...content,
                          couple: { ...content.couple, bgMode: 'image' },
                        })
                      }
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        (content.couple.bgMode || 'image') === 'image'
                          ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      🖼️ Foto Latar Belakang (Sinematik)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setContent({
                          ...content,
                          couple: { ...content.couple, bgMode: 'solid' },
                        })
                      }
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        content.couple.bgMode === 'solid'
                          ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      ⚪ Latar Belakang Putih (Clean Editorial)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#0F1B2D]/10">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Judul Section
                    </label>
                    <input
                      type="text"
                      value={content.couple.sectionTitle}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: { ...content.couple, sectionTitle: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Deskripsi Pengantar
                    </label>
                    <input
                      type="text"
                      value={content.couple.sectionDesc}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: { ...content.couple, sectionDesc: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                    />
                  </div>
                </div>

                {/* Groom Fields */}
                <div className="p-4 rounded border border-[#0F1B2D]/15 bg-[#F9FAFB] space-y-4">
                  <h4 className="font-serif text-base font-semibold text-[#0F1B2D]">
                    Mempelai Pria (Groom)
                  </h4>
                  <ImageUploadField
                    label="Foto Profil Mempelai Pria"
                    value={content.couple.groom.photoSrc}
                    folder="couple"
                    onChange={(url) =>
                      setContent({
                        ...content,
                        couple: {
                          ...content.couple,
                          groom: { ...content.couple.groom, photoSrc: url },
                        },
                      })
                    }
                  />
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={content.couple.groom.name}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            groom: { ...content.couple.groom, name: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Keterangan Keluarga (Putra Dari)
                    </label>
                    <input
                      type="text"
                      value={content.couple.groom.childOf}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            groom: { ...content.couple.groom, childOf: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Bio Singkat
                    </label>
                    <textarea
                      rows={2}
                      value={content.couple.groom.bio}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            groom: { ...content.couple.groom, bio: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Instagram Username
                    </label>
                    <input
                      type="text"
                      value={content.couple.groom.instagram}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            groom: { ...content.couple.groom, instagram: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>

                  {/* Groom Parents Details */}
                  <div className="pt-3 border-t border-[#0F1B2D]/10 space-y-3">
                    <span className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block font-semibold">
                      Detail Orang Tua Mempelai Pria
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-[#0F1B2D]/60 block mb-1">
                          Nama Ayah
                        </label>
                        <input
                          type="text"
                          value={content.couple.groom.fatherName || ''}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              couple: {
                                ...content.couple,
                                groom: { ...content.couple.groom, fatherName: e.target.value },
                              },
                            })
                          }
                          placeholder="I Wayan Suweta"
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-[#0F1B2D]/60 block mb-1">
                          Nama Ibu
                        </label>
                        <input
                          type="text"
                          value={content.couple.groom.motherName || ''}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              couple: {
                                ...content.couple,
                                groom: { ...content.couple.groom, motherName: e.target.value },
                              },
                            })
                          }
                          placeholder="Ni Wayan Murni"
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-[#0F1B2D]/60 block mb-1">
                        Keterangan Silsilah / Urutan Anak
                      </label>
                      <input
                        type="text"
                        value={content.couple.groom.parentsTitle || ''}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            couple: {
                              ...content.couple,
                              groom: { ...content.couple.groom, parentsTitle: e.target.value },
                            },
                          })
                        }
                        placeholder="Putra Pertama Dari Pasangan:"
                        className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                      />
                    </div>

                    <ImageUploadField
                      label="Foto / Avatar Kecil Orang Tua Pria (Opsional)"
                      value={content.couple.groom.parentsAvatarSrc || ''}
                      folder="couple"
                      onChange={(url) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            groom: { ...content.couple.groom, parentsAvatarSrc: url },
                          },
                        })
                      }
                      hint="Foto avatar kecil orang tua di bawah profil mempelai pria."
                    />
                  </div>
                </div>

                {/* Bride Fields */}
                <div className="p-4 rounded border border-[#0F1B2D]/15 bg-[#F9FAFB] space-y-4">
                  <h4 className="font-serif text-base font-semibold text-[#0F1B2D]">
                    Mempelai Wanita (Bride)
                  </h4>
                  <ImageUploadField
                    label="Foto Profil Mempelai Wanita"
                    value={content.couple.bride.photoSrc}
                    folder="couple"
                    onChange={(url) =>
                      setContent({
                        ...content,
                        couple: {
                          ...content.couple,
                          bride: { ...content.couple.bride, photoSrc: url },
                        },
                      })
                    }
                  />
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={content.couple.bride.name}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            bride: { ...content.couple.bride, name: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Keterangan Keluarga (Putri Dari)
                    </label>
                    <input
                      type="text"
                      value={content.couple.bride.childOf}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            bride: { ...content.couple.bride, childOf: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Bio Singkat
                    </label>
                    <textarea
                      rows={2}
                      value={content.couple.bride.bio}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            bride: { ...content.couple.bride, bio: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Instagram Username
                    </label>
                    <input
                      type="text"
                      value={content.couple.bride.instagram}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            bride: { ...content.couple.bride, instagram: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    />
                  </div>

                  {/* Bride Parents Details */}
                  <div className="pt-3 border-t border-[#0F1B2D]/10 space-y-3">
                    <span className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block font-semibold">
                      Detail Orang Tua Mempelai Wanita
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-[#0F1B2D]/60 block mb-1">
                          Nama Ayah
                        </label>
                        <input
                          type="text"
                          value={content.couple.bride.fatherName || ''}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              couple: {
                                ...content.couple,
                                bride: { ...content.couple.bride, fatherName: e.target.value },
                              },
                            })
                          }
                          placeholder="Widoyo"
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-[#0F1B2D]/60 block mb-1">
                          Nama Ibu
                        </label>
                        <input
                          type="text"
                          value={content.couple.bride.motherName || ''}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              couple: {
                                ...content.couple,
                                bride: { ...content.couple.bride, motherName: e.target.value },
                              },
                            })
                          }
                          placeholder="Sri Mulyani"
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-[#0F1B2D]/60 block mb-1">
                        Keterangan Silsilah / Urutan Anak
                      </label>
                      <input
                        type="text"
                        value={content.couple.bride.parentsTitle || ''}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            couple: {
                              ...content.couple,
                              bride: { ...content.couple.bride, parentsTitle: e.target.value },
                            },
                          })
                        }
                        placeholder="Putri Tercinta Dari Pasangan:"
                        className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                      />
                    </div>

                    <ImageUploadField
                      label="Foto / Avatar Kecil Orang Tua Wanita (Opsional)"
                      value={content.couple.bride.parentsAvatarSrc || ''}
                      folder="couple"
                      onChange={(url) =>
                        setContent({
                          ...content,
                          couple: {
                            ...content.couple,
                            bride: { ...content.couple.bride, parentsAvatarSrc: url },
                          },
                        })
                      }
                      hint="Foto avatar kecil orang tua di bawah profil mempelai wanita."
                    />
                  </div>
                </div>
              </>
            )}

            {/* 5. STORY FORM */}
            {activeTab === 'story' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Judul Section Story
                  </label>
                  <input
                    type="text"
                    value={content.story.sectionTitle}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        story: { ...content.story, sectionTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-[#0F1B2D]/70 font-mono">
                      Daftar Momen ({content.story.moments.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = String(content.story.moments.length + 1).padStart(2, '0');
                        setContent({
                          ...content,
                          story: {
                            ...content.story,
                            moments: [
                              ...content.story.moments,
                              {
                                numeral: nextNum,
                                title: 'Momen Baru',
                                date: '2026',
                                desc: 'Tuliskan deskripsi momen cerita di sini...',
                                photoSrc: '',
                                photoAlt: 'Momen Baru',
                                label: `MOMEN ${nextNum}`,
                              },
                            ],
                          },
                        });
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-[#0F1B2D] text-white"
                    >
                      + Tambah Momen
                    </button>
                  </div>

                  {content.story.moments.map((m, idx) => (
                    <div key={idx} className="p-4 rounded border border-[#0F1B2D]/15 bg-[#F9FAFB] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#0F1B2D]">
                          Momen #{m.numeral}
                        </span>
                        {content.story.moments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = content.story.moments.filter((_, i) => i !== idx);
                              setContent({
                                ...content,
                                story: { ...content.story, moments: updated },
                              });
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <ImageUploadField
                        label={`Foto Momen ${m.numeral}`}
                        value={m.photoSrc}
                        folder="stories"
                        onChange={(url) => {
                          const updated = [...content.story.moments];
                          updated[idx].photoSrc = url;
                          setContent({
                            ...content,
                            story: { ...content.story, moments: updated },
                          });
                        }}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                            Judul Momen
                          </label>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => {
                              const updated = [...content.story.moments];
                              updated[idx].title = e.target.value;
                              setContent({
                                ...content,
                                story: { ...content.story, moments: updated },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                            Periode Waktu
                          </label>
                          <input
                            type="text"
                            value={m.date}
                            onChange={(e) => {
                              const updated = [...content.story.moments];
                              updated[idx].date = e.target.value;
                              setContent({
                                ...content,
                                story: { ...content.story, moments: updated },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                          Narasi Cerita
                        </label>
                        <textarea
                          rows={2}
                          value={m.desc}
                          onChange={(e) => {
                            const updated = [...content.story.moments];
                            updated[idx].desc = e.target.value;
                            setContent({
                              ...content,
                              story: { ...content.story, moments: updated },
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

                       {/* 6. EVENT FORM */}
            {activeTab === 'event' && (
              <div className="space-y-5">

                {/* ─── PRIMARY: Tanggal & Waktu Resepsi (Calendar Picker) ─── */}
                <div className="p-4 rounded-lg bg-[#0F1B2D]/5 border border-[#0F1B2D]/15 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">📅</span>
                    <span className="text-xs font-mono uppercase font-bold text-[#0F1B2D]/80 tracking-widest">
                      Tanggal &amp; Waktu Resepsi
                    </span>
                  </div>
                  <p className="text-[11px] text-[#0F1B2D]/55 -mt-2 leading-relaxed">
                    Atur tanggal &amp; jam mulai resepsi. Semua tampilan tanggal dan <strong>penghitung mundur hari</strong> akan otomatis terperbarui.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                        Waktu Mulai Resepsi
                      </label>
                      <input
                        type="datetime-local"
                        value={content.event.startsAt
                          ? (() => {
                              const d = new Date(content.event.startsAt);
                              const pad = (n: number) => String(n).padStart(2, '0');
                              return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            })()
                          : ''}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const d = new Date(e.target.value);
                          const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
                          const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                          const MONTHS_ID_UP = MONTHS_ID.map(m => m.toUpperCase());
                          const dayName = DAYS_ID[d.getDay()];
                          const dateNum = String(d.getDate());
                          const monthYear = `${MONTHS_ID_UP[d.getMonth()]} ${d.getFullYear()}`;
                          const dateFullStr = `${dayName}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
                          const padH = (n: number) => String(n).padStart(2, '0');
                          // Derive endsAt from current duration or default +3h
                          const existingEnd = content.event.endsAt ? new Date(content.event.endsAt) : null;
                          const existingStart = content.event.startsAt ? new Date(content.event.startsAt) : null;
                          let durationMs = 3 * 60 * 60 * 1000; // default 3h
                          if (existingEnd && existingStart) {
                            durationMs = existingEnd.getTime() - existingStart.getTime();
                            if (durationMs <= 0) durationMs = 3 * 60 * 60 * 1000;
                          }
                          const newEnd = new Date(d.getTime() + durationMs);
                          const timeStr = `${padH(d.getHours())}.${padH(d.getMinutes())} – ${padH(newEnd.getHours())}.${padH(newEnd.getMinutes())} WITA`;
                          const heroDateStr = `${dayName.toUpperCase()}, ${dateNum} ${MONTHS_ID_UP[d.getMonth()]} ${d.getFullYear()}`;
                          setContent({
                            ...content,
                            event: {
                              ...content.event,
                              startsAt: d.toISOString(),
                              endsAt: newEnd.toISOString(),
                              dayFormatted: dayName.toUpperCase(),
                              dateNumeral: dateNum,
                              monthYearFormatted: monthYear,
                              dateFormatted: dateFullStr,
                              timeFormatted: timeStr,
                            },
                            hero: {
                              ...content.hero,
                              dateShort: heroDateStr,
                            },
                            cover: {
                              ...content.cover,
                              dateDisplay: dateFullStr,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                      />
                      <p className="text-[10px] text-[#0F1B2D]/45 mt-1 font-mono">
                        ISO: {content.event.startsAt || '—'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                        Waktu Selesai Resepsi
                      </label>
                      <input
                        type="datetime-local"
                        value={content.event.endsAt
                          ? (() => {
                              const d = new Date(content.event.endsAt);
                              const pad = (n: number) => String(n).padStart(2, '0');
                              return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            })()
                          : ''}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const dEnd = new Date(e.target.value);
                          const dStart = content.event.startsAt ? new Date(content.event.startsAt) : dEnd;
                          const padH = (n: number) => String(n).padStart(2, '0');
                          const timeStr = `${padH(dStart.getHours())}.${padH(dStart.getMinutes())} – ${padH(dEnd.getHours())}.${padH(dEnd.getMinutes())} WITA`;
                          setContent({
                            ...content,
                            event: {
                              ...content.event,
                              endsAt: dEnd.toISOString(),
                              timeFormatted: timeStr,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                      />
                      <p className="text-[10px] text-[#0F1B2D]/45 mt-1 font-mono">
                        ISO: {content.event.endsAt || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Live preview of generated display fields */}
                  {content.event.startsAt && (
                    <div className="space-y-3 pt-2 border-t border-[#0F1B2D]/10">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Hari', val: content.event.dayFormatted },
                          { label: 'Tanggal', val: content.event.dateNumeral },
                          { label: 'Bulan Tahun', val: content.event.monthYearFormatted },
                          { label: 'Jam', val: content.event.timeFormatted },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-white rounded p-2 border border-[#0F1B2D]/10">
                            <span className="text-[9px] font-mono uppercase text-[#0F1B2D]/50 block">{label}</span>
                            <span className="text-[11px] font-mono text-[#0F1B2D] font-medium">{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Live Countdown status preview */}
                      {(() => {
                        const target = new Date(content.event.startsAt).getTime();
                        const now = Date.now();
                        const diff = target - now;
                        const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                        const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
                        const minutes = Math.max(0, Math.floor((diff / 1000 / 60) % 60));
                        return (
                          <div className="p-3 rounded-lg bg-[#0F1B2D]/5 border border-[#0F1B2D]/15 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">⏳</span>
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1B2D]/60 block font-semibold">
                                  Pratinjau Hitung Mundur Hari (Landing Page)
                                </span>
                                <span className="text-xs font-serif font-bold text-[#0F1B2D]">
                                  {diff > 0
                                    ? `${days} Hari · ${hours} Jam · ${minutes} Menit menuju resepsi`
                                    : 'Waktu resepsi telah tiba / terlewati'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                              ✓ Otomatis Tersinkron
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* ─── Manual overrides (display text) ─── */}
                <details className="group">
                  <summary className="cursor-pointer text-xs font-mono uppercase text-[#0F1B2D]/60 hover:text-[#0F1B2D] select-none list-none flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Override Teks Tampilan (Opsional)
                  </summary>
                  <div className="mt-3 space-y-4 pl-4 border-l-2 border-[#0F1B2D]/10">
                    <p className="text-[10px] text-[#0F1B2D]/45">Ubah manual jika format tampilan perlu disesuaikan (misal pakai bahasa/dialek berbeda).</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">Nama Hari</label>
                        <input
                          type="text"
                          value={content.event.dayFormatted}
                          onChange={(e) =>
                            setContent({ ...content, event: { ...content.event, dayFormatted: e.target.value } })
                          }
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">Angka Tanggal Besar</label>
                        <input
                          type="text"
                          value={content.event.dateNumeral}
                          onChange={(e) =>
                            setContent({ ...content, event: { ...content.event, dateNumeral: e.target.value } })
                          }
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">Bulan &amp; Tahun</label>
                        <input
                          type="text"
                          value={content.event.monthYearFormatted}
                          onChange={(e) =>
                            setContent({ ...content, event: { ...content.event, monthYearFormatted: e.target.value } })
                          }
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">Rentang Jam Acara</label>
                        <input
                          type="text"
                          value={content.event.timeFormatted}
                          onChange={(e) =>
                            setContent({ ...content, event: { ...content.event, timeFormatted: e.target.value } })
                          }
                          className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                        />
                      </div>
                    </div>
                  </div>
                </details>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Nama Lokasi / Venue
                  </label>
                  <input
                    type="text"
                    value={content.event.venueName}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        event: { ...content.event, venueName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Alamat Lengkap Venue
                  </label>
                  <textarea
                    rows={2}
                    value={content.event.venueAddress}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        event: { ...content.event, venueAddress: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    URL Google Maps
                  </label>
                  <input
                    type="text"
                    value={content.event.mapsUrl}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        event: { ...content.event, mapsUrl: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 font-mono text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* 7. GALLERY FORM */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                {/* Header Information & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Label Bagian (Eyebrow)
                    </label>
                    <input
                      type="text"
                      value={content.gallery.sectionLabel || 'GALERI KENANGAN'}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          gallery: { ...content.gallery, sectionLabel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                      placeholder="GALERI KENANGAN"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Judul Bagian (Subheading)
                    </label>
                    <input
                      type="text"
                      value={content.gallery.sectionTitle || 'Momen Terindah'}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          gallery: { ...content.gallery, sectionTitle: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                      placeholder="Momen Terindah"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Deskripsi Galeri (Pop-up &amp; Beranda)
                  </label>
                  <input
                    type="text"
                    value={content.gallery.sectionDesc}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        gallery: { ...content.gallery, sectionDesc: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                    placeholder="Kumpulan potret & video perjalanan cinta kami..."
                  />
                </div>

                {/* Status & Metrics Bar */}
                <div className="p-4 rounded-lg bg-stone-50 border border-[#0F1B2D]/15 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded bg-[#0F1B2D] text-white font-medium">
                        Total Media: {content.gallery.items.length}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-white border border-[#0F1B2D]/20 text-[#0F1B2D]">
                        📷 {content.gallery.items.filter((i) => i.mediaType !== 'video').length} Foto
                      </span>
                      <span className="px-2.5 py-1 rounded bg-white border border-[#0F1B2D]/20 text-[#0F1B2D]">
                        🎬 {content.gallery.items.filter((i) => i.mediaType === 'video').length} Video
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded font-semibold ${
                          content.gallery.items.filter((i) => i.isPrimary !== false).length <= 8
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}
                      >
                        ★ Slot Beranda: {content.gallery.items.filter((i) => i.isPrimary !== false).length} / 8
                      </span>
                    </div>

                    {/* Add Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newId = Date.now();
                          const primaryCount = content.gallery.items.filter(
                            (i) => i.isPrimary !== false
                          ).length;
                          setContent({
                            ...content,
                            gallery: {
                              ...content.gallery,
                              items: [
                                ...content.gallery.items,
                                {
                                  id: newId,
                                  label: `Momen ${String(content.gallery.items.length + 1).padStart(2, '0')}`,
                                  type: 'portrait',
                                  title: 'Foto Baru',
                                  aspectRatio: '4/5',
                                  src: '',
                                  mediaType: 'photo',
                                  isPrimary: primaryCount < 8,
                                  category: 'Prewedding',
                                },
                              ],
                            },
                          });
                        }}
                        className="text-xs px-3 py-1.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1a2d4b] font-medium tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>+ Tambah Foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newId = Date.now();
                          const primaryCount = content.gallery.items.filter(
                            (i) => i.isPrimary !== false
                          ).length;
                          setContent({
                            ...content,
                            gallery: {
                              ...content.gallery,
                              items: [
                                ...content.gallery.items,
                                {
                                  id: newId,
                                  label: `Video ${String(content.gallery.items.length + 1).padStart(2, '0')}`,
                                  type: 'landscape',
                                  title: 'Video Kenangan',
                                  aspectRatio: '16/9',
                                  src: '',
                                  videoSrc: '',
                                  posterSrc: '',
                                  mediaType: 'video',
                                  isPrimary: primaryCount < 8,
                                  category: 'Video Kenangan',
                                },
                              ],
                            },
                          });
                        }}
                        className="text-xs px-3 py-1.5 rounded bg-emerald-800 text-white hover:bg-emerald-900 font-medium tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>+ Tambah Video</span>
                      </button>

                      <Link
                        href="/admin/gallery"
                        className="text-xs px-3 py-1.5 rounded bg-[#0F1B2D] text-white hover:bg-[#0F1B2D]/90 font-medium tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>🖼️ Buka Menu Galeri Terpusat</span>
                      </Link>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#0F1B2D]/60 leading-relaxed font-sans">
                    💡 <strong>Aturan Tampilan:</strong> Anda bebas menambahkan foto &amp; video tanpa batas (unlimited). 
                    Maksimal 8 item pertama bertanda <strong>&ldquo;Slot Utama Beranda&rdquo;</strong> akan ditampilkan 
                    pada scroll horizontal di halaman depan (video otomatis berputar autoplay tanpa suara). 
                    Seluruh koleksi foto &amp; video dapat dibuka oleh pengunjung melalui tombol pop-up <strong>&ldquo;Buka Galeri&rdquo;</strong>.
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {content.gallery.items.map((item, idx) => {
                    const isVideo = item.mediaType === 'video';
                    const isPrimary = item.isPrimary !== false;

                    const moveItem = (fromIdx: number, toIdx: number) => {
                      if (toIdx < 0 || toIdx >= content.gallery.items.length) return;
                      const updated = [...content.gallery.items];
                      const [moved] = updated.splice(fromIdx, 1);
                      updated.splice(toIdx, 0, moved);
                      setContent({
                        ...content,
                        gallery: { ...content.gallery, items: updated },
                      });
                    };

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border transition-all space-y-4 ${
                          isPrimary
                            ? 'border-[#0F1B2D]/25 bg-white shadow-xs'
                            : 'border-stone-200 bg-[#FBFBFB] opacity-90'
                        }`}
                      >
                        {/* Header bar of item */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#0F1B2D]/10">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#0F1B2D] text-white text-[11px] font-mono flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#0F1B2D]">
                              {item.title || `Media #${idx + 1}`}
                            </span>

                            {/* Type badge */}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                isVideo
                                  ? 'bg-rose-100 text-rose-800 font-semibold'
                                  : 'bg-blue-100 text-blue-800 font-semibold'
                              }`}
                            >
                              {isVideo ? '🎬 VIDEO' : '📷 FOTO'}
                            </span>

                            {/* Primary Slot Badge */}
                            {isPrimary ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                                <span>★</span>
                                <span>Beranda #{content.gallery.items.slice(0, idx + 1).filter(i => i.isPrimary !== false).length}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                                Galeri Penuh Saja
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reorder Up */}
                            <button
                              type="button"
                              onClick={() => moveItem(idx, idx - 1)}
                              disabled={idx === 0}
                              className="px-2 py-1 rounded border border-stone-300 bg-white text-xs disabled:opacity-30 hover:bg-stone-50 cursor-pointer"
                              title="Pindahkan ke atas"
                            >
                              ↑
                            </button>
                            {/* Reorder Down */}
                            <button
                              type="button"
                              onClick={() => moveItem(idx, idx + 1)}
                              disabled={idx === content.gallery.items.length - 1}
                              className="px-2 py-1 rounded border border-stone-300 bg-white text-xs disabled:opacity-30 hover:bg-stone-50 cursor-pointer"
                              title="Pindahkan ke bawah"
                            >
                              ↓
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus "${item.title || 'media ini'}" dari galeri?`)) {
                                  const updated = content.gallery.items.filter((_, i) => i !== idx);
                                  setContent({
                                    ...content,
                                    gallery: { ...content.gallery, items: updated },
                                  });
                                }
                              }}
                              className="px-2.5 py-1 rounded text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        {/* Primary Slot Toggle & Type Switcher */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded bg-stone-50/70 border border-stone-200">
                          {/* Primary Checkbox */}
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPrimary}
                              onChange={(e) => {
                                const updated = [...content.gallery.items];
                                updated[idx].isPrimary = e.target.checked;
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                              className="mt-0.5 w-4 h-4 rounded text-[#0F1B2D] focus:ring-[#0F1B2D]"
                            />
                            <div>
                              <span className="text-xs font-semibold text-[#0F1B2D] block">
                                Tampilkan di Beranda (Slot Utama)
                              </span>
                              <span className="text-[11px] text-[#0F1B2D]/60 block leading-tight">
                                Centang agar tampil di 8 slot scroll depan beranda.
                              </span>
                            </div>
                          </label>

                          {/* Media Type Toggle */}
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span className="text-xs font-mono text-[#0F1B2D]/70">Tipe Media:</span>
                            <div className="inline-flex rounded-md border border-stone-300 p-0.5 bg-white text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...content.gallery.items];
                                  updated[idx].mediaType = 'photo';
                                  setContent({
                                    ...content,
                                    gallery: { ...content.gallery, items: updated },
                                  });
                                }}
                                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                  !isVideo ? 'bg-[#0F1B2D] text-white font-medium' : 'text-stone-600'
                                }`}
                              >
                                📷 Foto
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...content.gallery.items];
                                  updated[idx].mediaType = 'video';
                                  setContent({
                                    ...content,
                                    gallery: { ...content.gallery, items: updated },
                                  });
                                }}
                                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                  isVideo ? 'bg-emerald-800 text-white font-medium' : 'text-stone-600'
                                }`}
                              >
                                🎬 Video
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Media Upload Fields */}
                        {isVideo ? (
                          <div className="space-y-4 p-3 rounded border border-emerald-900/15 bg-emerald-50/20">
                            {/* Video File Field */}
                            <ImageUploadField
                              label="File Video (WebM / MP4 / QuickTime)"
                              value={item.videoSrc || item.src || ''}
                              folder="gallery/videos"
                              mediaType="video"
                              accept="video/*"
                              hint="Unggah file video WebM, MP4, atau MOV (hingga 300MB). Tersimpan langsung ke Supabase Storage."
                              onChange={(url) => {
                                const updated = [...content.gallery.items];
                                updated[idx].videoSrc = url;
                                if (!updated[idx].src) {
                                  updated[idx].src = url;
                                }
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                            />

                            {/* Poster / Thumbnail Field */}
                            <ImageUploadField
                              label="Poster / Gambar Thumbnail Video (Opsional)"
                              value={item.posterSrc || ''}
                              folder="gallery/posters"
                              mediaType="image"
                              hint="Gambar sampul sebelum video dimuat."
                              onChange={(url) => {
                                const updated = [...content.gallery.items];
                                updated[idx].posterSrc = url;
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <ImageUploadField
                            label="File Foto Galeri (Format Bebas)"
                            value={item.src || ''}
                            folder="gallery"
                            mediaType="image"
                            aspectRatio={item.aspectRatio || '4/5'}
                            hint="Format foto bebas (AVIF, HEIC, JPG, PNG, WebP) otomatis dioptimasi ke WebP dan disimpan ke Supabase Storage."
                            onChange={(url) => {
                              const updated = [...content.gallery.items];
                              updated[idx].src = url;
                              setContent({
                                ...content,
                                gallery: { ...content.gallery, items: updated },
                              });
                            }}
                          />
                        )}

                        {/* Metadata Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                              Judul Momen
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...content.gallery.items];
                                updated[idx].title = e.target.value;
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                              placeholder="Judul momen..."
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                              Label / Subjudul
                            </label>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const updated = [...content.gallery.items];
                                updated[idx].label = e.target.value;
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white font-mono text-[11px]"
                              placeholder="01 / 08 atau Momen 01"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                              Kategori / Tag
                            </label>
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => {
                                const updated = [...content.gallery.items];
                                updated[idx].category = e.target.value;
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                              placeholder="Prewedding / Acara"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                              Aspek Rasio
                            </label>
                            <select
                              value={item.aspectRatio || (isVideo ? '16/9' : '4/5')}
                              onChange={(e) => {
                                const updated = [...content.gallery.items];
                                updated[idx].aspectRatio = e.target.value;
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                            >
                              <option value="4/5">4:5 (Portrait Estetik)</option>
                              <option value="3/4">3:4 (Portrait Standar)</option>
                              <option value="16/9">16:9 (Landscape Video)</option>
                              <option value="16/10">16:10 (Landscape Lebar)</option>
                              <option value="1/1">1:1 (Persegi)</option>
                              <option value="3/2">3:2 (Landscape Foto)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 8. GIFT FORM */}
            {activeTab === 'gift' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Pesan Tanda Kasih
                  </label>
                  <textarea
                    rows={3}
                    value={content.gift.sectionDesc}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        gift: { ...content.gift, sectionDesc: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 leading-relaxed"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-semibold text-[#0F1B2D]/70">
                      Daftar Rekening Bank ({content.gift.accounts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setContent({
                          ...content,
                          gift: {
                            ...content.gift,
                            accounts: [
                              ...content.gift.accounts,
                              {
                                bank: 'BCA',
                                accountName: 'Nama Penerima',
                                accountNumber: '1234567890',
                              },
                            ],
                          },
                        });
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-[#0F1B2D] text-white"
                    >
                      + Tambah Rekening
                    </button>
                  </div>

                  {content.gift.accounts.map((acc, idx) => (
                    <div key={idx} className="p-4 rounded border border-[#0F1B2D]/15 bg-[#F9FAFB] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#0F1B2D]">
                          Rekening #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = content.gift.accounts.filter((_, i) => i !== idx);
                            setContent({
                              ...content,
                              gift: { ...content.gift, accounts: updated },
                            });
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                            Nama Bank / E-Wallet
                          </label>
                          <input
                            type="text"
                            value={acc.bank}
                            onChange={(e) => {
                              const updated = [...content.gift.accounts];
                              updated[idx].bank = e.target.value;
                              setContent({
                                ...content,
                                gift: { ...content.gift, accounts: updated },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                            Nomor Rekening
                          </label>
                          <input
                            type="text"
                            value={acc.accountNumber}
                            onChange={(e) => {
                              const updated = [...content.gift.accounts];
                              updated[idx].accountNumber = e.target.value;
                              setContent({
                                ...content,
                                gift: { ...content.gift, accounts: updated },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                            Atas Nama (Pemilik)
                          </label>
                          <input
                            type="text"
                            value={acc.accountName}
                            onChange={(e) => {
                              const updated = [...content.gift.accounts];
                              updated[idx].accountName = e.target.value;
                              setContent({
                                ...content,
                                gift: { ...content.gift, accounts: updated },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. FOOTER FORM */}
            {activeTab === 'footer' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Kalimat Doa Penutup (Closing Line)
                  </label>
                  <textarea
                    rows={3}
                    value={content.footer.closingLine}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, closingLine: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Teks Hak Cipta / Watermark
                  </label>
                  <input
                    type="text"
                    value={content.footer.copyright}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, copyright: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 font-mono text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* 10. AUDIO FORM */}
            {activeTab === 'audio' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Judul Musik Latar
                  </label>
                  <input
                    type="text"
                    value={content.audio.title}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        audio: { ...content.audio, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                  />
                </div>

                {/* Upload File Audio Langsung */}
                <ImageUploadField
                  label="Unggah File Lagu / Musik Latar"
                  value={content.audio.musicUrl}
                  folder="audio"
                  mediaType="audio"
                  accept="audio/*"
                  hint="Unggah file lagu latar langsung ke Supabase Storage (hingga 100MB). Mendukung MP3, WAV, M4A, AAC, OGG. Perubahan otomatis tersimpan ke URL di bawah."
                  onChange={(url) =>
                    setContent({
                      ...content,
                      audio: { ...content.audio, musicUrl: url },
                    })
                  }
                />

                {/* Manual URL override */}
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    URL File Audio MP3 (Manual / CDN)
                  </label>
                  <input
                    type="text"
                    value={content.audio.musicUrl}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        audio: { ...content.audio, musicUrl: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 font-mono text-[11px]"
                    placeholder="https://... (atau langsung upload file di atas)"
                  />
                  <p className="text-[10px] text-[#0F1B2D]/50 mt-1">
                    Format MP3 direct link. Hasil upload otomatis mengisi field ini.
                  </p>
                </div>

                {/* Preview */}
                {content.audio.musicUrl && (
                  <div className="p-3 rounded border border-[#0F1B2D]/15 bg-[#F9FAFB]">
                    <p className="text-[11px] font-mono text-[#0F1B2D]/60 mb-2">🎵 Preview Musik:</p>
                    <audio
                      key={content.audio.musicUrl}
                      controls
                      src={content.audio.musicUrl}
                      className="w-full h-8"
                      style={{ height: '36px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Save Bar */}
          <div className="pt-6 border-t border-[#0F1B2D]/10 flex items-center justify-between">
            <span className="text-[11px] text-[#0F1B2D]/50 font-mono">
              Perubahan langsung terlihat di Live Preview sebelah kanan.
            </span>
            <button
              type="button"
              onClick={handleSaveActiveSection}
              disabled={saving}
              className={`px-5 py-2.5 rounded text-xs font-medium tracking-wide shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 transition-all ${
                isSectionDirty
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 font-semibold'
                  : 'bg-[#0F1B2D] text-white hover:bg-[#1E293B]'
              }`}
            >
              {isSectionDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />}
              <span>{saving ? 'Menyimpan...' : isSectionDirty ? 'Simpan Perubahan ●' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Section Preview (5 Cols on LG - Sticky) */}
        <div
          className={`lg:col-span-5 sticky top-24 ${
            mobileMode === 'editor' ? 'hidden md:block' : 'block'
          }`}
        >
          <CmsSectionPreview section={activeTab} content={content} />
        </div>
      </div>

      {/* Floating Unsaved Changes Alert Bar */}
      {isSectionDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F1B2D] text-white px-5 py-3 rounded-full shadow-2xl border border-amber-400/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md max-w-lg w-[90%] sm:w-auto justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-mono font-medium text-amber-200 truncate">
              Ada perubahan di &ldquo;{TABS.find((t) => t.id === activeTab)?.label}&rdquo; belum disimpan!
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveActiveSection}
            disabled={saving}
            className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            {saving ? 'Menyimpan...' : 'Simpan Sekarang ↗'}
          </button>
        </div>
      )}

      {/* Hero Slideshow Photo Selection Modal */}
      <HeroSlideshowModal
        isOpen={isSlideshowModalOpen}
        onClose={() => setIsSlideshowModalOpen(false)}
        selectedUrls={content.hero.slideshowImages || []}
        onApply={(urls) => {
          setContent({
            ...content,
            hero: {
              ...content.hero,
              slideshowImages: urls,
            },
          });
        }}
      />
    </div>
  );
}
