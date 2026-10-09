'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BlastTemplatesConfig,
  DEFAULT_BLAST_CONFIG,
  DEFAULT_FORMAL_TEMPLATE,
  DEFAULT_WARM_TEMPLATE,
  DEFAULT_CASUAL_TEMPLATE,
} from '@/lib/blast/templates';
import { SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content/types';
import { normalizeWhatsAppPhone } from '@/lib/guests/whatsapp';

export interface GuestItem {
  id: string;
  name: string;
  nickname: string;
  salutation: string;
  phone: string;
  groupLabel: string;
  tone: 'formal' | 'warm' | 'casual';
  maxPax: number;
  arrivalAt: string | null;
  status: 'attending' | 'not_attending' | 'pending';
  pax: number;
  openCount: number;
  token: string;
  internalNote?: string;
  lastBlastedAt?: string | null;
  createdAt: string;
}

interface WhatsAppBlasterProps {
  siteContent?: SiteContent;
}

export function WhatsAppBlaster({ siteContent }: WhatsAppBlasterProps) {
  const content = siteContent || DEFAULT_SITE_CONTENT;
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get('batchId') || '';

  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Template config state (supports per-group & per-tone customization)
  const [blastConfig, setBlastConfig] = useState<BlastTemplatesConfig>(DEFAULT_BLAST_CONFIG);
  const [editingGroup, setEditingGroup] = useState<string>('__DEFAULT__');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterSalutation, setFilterSalutation] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNSENT' | 'SENT' | 'NO_PHONE'>('ALL');
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load saved templates from server on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/admin/blast/templates');
        const json = await res.json();
        if (json.ok && json.data) {
          setBlastConfig(json.data);
        }
      } catch (err) {
        console.warn('Gagal memuat template tersimpan dari server:', err);
      }
    }
    loadTemplates();
  }, []);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = batchIdParam
        ? `/api/admin/guests?batchId=${encodeURIComponent(batchIdParam)}`
        : '/api/admin/guests';
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal memuat daftar tamu');
      }
      const data: GuestItem[] = json.data || [];
      setGuests(data);
      setGroups(json.groups || []);
      if (data.length > 0) {
        setActiveGuestId(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala memuat data';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [batchIdParam]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // Resolve which template to use for a specific guest based on group & tone
  const resolveTemplateForGuest = useCallback(
    (guest: GuestItem): { template: string; label: string; tone: 'formal' | 'warm' | 'casual' | 'custom' } => {
      // 1. Specific custom template saved for this guest's group
      if (guest.groupLabel && blastConfig.groupTemplates[guest.groupLabel]?.trim()) {
        const tone = blastConfig.groupTones[guest.groupLabel] || guest.tone || 'custom';
        return {
          template: blastConfig.groupTemplates[guest.groupLabel],
          label: `Khusus Grup "${guest.groupLabel}"`,
          tone,
        };
      }

      // 2. Group tone preset override
      if (guest.groupLabel && blastConfig.groupTones[guest.groupLabel]) {
        const tone = blastConfig.groupTones[guest.groupLabel];
        return {
          template: blastConfig.toneTemplates[tone] || blastConfig.defaultTemplate,
          label: `Grup "${guest.groupLabel}" (${tone.toUpperCase()})`,
          tone,
        };
      }

      // 3. Guest individual tone ('formal' | 'warm' | 'casual')
      if (guest.tone && blastConfig.toneTemplates[guest.tone]) {
        return {
          template: blastConfig.toneTemplates[guest.tone],
          label: `Tone Tamu (${guest.tone.toUpperCase()})`,
          tone: guest.tone,
        };
      }

      // 4. Default global fallback
      return {
        template: blastConfig.defaultTemplate,
        label: 'Format Default',
        tone: 'warm',
      };
    },
    [blastConfig]
  );

  // Format message for a specific guest
  const formatMessageForGuest = useCallback(
    (guest: GuestItem): string => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${origin}/u/${guest.token}`;
      const jamHadir = guest.arrivalAt
        ? new Date(guest.arrivalAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Makassar',
          }) + ' WITA'
        : '11.00 WITA';

      const { template } = resolveTemplateForGuest(guest);

      const groomName = content.hero?.groomName || 'Dharma';
      const brideName = content.hero?.brideName || 'Lutfhy';
      const mempelai = `${groomName} & ${brideName}`;

      return template
        .replace(/{{nama}}/g, guest.name)
        .replace(/{{panggilan}}/g, guest.nickname || guest.name.split(' ')[0])
        .replace(/{{sapaan}}/g, guest.salutation || 'Bapak / Ibu')
        .replace(/{{link}}/g, link)
        .replace(/{{pax}}/g, String(guest.maxPax || 2))
        .replace(/{{jam_hadir}}/g, jamHadir)
        .replace(/{{mempelai}}/g, mempelai);
    },
    [resolveTemplateForGuest, content]
  );


  // Active guest
  const activeGuest = useMemo(() => {
    return guests.find((g) => g.id === activeGuestId) || guests[0] || null;
  }, [guests, activeGuestId]);

  // Unique salutations extracted dynamically
  const salutations = useMemo(() => {
    const list = guests
      .map((g) => (g.salutation || '').trim())
      .filter((s) => Boolean(s));
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [guests]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.phone.includes(search) ||
        g.groupLabel.toLowerCase().includes(search.toLowerCase());

      const matchGroup = filterGroup === 'ALL' || g.groupLabel === filterGroup;

      const matchSalutation =
        filterSalutation === 'ALL' || (g.salutation?.trim() || '') === filterSalutation;

      let matchStatus = true;
      if (filterStatus === 'UNSENT') {
        matchStatus = Boolean(g.phone) && !g.lastBlastedAt;
      } else if (filterStatus === 'SENT') {
        matchStatus = Boolean(g.lastBlastedAt);
      } else if (filterStatus === 'NO_PHONE') {
        matchStatus = !g.phone;
      }

      return matchSearch && matchGroup && matchSalutation && matchStatus;
    });
  }, [guests, search, filterGroup, filterSalutation, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = guests.length;
    const withPhone = guests.filter((g) => Boolean(g.phone)).length;
    const sent = guests.filter((g) => Boolean(g.lastBlastedAt)).length;
    const unsent = withPhone - sent;
    const noPhone = total - withPhone;
    return { total, withPhone, sent, unsent: Math.max(0, unsent), noPhone };
  }, [guests]);

  // Next unsent guest in queue
  const nextUnsentGuest = useMemo(() => {
    return guests.find((g) => Boolean(g.phone) && !g.lastBlastedAt) || null;
  }, [guests]);

  // Handle Send WA
  const handleSendWa = async (guest: GuestItem) => {
    if (!guest.phone) {
      showToast('Tamu ini tidak memiliki nomor WhatsApp', 'error');
      return;
    }

    const cleanPhone = normalizeWhatsAppPhone(guest.phone);
    const message = formatMessageForGuest(guest);
    const encoded = encodeURIComponent(message);

    // Open WhatsApp
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');

    // Persist status
    try {
      await fetch(`/api/admin/guests/${guest.id}/blast`, { method: 'POST' });
      const now = new Date().toISOString();
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, lastBlastedAt: now } : g))
      );
      showToast(`Undangan dikirim ke ${guest.name}!`);

      // Advance active selection to next unsent guest
      const remainingUnsent = guests.filter(
        (g) => g.id !== guest.id && Boolean(g.phone) && !g.lastBlastedAt
      );
      if (remainingUnsent.length > 0) {
        setActiveGuestId(remainingUnsent[0].id);
      }
    } catch {
      // Non-blocking
    }
  };

  const [editingPhoneGuestId, setEditingPhoneGuestId] = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const handleCopyMessage = (guest: GuestItem) => {
    const msg = formatMessageForGuest(guest);
    navigator.clipboard.writeText(msg);
    showToast('Teks pesan WhatsApp disalin ke clipboard!');
  };

  const handleCopyLink = (guest: GuestItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/u/${guest.token}`;
    navigator.clipboard.writeText(link);
    showToast(`🔗 Link undangan (/u/${guest.token.substring(0, 8)}...) berhasil disalin!`);
  };

  const handleSavePhone = async (guest: GuestItem) => {
    if (!editPhoneValue.trim()) return;
    setIsSavingPhone(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guest,
          phone: editPhoneValue.trim(),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Gagal menyimpan nomor HP');
      const updatedPhone = json.data?.phone || editPhoneValue.trim();
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, phone: updatedPhone } : g))
      );
      showToast(`Nomor HP untuk ${guest.name} berhasil disimpan!`);
      setEditingPhoneGuestId(null);
      setEditPhoneValue('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan nomor HP';
      showToast(msg, 'error');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const getCurrentEditingText = (): string => {
    if (editingGroup === '__DEFAULT__') {
      return blastConfig.defaultTemplate;
    }
    if (blastConfig.groupTemplates[editingGroup] !== undefined) {
      return blastConfig.groupTemplates[editingGroup];
    }
    if (blastConfig.groupTones[editingGroup]) {
      const tone = blastConfig.groupTones[editingGroup];
      return blastConfig.toneTemplates[tone] || blastConfig.defaultTemplate;
    }
    return blastConfig.defaultTemplate;
  };

  const handleUpdateEditingText = (newText: string) => {
    if (editingGroup === '__DEFAULT__') {
      setBlastConfig((prev) => ({ ...prev, defaultTemplate: newText }));
    } else {
      setBlastConfig((prev) => ({
        ...prev,
        groupTemplates: {
          ...prev.groupTemplates,
          [editingGroup]: newText,
        },
      }));
    }
  };

  const handleApplyTonePreset = (tone: 'formal' | 'warm' | 'casual') => {
    const presetText = blastConfig.toneTemplates[tone] || DEFAULT_BLAST_CONFIG.toneTemplates[tone];
    if (editingGroup === '__DEFAULT__') {
      setBlastConfig((prev) => ({
        ...prev,
        defaultTemplate: presetText,
      }));
    } else {
      setBlastConfig((prev) => ({
        ...prev,
        groupTemplates: {
          ...prev.groupTemplates,
          [editingGroup]: presetText,
        },
        groupTones: {
          ...prev.groupTones,
          [editingGroup]: tone,
        },
      }));
    }
    showToast(`Format "${tone.toUpperCase()}" berhasil diterapkan untuk ${editingGroup === '__DEFAULT__' ? 'Semua Grup' : 'Grup ' + editingGroup}!`);
  };

  const handleResetGroupToDefault = (groupName: string) => {
    setBlastConfig((prev) => {
      const nextGroupTemplates = { ...prev.groupTemplates };
      const nextGroupTones = { ...prev.groupTones };
      delete nextGroupTemplates[groupName];
      delete nextGroupTones[groupName];
      return {
        ...prev,
        groupTemplates: nextGroupTemplates,
        groupTones: nextGroupTones,
      };
    });
    showToast(`Grup "${groupName}" dikembalikan menggunakan format Default!`);
  };

  const handleSaveTemplatesToServer = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/blast/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blastConfig),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menyimpan template');
      }
      showToast('Seluruh format template berhasil disimpan secara permanen!');
      setShowTemplateEditor(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan template';
      showToast(msg, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const insertVariable = (variable: string) => {
    const current = getCurrentEditingText();
    handleUpdateEditingText(current + ` {{${variable}}}`);
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
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
            BROADCAST &amp; PENDISTRIBUSIAN
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
            WhatsApp Blasting Undangan
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
            Kirim undangan personal secara cepat dan terarah ke kontak WhatsApp tamu. Setiap grup dapat memiliki format pesan sendiri (misal Formal untuk VIP, Warm untuk Keluarga, Casual untuk Sahabat).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {batchIdParam && (
            <Link
              href="/admin/blast"
              className="px-3 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono"
            >
              ✕ Tampilkan Semua Tamu
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className={`px-3.5 py-2.5 rounded border text-xs font-medium shadow-2xs inline-flex items-center gap-2 transition-all cursor-pointer ${
              showTemplateEditor
                ? 'bg-[#0F1B2D] text-white border-[#0F1B2D]'
                : 'bg-white hover:bg-stone-50 border-[#0F1B2D]/15 text-[#0F1B2D]'
            }`}
          >
            <span>⚙️ {showTemplateEditor ? 'Tutup Pengaturan Template' : 'Atur Format Pesan Per Grup'}</span>
          </button>
        </div>
      </div>

      {/* Batch Filter Notification if filtered by batch */}
      {batchIdParam && (
        <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-sm)] p-3.5 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📥</span>
            <span>
              Menampilkan tamu dari Batch Import ID: <strong>{batchIdParam}</strong> ({guests.length} tamu)
            </span>
          </div>
          <Link
            href="/admin/blast"
            className="font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            Lihat Seluruh Database
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1B2D]/55">
            TOTAL TAMU
          </span>
          <div className="mt-2 font-serif text-2xl text-[#0F1B2D] font-light">{stats.total}</div>
          <div className="mt-1 text-[11px] text-[#0F1B2D]/50">Dalam daftar saat ini</div>
        </div>

        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800">
            SUDAH TERKIRIM
          </span>
          <div className="mt-2 font-serif text-2xl text-emerald-700 font-light">{stats.sent}</div>
          <div className="mt-1 text-[11px] text-emerald-700/60 font-mono">
            {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}% terkirim
          </div>
        </div>

        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800">
            BELUM TERKIRIM
          </span>
          <div className="mt-2 font-serif text-2xl text-amber-700 font-light">{stats.unsent}</div>
          <div className="mt-1 text-[11px] text-amber-700/60">Siap dikirim via WA</div>
        </div>

        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
            TANPA NOMOR HP
          </span>
          <div className="mt-2 font-serif text-2xl text-stone-600 font-light">{stats.noPhone}</div>
          <div className="mt-1 text-[11px] text-stone-400">Perlu salin link manual</div>
        </div>
      </div>

      {/* Advanced Per-Group Template Editor Drawer */}
      {showTemplateEditor && (
        <div className="bg-white border border-[#0F1B2D]/15 rounded-[var(--radius-sm)] p-6 shadow-md space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#0F1B2D]/10 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                  Pengaturan Format Pesan Berdasarkan Grup &amp; Tone
                </h3>
              </div>
              <p className="text-xs text-[#0F1B2D]/60 mt-1">
                Atur variasi bahasa pesan secara fleksibel. Misalnya grup <strong>VIP</strong> memakai format <em>Formal</em>, grup <strong>Keluarga</strong> memakai <em>Warm</em>, dan grup <strong>Teman</strong> memakai <em>Casual</em>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveTemplatesToServer}
                disabled={savingConfig}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>{savingConfig ? 'Menyimpan...' : '💾 Simpan Semua Format'}</span>
              </button>
            </div>
          </div>

          {/* Group Selector Pill Bar */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#0F1B2D]/60 block mb-2 font-semibold">
              Pilih Target Grup Yang Ingin Diatur:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingGroup('__DEFAULT__')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  editingGroup === '__DEFAULT__'
                    ? 'bg-[#0F1B2D] text-white shadow-xs font-semibold'
                    : 'bg-stone-100 hover:bg-stone-200 text-[#0F1B2D]/80'
                }`}
              >
                <span>🌐</span>
                <span>Default (Semua Grup Lainnya)</span>
              </button>

              {groups.map((grp) => {
                const isSelected = editingGroup === grp;
                const hasCustom = Boolean(blastConfig.groupTemplates[grp]?.trim());
                const tone = blastConfig.groupTones[grp];

                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setEditingGroup(grp)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs font-semibold'
                        : hasCustom
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-white hover:bg-stone-100 text-[#0F1B2D]/80 border-stone-200'
                    }`}
                  >
                    <span>🏷️</span>
                    <span>{grp}</span>
                    {hasCustom && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Kustom aktif" />
                    )}
                    {tone && (
                      <span className="text-[9px] uppercase opacity-75 font-mono">({tone})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Buttons Bar */}
          <div className="p-3 rounded-lg bg-stone-50 border border-[#0F1B2D]/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#0F1B2D]/70">Pilih Preset Cepat:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTonePreset('formal')}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-stone-100 border border-stone-300 text-indigo-900 shadow-2xs transition-colors cursor-pointer"
                  title="Gunakan bahasa sangat resmi, santun, dan terhormat"
                >
                  🌿 Formal (Resmi)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTonePreset('warm')}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-stone-100 border border-stone-300 text-amber-900 shadow-2xs transition-colors cursor-pointer"
                  title="Gunakan bahasa hangat, penuh rasa syukur, kekeluargaan"
                >
                  ☀️ Warm (Hangat)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTonePreset('casual')}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-stone-100 border border-stone-300 text-emerald-900 shadow-2xs transition-colors cursor-pointer"
                  title="Gunakan bahasa santai, akrab, dan asik"
                >
                  💬 Casual (Santai)
                </button>
              </div>
            </div>

            {editingGroup !== '__DEFAULT__' && blastConfig.groupTemplates[editingGroup] && (
              <button
                type="button"
                onClick={() => handleResetGroupToDefault(editingGroup)}
                className="text-xs text-red-600 hover:text-red-800 underline font-mono cursor-pointer"
              >
                ✕ Hapus Kustom (Ikuti Default)
              </button>
            )}
          </div>

          {/* Variable Insertion Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="text-[#0F1B2D]/50 font-sans text-xs mr-1">Sisipkan Variabel:</span>
            {['sapaan', 'panggilan', 'nama', 'link', 'jam_hadir', 'pax', 'mempelai'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[#0F1B2D] border border-stone-200 cursor-pointer transition-colors"
                title={`Sisipkan {{${v}}}`}
              >
                + {`{{${v}}}`}
              </button>
            ))}
          </div>

          {/* Textarea for Editing Active Template */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-mono text-[#0F1B2D]/70 font-medium">
                Teks Pesan untuk{' '}
                <strong>
                  {editingGroup === '__DEFAULT__' ? 'Default (Semua Grup)' : `Grup "${editingGroup}"`}
                </strong>
                :
              </span>
              <span className="font-mono text-[#0F1B2D]/50 text-[11px]">
                {getCurrentEditingText().length} karakter
              </span>
            </div>
            <textarea
              rows={11}
              value={getCurrentEditingText()}
              onChange={(e) => handleUpdateEditingText(e.target.value)}
              className="w-full p-4 rounded-lg font-mono text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] bg-[#FDFDFE] leading-relaxed shadow-inner"
            />
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#0F1B2D]/50 font-mono">
              💡 Format per grup langsung diterapkan saat tombol Kirim WA atau Salin Pesan diklik.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateEditor(false)}
                className="px-4 py-2 rounded text-stone-600 hover:text-stone-900 text-xs font-medium transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveTemplatesToServer}
                disabled={savingConfig}
                className="px-5 py-2 rounded bg-[#0F1B2D] hover:bg-[#1E293B] text-white text-xs font-medium shadow-xs disabled:opacity-50 cursor-pointer transition-all"
              >
                {savingConfig ? 'Menyimpan...' : '💾 Simpan & Terapkan'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Next Up Quick Action Queue Banner */}
      {nextUnsentGuest && (
        <div className="bg-[#0F1B2D] text-white rounded-[var(--radius-sm)] p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono tracking-[0.2em] text-[#25D366] uppercase font-semibold block">
              ANTREAN KIRIM BERIKUTNYA
            </span>
            <h4 className="font-serif text-lg font-medium">
              {nextUnsentGuest.salutation} {nextUnsentGuest.name}
            </h4>
            <div className="text-xs text-white/70 font-mono flex items-center gap-2">
              <span>{nextUnsentGuest.phone}</span>
              <span>•</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">
                {nextUnsentGuest.groupLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSendWa(nextUnsentGuest)}
              className="px-5 py-2.5 rounded bg-[#25D366] hover:bg-[#20ba5a] text-[#0F1B2D] font-bold text-xs tracking-wide shadow-lg inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>🚀 Kirim Sekarang (Buka WhatsApp)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Filter + Guest List & Live Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filter & List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-4 shadow-xs flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cari nama atau no. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] flex-1 min-w-[160px]"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua ({stats.total})</option>
              <option value="UNSENT">Belum Terkirim ({stats.unsent})</option>
              <option value="SENT">Sudah Terkirim ({stats.sent})</option>
              <option value="NO_PHONE">Tanpa Nomor ({stats.noPhone})</option>
            </select>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-2.5 py-1.5 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none bg-white"
            >
              <option value="ALL">Semua Grup ({groups.length})</option>
              {groups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>

            {/* Filter by Salutation (Sapaan) */}
            <select
              value={filterSalutation}
              onChange={(e) => setFilterSalutation(e.target.value)}
              className={`px-2.5 py-1.5 rounded text-xs border focus:outline-none bg-white font-medium ${
                filterSalutation !== 'ALL'
                  ? 'border-indigo-400 text-indigo-900 bg-indigo-50/40'
                  : 'border-[#0F1B2D]/20 text-[#0F1B2D]'
              }`}
            >
              <option value="ALL">Semua Sapaan ({guests.length})</option>
              {salutations.map((sal) => {
                const count = guests.filter((g) => (g.salutation?.trim() || '') === sal).length;
                return (
                  <option key={sal} value={sal}>
                    {sal} ({count})
                  </option>
                );
              })}
            </select>

            {(search || filterStatus !== 'ALL' || filterGroup !== 'ALL' || filterSalutation !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('ALL');
                  setFilterGroup('ALL');
                  setFilterSalutation('ALL');
                }}
                className="text-[11px] text-red-600 hover:text-red-800 underline font-mono cursor-pointer ml-auto"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Guest List */}
          <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] shadow-xs divide-y divide-[#0F1B2D]/5 max-h-[650px] overflow-y-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[#0F1B2D]/50 font-mono">
                <div className="w-7 h-7 border-2 border-[#0F1B2D]/20 border-t-[#0F1B2D] rounded-full animate-spin mx-auto mb-2" />
                Memuat daftar tamu...
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#0F1B2D]/50 px-4">
                Tidak ada tamu yang cocok dengan filter.
              </div>
            ) : (
              filteredGuests.map((guest, idx) => {
                const isActive = activeGuest?.id === guest.id;
                const isSent = Boolean(guest.lastBlastedAt);

                return (
                  <div
                    key={guest.id}
                    onClick={() => setActiveGuestId(guest.id)}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-amber-50/50 border-l-4 border-l-[#0F1B2D]'
                        : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#0F1B2D]/40 font-semibold min-w-[24px] text-left select-none">
                          #{idx + 1}
                        </span>
                        {guest.salutation && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-[#0F1B2D]/70 font-mono">
                            {guest.salutation}
                          </span>
                        )}
                        <span className="font-medium text-[#0F1B2D] text-xs">{guest.name}</span>
                        {isSent ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Terkirim
                          </span>
                        ) : guest.phone ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Siap Kirim
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-500">
                            Tanpa HP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#0F1B2D]/50 font-mono pl-8 sm:pl-0">
                        <span>{guest.phone || '—'}</span>
                        <span>•</span>
                        <span>{guest.groupLabel}</span>
                        {/* Format resolution badge */}
                        {(() => {
                          const res = resolveTemplateForGuest(guest);
                          return (
                            <>
                              <span>•</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9.5px] uppercase font-mono ${
                                  res.tone === 'formal'
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : res.tone === 'casual'
                                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                                title={res.label}
                              >
                                {res.tone}
                              </span>
                            </>
                          );
                        })()}
                        {guest.lastBlastedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700">
                              {new Date(guest.lastBlastedAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {guest.phone ? (
                        <button
                          type="button"
                          onClick={() => handleSendWa(guest)}
                          className="px-3 py-1.5 rounded bg-[#25D366] hover:bg-[#20ba5a] text-[#0F1B2D] font-semibold text-[11px] shadow-2xs inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>Kirim WA</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGuestId(guest.id);
                            setEditingPhoneGuestId(guest.id);
                            setEditPhoneValue('');
                          }}
                          className="px-2.5 py-1.5 rounded bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-medium transition-all cursor-pointer"
                        >
                          + No. HP
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest)}
                        title="Salin Tautan Personal Tamu Saja (/u/...)"
                        className="px-2.5 py-1.5 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>🔗 Link</span>
                      </button>

                      <a
                        href={`/u/${guest.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka Halaman Undangan Tamu di Tab Baru"
                        className="p-1.5 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono"
                      >
                        ↗
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(guest)}
                        title="Salin Format Teks Pesan WhatsApp Lengkap"
                        className="px-2 py-1.5 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono cursor-pointer"
                      >
                        Pesan
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* List Footer Summary */}
            {!loading && filteredGuests.length > 0 && (
              <div className="p-3 bg-stone-50/80 flex items-center justify-between text-[11px] text-[#0F1B2D]/60 font-mono">
                <span>
                  Menampilkan <strong>{filteredGuests.length}</strong> dari <strong>{guests.length}</strong> tamu
                </span>
                {filteredGuests.length !== guests.length && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-sans font-medium">
                    Filter Aktif
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Message Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          {activeGuest ? (
            <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-[#0F1B2D]/50 font-semibold block">
                    PRATINJAU PESAN WA
                  </span>
                  <h4 className="text-sm font-serif font-medium text-[#0F1B2D] mt-0.5">
                    {activeGuest.salutation} {activeGuest.name}
                  </h4>
                  {/* Active Template Source & Tone Badge */}
                  {(() => {
                    const res = resolveTemplateForGuest(activeGuest);
                    return (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-[#0F1B2D]/80 border border-stone-200">
                          Format: {res.label}
                        </span>
                        <span
                          className={`text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            res.tone === 'formal'
                              ? 'bg-indigo-100 text-indigo-800'
                              : res.tone === 'casual'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {res.tone}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                {activeGuest.lastBlastedAt ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Sudah Terkirim
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Siap Kirim
                  </span>
                )}
              </div>

              {/* Shareable Link Box (Direct URL testing) */}
              <div className="bg-stone-50 border border-[#0F1B2D]/10 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#0F1B2D]/70 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
                    <span>🔗</span>
                    <span>Tautan Personal Tamu:</span>
                  </span>
                  <a
                    href={`/u/${activeGuest.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1 text-[11px] underline underline-offset-2"
                  >
                    <span>Tes Buka Undangan ↗</span>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/u/${activeGuest.token}`}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-[#0F1B2D]/15 rounded text-[#0F1B2D] select-all cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeGuest)}
                    className="px-3 py-1.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium shrink-0 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                  >
                    <span>Salin Link Saja</span>
                  </button>
                </div>
              </div>

              {/* Missing Phone Prompt if applicable */}
              {!activeGuest.phone && (
                <div className="bg-amber-50/70 border border-amber-200 rounded p-3 text-xs space-y-2">
                  <div className="text-amber-900 font-medium flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Tamu ini belum memiliki nomor WhatsApp:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={editingPhoneGuestId === activeGuest.id ? editPhoneValue : ''}
                      onChange={(e) => {
                        setEditingPhoneGuestId(activeGuest.id);
                        setEditPhoneValue(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePhone(activeGuest);
                      }}
                      className="px-3 py-1.5 text-xs border border-amber-300 rounded font-mono bg-white flex-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isSavingPhone}
                      onClick={() => handleSavePhone(activeGuest)}
                      className="px-3 py-1.5 bg-[#0F1B2D] text-white hover:bg-[#1E293B] rounded text-xs font-medium cursor-pointer disabled:opacity-50"
                    >
                      {isSavingPhone ? '...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Bubble UI */}
              <div className="bg-[#EFEAE2] p-4 rounded-xl shadow-inner border border-black/5 min-h-[300px] flex flex-col justify-between">
                <div className="bg-white rounded-lg rounded-tl-none p-3.5 shadow-xs max-w-sm text-xs text-[#111B21] leading-relaxed whitespace-pre-wrap font-sans relative">
                  {formatMessageForGuest(activeGuest)}
                  <div className="text-[10px] text-black/40 text-right mt-1 font-mono">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#0F1B2D]/70">
                    No. HP: <strong>{activeGuest.phone || '(Belum diisi)'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeGuest)}
                      title="Salin Tautan Saja"
                      className="px-2.5 py-1.5 rounded bg-white hover:bg-stone-50 border border-black/10 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔗 Salin Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(activeGuest)}
                      title="Salin Teks Lengkap Pesan WhatsApp"
                      className="px-2.5 py-1.5 rounded bg-white hover:bg-stone-50 border border-black/10 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>📋 Salin Pesan WA</span>
                    </button>
                    {activeGuest.phone && (
                      <button
                        type="button"
                        onClick={() => handleSendWa(activeGuest)}
                        className="px-3 py-1.5 rounded bg-[#25D366] text-[#0F1B2D] font-bold text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Buka WA 🚀</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-12 text-center text-xs text-[#0F1B2D]/50">
              Pilih salah satu tamu untuk melihat simulasi pesan WhatsApp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
