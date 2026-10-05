'use client';

import React, { useState } from 'react';
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
  { id: 'couple', label: 'Profil Mempelai', icon: '💍' },
  { id: 'story', label: 'Kisah Perjalanan', icon: '📖' },
  { id: 'event', label: 'Waktu & Lokasi', icon: '📍' },
  { id: 'gallery', label: 'Galeri Foto', icon: '🖼️' },
  { id: 'gift', label: 'Tanda Kasih (Bank)', icon: '🎁' },
  { id: 'footer', label: 'Penutup (Footer)', icon: '🌿' },
  { id: 'audio', label: 'Musik Latar', icon: '🎵' },
];

export function CmsContentEditor({ initialContent }: CmsContentEditorProps) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [activeTab, setActiveTab] = useState<keyof SiteContent>('cover');
  const [mobileMode, setMobileMode] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

      const result = await res.json();
      if (!result.ok) {
        throw new Error(result.error || 'Gagal menyimpan perubahan');
      }

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
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMode('editor');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0F1B2D] text-white shadow-xs font-semibold'
                    : 'text-[#0F1B2D]/70 hover:bg-[#0F1B2D]/5 hover:text-[#0F1B2D]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
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
                className="px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                <ImageUploadField
                  label="Foto Potret Utama (Hero Portrait)"
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
                      Eyebrow Badge
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
                      Tanggal Singkat
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
                </div>

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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Nama Hari
                    </label>
                    <input
                      type="text"
                      value={content.event.dayFormatted}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          event: { ...content.event, dayFormatted: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Angka Tanggal (Besar)
                    </label>
                    <input
                      type="text"
                      value={content.event.dateNumeral}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          event: { ...content.event, dateNumeral: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Bulan & Tahun
                    </label>
                    <input
                      type="text"
                      value={content.event.monthYearFormatted}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          event: { ...content.event, monthYearFormatted: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                      Rentang Jam Acara
                    </label>
                    <input
                      type="text"
                      value={content.event.timeFormatted}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          event: { ...content.event, timeFormatted: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                    />
                  </div>
                </div>

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
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Deskripsi Galeri
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
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-semibold text-[#0F1B2D]/70">
                      Foto Galeri ({content.gallery.items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = Date.now();
                        setContent({
                          ...content,
                          gallery: {
                            ...content.gallery,
                            items: [
                              ...content.gallery.items,
                              {
                                id: newId,
                                label: `${String(content.gallery.items.length + 1).padStart(2, '0')}`,
                                type: 'portrait',
                                title: 'Foto Baru',
                                aspectRatio: '4/5',
                                src: '',
                              },
                            ],
                          },
                        });
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-[#0F1B2D] text-white"
                    >
                      + Tambah Foto
                    </button>
                  </div>

                  <div className="space-y-4">
                    {content.gallery.items.map((item, idx) => (
                      <div key={item.id} className="p-4 rounded border border-[#0F1B2D]/15 bg-[#F9FAFB] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#0F1B2D]">
                            Foto #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = content.gallery.items.filter((_, i) => i !== idx);
                              setContent({
                                ...content,
                                gallery: { ...content.gallery, items: updated },
                              });
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>

                        <ImageUploadField
                          label="File Foto"
                          value={item.src}
                          folder="gallery"
                          onChange={(url) => {
                            const updated = [...content.gallery.items];
                            updated[idx].src = url;
                            setContent({
                              ...content,
                              gallery: { ...content.gallery, items: updated },
                            });
                          }}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                              Judul Foto
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
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                              Orientasi
                            </label>
                            <select
                              value={item.type}
                              onChange={(e) => {
                                const updated = [...content.gallery.items];
                                updated[idx].type = e.target.value as 'portrait' | 'landscape';
                                setContent({
                                  ...content,
                                  gallery: { ...content.gallery, items: updated },
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 bg-white"
                            >
                              <option value="portrait">Portrait (Vertikal)</option>
                              <option value="landscape">Landscape (Horizontal)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className="space-y-4">
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
                <div>
                  <label className="text-xs font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    URL File Audio MP3
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
                  />
                  <p className="text-[10px] text-[#0F1B2D]/50 mt-1">
                    Format file MP3 direct link (dari Supabase Storage atau CDN audio).
                  </p>
                </div>
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
              className="px-5 py-2.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
    </div>
  );
}
