'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content/types';
import { CmsSectionPreview } from './CmsSectionPreview';
import { ImageUploadField } from './ImageUploadField';

interface CmsContentEditorProps {
  initialContent: SiteContent;
}

const TABS: { id: keyof SiteContent; label: string; icon: string }[] = [
  { id: 'cover', label: 'Cover & Amplop', icon: '✉️' },
  { id: 'hero', label: 'Hero Utama', icon: '✨' },
  { id: 'quote', label: 'Kutipan Pembuka', icon: '📜' },
  { id: 'prayer', label: 'Doa Pernikahan', icon: '🤲' },
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Panggilan Pria
                    </label>
                    <input
                      type="text"
                      value={content.cover.groomName}
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
                      Nama Panggilan Wanita
                    </label>
                    <input
                      type="text"
                      value={content.cover.brideName}
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
                    Badge / Tagline Atas
                  </label>
                  <input
                    type="text"
                    value={content.cover.badge}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        cover: { ...content.cover, badge: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Format Tanggal Cover
                  </label>
                  <input
                    type="text"
                    value={content.cover.dateDisplay}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        cover: { ...content.cover, dateDisplay: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Label Tombol Buka
                    </label>
                    <input
                      type="text"
                      value={content.cover.openButtonLabel}
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
                      Teks Hint Ketuk Layar
                    </label>
                    <input
                      type="text"
                      value={content.cover.tapHintLabel}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          cover: { ...content.cover, tapHintLabel: e.target.value },
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Panggilan Pria di Hero
                    </label>
                    <input
                      type="text"
                      value={content.hero.groomName}
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
                    Eyebrow Badge Atas
                  </label>
                  <input
                    type="text"
                    value={content.hero.badge}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, badge: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Garis Puitis / Subtitle Tengah
                  </label>
                  <input
                    type="text"
                    value={content.hero.subtitle}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, subtitle: e.target.value },
                      })
                    }
                    placeholder="DUA GARIS · SATU BENANG PERJALANAN"
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                  <p className="text-[10px] text-[#0F1B2D]/50 mt-1">
                    Teks puitis di antara nama mempelai pria dan wanita di tengah layar Hero.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Format Tanggal Singkat
                    </label>
                    <input
                      type="text"
                      value={content.hero.dateShort}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, dateShort: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Teks Petunjuk Gulir Bawah
                    </label>
                    <input
                      type="text"
                      value={content.hero.scrollHint}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, scrollHint: e.target.value },
                        })
                      }
                      placeholder="GULIR PERLAHAN"
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Label Badge Pada Foto
                    </label>
                    <input
                      type="text"
                      value={content.hero.portraitLabel}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, portraitLabel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Deskripsi Alt Foto
                    </label>
                    <input
                      type="text"
                      value={content.hero.portraitAlt}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, portraitAlt: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 3. QUOTE FORM */}
            {activeTab === 'quote' && (
              <>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Label Sub-header
                  </label>
                  <input
                    type="text"
                    value={content.quote.label}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        quote: { ...content.quote, label: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Isi Kutipan / Ayat Suci
                  </label>
                  <textarea
                    rows={4}
                    value={content.quote.text}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        quote: { ...content.quote, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] leading-relaxed"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Sumber / Sitasi Kutipan
                  </label>
                  <input
                    type="text"
                    value={content.quote.citation}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        quote: { ...content.quote, citation: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </>
            )}

            {/* 3.5 PRAYER FORM (DOA PERNIKAHAN) */}
            {activeTab === 'prayer' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Label Eyebrow / Kategori
                    </label>
                    <input
                      type="text"
                      value={content.prayer?.sectionLabel || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          prayer: { ...content.prayer, sectionLabel: e.target.value },
                        })
                      }
                      placeholder="DOA & RESTU WIWAHA"
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Judul Section Doa
                    </label>
                    <input
                      type="text"
                      value={content.prayer?.title || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          prayer: { ...content.prayer, title: e.target.value },
                        })
                      }
                      placeholder="Asung Kertha Wara Nugraha"
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Teks Sloka / Doa Suci (Sanskerta / Bali / Latin)
                  </label>
                  <textarea
                    rows={3}
                    value={content.prayer?.arabicOrSanskrit || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        prayer: { ...content.prayer, arabicOrSanskrit: e.target.value },
                      })
                    }
                    placeholder="Om Ihaiva stam ma vi yaustam, visvam ayur vyasnutam, kridantau putrair naptrbhih modamanau sve grhe."
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] leading-relaxed font-serif"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Terjemahan / Makna Sloka
                  </label>
                  <textarea
                    rows={4}
                    value={content.prayer?.translation || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        prayer: { ...content.prayer, translation: e.target.value },
                      })
                    }
                    placeholder="Wahai pasangan pengantin, semoga engkau senantiasa tetap bersatu, tidak pernah terpisahkan, mencapai usia hidup yang panjang..."
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Kalimat Doa Restu & Harapan (Doa Bali Hindu)
                  </label>
                  <textarea
                    rows={3}
                    value={content.prayer?.blessingText || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        prayer: { ...content.prayer, blessingText: e.target.value },
                      })
                    }
                    placeholder="Om Swastyastu. Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, kami memohon doa restu..."
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Kitab Suci / Sumber Sloka
                  </label>
                  <input
                    type="text"
                    value={content.prayer?.citation || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        prayer: { ...content.prayer, citation: e.target.value },
                      })
                    }
                    placeholder="Rg Veda X.85.42"
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </>
            )}

            {/* 4. COUPLE FORM */}
            {activeTab === 'couple' && (
              <>
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
                              label="File Video (MP4 / WebM / QuickTime)"
                              value={item.videoSrc || item.src || ''}
                              folder="gallery/videos"
                              mediaType="video"
                              hint="Unggah file video (maks 50MB) yang tersimpan otomatis di Supabase Storage."
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
                            label="File Foto (JPG / PNG / WebP)"
                            value={item.src || ''}
                            folder="gallery"
                            mediaType="image"
                            aspectRatio={item.aspectRatio || '4/5'}
                            hint="Disimpan otomatis ke Supabase Storage pada folder 'gallery'."
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
                  label="Unggah File Musik (MP3)"
                  value={content.audio.musicUrl}
                  folder="audio"
                  mediaType="any"
                  accept="audio/mpeg,audio/mp3"
                  hint="Upload file MP3 langsung ke Supabase Storage. Maks 15MB. Perubahan otomatis tersimpan ke URL di bawah."
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
    </div>
  );
}
