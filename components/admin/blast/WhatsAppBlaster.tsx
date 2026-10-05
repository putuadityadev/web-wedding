'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

const DEFAULT_WA_TEMPLATE = `Halo {{sapaan}} {{panggilan}},

Dengan penuh rasa syukur dan bahagia, kami mengundang Anda untuk hadir pada momen pernikahan kami:

💍 Dharma & Lutfhy
🗓️ Sabtu, 12 Desember 2026
📍 Kediaman Mempelai Pria (Kayubihi, Bangli)
⏰ Waktu Kehadiran: {{jam_hadir}}

Detail acara, denah lokasi, dan konfirmasi kehadiran (RSVP) dapat diakses melalui tautan personal Anda berikut:
👉 {{link}}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Salam hangat,
Dharma & Lutfhy`;

export function WhatsAppBlaster() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get('batchId') || '';

  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Template state
  const [template, setTemplate] = useState<string>(DEFAULT_WA_TEMPLATE);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNSENT' | 'SENT' | 'NO_PHONE'>('ALL');
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

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

      return template
        .replace(/{{nama}}/g, guest.name)
        .replace(/{{panggilan}}/g, guest.nickname || guest.name.split(' ')[0])
        .replace(/{{sapaan}}/g, guest.salutation || 'Bapak / Ibu')
        .replace(/{{link}}/g, link)
        .replace(/{{pax}}/g, String(guest.maxPax || 2))
        .replace(/{{jam_hadir}}/g, jamHadir)
        .replace(/{{mempelai}}/g, 'Dharma & Lutfhy');
    },
    [template]
  );

  // Active guest
  const activeGuest = useMemo(() => {
    return guests.find((g) => g.id === activeGuestId) || guests[0] || null;
  }, [guests, activeGuestId]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.phone.includes(search) ||
        g.groupLabel.toLowerCase().includes(search.toLowerCase());

      const matchGroup = filterGroup === 'ALL' || g.groupLabel === filterGroup;

      let matchStatus = true;
      if (filterStatus === 'UNSENT') {
        matchStatus = Boolean(g.phone) && !g.lastBlastedAt;
      } else if (filterStatus === 'SENT') {
        matchStatus = Boolean(g.lastBlastedAt);
      } else if (filterStatus === 'NO_PHONE') {
        matchStatus = !g.phone;
      }

      return matchSearch && matchGroup && matchStatus;
    });
  }, [guests, search, filterGroup, filterStatus]);

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

    const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
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

  const handleCopyMessage = (guest: GuestItem) => {
    const msg = formatMessageForGuest(guest);
    navigator.clipboard.writeText(msg);
    showToast('Teks pesan WhatsApp disalin ke clipboard!');
  };

  const handleCopyLink = (guest: GuestItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/u/${guest.token}`;
    navigator.clipboard.writeText(link);
    showToast('Link undangan disalin ke clipboard!');
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + ` {{${variable}}}`);
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
            BROADCAST & PENDISTRIBUSIAN
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
            WhatsApp Blasting Undangan
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
            Kirim undangan personal secara cepat dan terarah ke kontak WhatsApp tamu. Setiap pesan otomatis menyertakan sapaan dan tautan unik personal tamu.
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
            className="px-3.5 py-2.5 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium shadow-2xs inline-flex items-center gap-1.5"
          >
            <span>✍️ {showTemplateEditor ? 'Tutup Template' : 'Ubah Format Pesan'}</span>
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

      {/* Template Editor Drawer (Collapsible) */}
      {showTemplateEditor && (
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
            <div>
              <h3 className="font-serif text-base font-medium text-[#0F1B2D]">
                Format Template Pesan WhatsApp
              </h3>
              <p className="text-xs text-[#0F1B2D]/50 mt-0.5">
                Sesuaikan kata-kata undangan. Variabel dalam kurung kurawal ganda akan otomatis digantikan sesuai profil masing-masing tamu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTemplate(DEFAULT_WA_TEMPLATE)}
              className="text-[11px] text-[#0F1B2D]/60 hover:text-[#0F1B2D] underline font-mono"
            >
              Reset ke Default
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="text-[#0F1B2D]/50 font-sans text-xs mr-1">Sisipkan:</span>
            {['sapaan', 'panggilan', 'nama', 'link', 'jam_hadir', 'pax', 'mempelai'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[#0F1B2D] border border-stone-200"
              >
                + {`{{${v}}}`}
              </button>
            ))}
          </div>

          <textarea
            rows={10}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full p-4 rounded font-mono text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] bg-[#FDFDFE] leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowTemplateEditor(false)}
              className="px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium shadow-xs"
            >
              Simpan & Terapkan
            </button>
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
              <option value="ALL">Semua Grup</option>
              {groups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
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
              filteredGuests.map((guest) => {
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

                      <div className="flex items-center gap-3 text-[11px] text-[#0F1B2D]/50 font-mono">
                        <span>{guest.phone || '—'}</span>
                        <span>•</span>
                        <span>{guest.groupLabel}</span>
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

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {guest.phone && (
                        <button
                          type="button"
                          onClick={() => handleSendWa(guest)}
                          className="px-3 py-1.5 rounded bg-[#25D366] hover:bg-[#20ba5a] text-[#0F1B2D] font-semibold text-[11px] shadow-2xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <span>Kirim WA</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest)}
                        title="Salin Tautan"
                        className="px-2.5 py-1.5 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono"
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(guest)}
                        title="Salin Pesan"
                        className="px-2.5 py-1.5 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Message Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          {activeGuest ? (
            <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#0F1B2D]/50 font-semibold">
                  PRATINJAU PESAN WA
                </span>
                <span className="text-xs font-serif font-medium text-[#0F1B2D]">
                  {activeGuest.name}
                </span>
              </div>

              {/* Chat Bubble UI */}
              <div className="bg-[#EFEAE2] p-4 rounded-xl shadow-inner border border-black/5 min-h-[350px] flex flex-col justify-between">
                <div className="bg-white rounded-lg rounded-tl-none p-3.5 shadow-xs max-w-sm text-xs text-[#111B21] leading-relaxed whitespace-pre-wrap font-sans relative">
                  {formatMessageForGuest(activeGuest)}
                  <div className="text-[10px] text-black/40 text-right mt-1 font-mono">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#0F1B2D]/60">
                    No. HP: <strong>{activeGuest.phone || '(Belum ada)'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(activeGuest)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-stone-50 border border-black/10 text-[11px] font-medium"
                    >
                      Salin Pesan
                    </button>
                    {activeGuest.phone && (
                      <button
                        type="button"
                        onClick={() => handleSendWa(activeGuest)}
                        className="px-3 py-1 rounded bg-[#25D366] text-[#0F1B2D] font-bold text-[11px] shadow-xs"
                      >
                        Buka WA 🚀
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
