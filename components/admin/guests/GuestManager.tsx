'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export function GuestManager() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterSalutation, setFilterSalutation] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPhone, setFilterPhone] = useState<'ALL' | 'NO_PHONE' | 'HAS_PHONE'>('ALL');

  const [inlineEditPhoneId, setInlineEditPhoneId] = useState<string | null>(null);
  const [inlinePhoneInput, setInlinePhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extract unique salutations from guests
  const salutations = React.useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      const sal = g.salutation?.trim();
      if (sal) set.add(sal);
    });
    return Array.from(set).sort();
  }, [guests]);

  // Add form state
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    salutation: 'Bapak / Ibu',
    phone: '',
    groupLabel: 'Keluarga & Kerabat',
    tone: 'warm' as 'formal' | 'warm' | 'casual',
    maxPax: 2,
    internalNote: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/guests');
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal mengambil data tamu');
      }
      setGuests(json.data || []);
      setGroups(json.groups || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/u/${token}`;
    navigator.clipboard.writeText(link);
    showToast('Tautan undangan berhasil disalin!');
  };

  const handleOpenWhatsApp = async (guest: GuestItem) => {
    if (!guest.phone) {
      showToast('Tamu ini belum memiliki nomor WhatsApp!', 'error');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/u/${guest.token}`;
    const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
    const greeting = `${guest.salutation ? guest.salutation + ' ' : ''}${guest.nickname || guest.name}`;
    const message = `Halo ${greeting}, dengan sukacita dan penuh syukur kami mengundang Anda ke pernikahan Dharma & Lutfhy.\n\nDetail acara, denah lokasi, dan konfirmasi kehadiran dapat diakses melalui tautan personal Anda:\n${link}\n\nSalam hangat,\nDharma & Lutfhy`;
    const text = encodeURIComponent(message);

    // Record blast status in backend
    try {
      await fetch(`/api/admin/guests/${guest.id}/blast`, { method: 'POST' });
      // Update local state
      const now = new Date().toISOString();
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, lastBlastedAt: now } : g))
      );
    } catch {
      // Non-blocking
    }

    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menambahkan tamu');
      }

      showToast(`Tamu "${form.name}" berhasil ditambahkan!`);
      setShowAddModal(false);
      setForm({
        name: '',
        nickname: '',
        salutation: 'Bapak / Ibu',
        phone: '',
        groupLabel: 'Keluarga & Kerabat',
        tone: 'warm',
        maxPax: 2,
        internalNote: '',
      });
      fetchGuests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan tamu';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest || !editingGuest.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/guests/${editingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGuest),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal memperbarui data tamu');
      }

      showToast(`Data tamu "${editingGuest.name}" berhasil diperbarui!`);
      setEditingGuest(null);
      fetchGuests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui tamu';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartInlineEditPhone = (guest: GuestItem) => {
    setInlineEditPhoneId(guest.id);
    setInlinePhoneInput(guest.phone || '');
  };

  const handleSaveInlinePhone = async (guest: GuestItem) => {
    setIsSavingPhone(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guest,
          phone: inlinePhoneInput.trim(),
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menyimpan nomor HP');
      }

      const updatedPhone = json.data?.phone || inlinePhoneInput.trim();
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, phone: updatedPhone } : g))
      );
      showToast(`Nomor HP untuk "${guest.name}" berhasil disimpan!`);
      setInlineEditPhoneId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan nomor HP';
      showToast(msg, 'error');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Hapus tamu "${name}" secara permanen? Data RSVP tamu ini juga akan dihapus.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/guests/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menghapus tamu');
      }

      showToast(`Tamu "${name}" telah dihapus.`);
      setGuests((prev) => prev.filter((g) => g.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tamu';
      showToast(msg, 'error');
    }
  };

  const noPhoneCount = guests.filter((g) => !g.phone).length;
  const withPhoneCount = guests.length - noPhoneCount;

  const filteredGuests = guests.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) ||
      g.groupLabel.toLowerCase().includes(search.toLowerCase()) ||
      g.token.toLowerCase().includes(search.toLowerCase());

    const matchGroup = filterGroup === 'ALL' || g.groupLabel === filterGroup;
    const matchSalutation =
      filterSalutation === 'ALL' || (g.salutation?.trim() || '') === filterSalutation;
    const matchStatus = filterStatus === 'ALL' || g.status === filterStatus;

    let matchPhone = true;
    if (filterPhone === 'NO_PHONE') {
      matchPhone = !g.phone;
    } else if (filterPhone === 'HAS_PHONE') {
      matchPhone = Boolean(g.phone);
    }

    return matchSearch && matchGroup && matchSalutation && matchStatus && matchPhone;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-medium tracking-wide flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMsg.type === 'success'
              ? 'bg-[#0F1B2D] text-white border border-white/20'
              : 'bg-red-600 text-white'
          }`}
        >
          <span>{toastMsg.type === 'success' ? '✓' : '✕'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] p-4 text-xs text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchGuests}
            className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-medium"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Cari nama, no HP, atau grup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] w-full sm:w-64"
          />

          {/* Filter by Group */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none bg-white font-medium"
          >
            <option value="ALL">Semua Grup ({guests.length})</option>
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
            className={`px-3 py-2 rounded text-xs border focus:outline-none bg-white font-medium ${
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

          {/* Filter by RSVP Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none bg-white"
          >
            <option value="ALL">Semua Status RSVP</option>
            <option value="attending">Hadir</option>
            <option value="not_attending">Berhalangan</option>
            <option value="pending">Belum Konfirmasi</option>
          </select>

          {/* Filter by Contact Phone */}
          <select
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value as any)}
            className={`px-3 py-2 rounded text-xs border focus:outline-none bg-white font-medium ${
              filterPhone === 'NO_PHONE'
                ? 'border-amber-400 text-amber-900 bg-amber-50/50'
                : 'border-[#0F1B2D]/20 text-[#0F1B2D]'
            }`}
          >
            <option value="ALL">Semua Kontak ({guests.length})</option>
            <option value="NO_PHONE">⚠️ Belum Ada No. HP ({noPhoneCount})</option>
            <option value="HAS_PHONE">✓ Ada No. HP ({withPhoneCount})</option>
          </select>

          {(search ||
            filterGroup !== 'ALL' ||
            filterSalutation !== 'ALL' ||
            filterStatus !== 'ALL' ||
            filterPhone !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterGroup('ALL');
                setFilterSalutation('ALL');
                setFilterStatus('ALL');
                setFilterPhone('ALL');
              }}
              className="text-[11px] text-[#0F1B2D]/60 hover:text-[#0F1B2D] underline underline-offset-2 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/blast"
            className="px-3.5 py-2.5 rounded bg-[#25D366] text-white hover:bg-[#20ba5a] text-xs font-medium tracking-wide shadow-xs inline-flex items-center gap-1.5"
          >
            <span>🚀 WA Blasting</span>
          </Link>
          <Link
            href="/admin/import"
            className="px-3.5 py-2.5 rounded bg-white border border-[#0F1B2D]/20 text-[#0F1B2D] hover:bg-stone-50 text-xs font-medium tracking-wide shadow-2xs inline-flex items-center gap-1.5"
          >
            <span>📥 Import CSV</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide shadow-xs cursor-pointer"
          >
            + Tambah Tamu
          </button>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#0F1B2D]/50 font-mono">
            <div className="w-8 h-8 border-2 border-[#0F1B2D]/20 border-t-[#0F1B2D] rounded-full animate-spin mx-auto mb-3" />
            Memuat data tamu dari Supabase...
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#0F1B2D]/5 text-[#0F1B2D]/60 flex items-center justify-center text-xl mx-auto mb-3">
              👥
            </div>
            {guests.length === 0 ? (
              <div className="space-y-1">
                <h4 className="font-serif text-base font-medium text-[#0F1B2D]">
                  Belum Ada Data Tamu Undangan
                </h4>
                <p className="text-xs text-[#0F1B2D]/60 max-w-sm mx-auto">
                  Database masih kosong. Anda dapat menambahkan tamu satu per satu atau mengunggah file CSV secara massal.
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium"
                  >
                    + Tambah Tamu Pertama
                  </button>
                  <Link
                    href="/admin/import"
                    className="px-4 py-2 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/20 text-[#0F1B2D] text-xs font-medium"
                  >
                    Unggah Berkas CSV
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="font-serif text-base font-medium text-[#0F1B2D]">
                  Tidak Ada Tamu yang Sesuai Filter
                </h4>
                <p className="text-xs text-[#0F1B2D]/60">
                  Coba ubah kata kunci pencarian atau sesuaikan pilihan grup dan status.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0F1B2D]/10 bg-[#F9FAFB] text-[#0F1B2D]/60 font-mono text-[10px] uppercase">
                  <th className="py-3 px-3 font-normal text-center w-12">No.</th>
                  <th className="py-3 px-4 font-normal">Nama & Sapaan</th>
                  <th className="py-3 px-4 font-normal">No. WhatsApp</th>
                  <th className="py-3 px-4 font-normal">Grup</th>
                  <th className="py-3 px-4 font-normal">Maks. Pax</th>
                  <th className="py-3 px-4 font-normal">Status RSVP</th>
                  <th className="py-3 px-4 font-normal">Dibuka</th>
                  <th className="py-3 px-4 font-normal text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B2D]/5">
                {filteredGuests.map((guest, idx) => (
                  <tr key={guest.id} className="hover:bg-[#F9FAFB]/80 transition-colors">
                    {/* Numbering */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-[#0F1B2D]/40 select-none">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0F1B2D] text-[13px]">{guest.name}</div>
                      <div className="text-[11px] text-[#0F1B2D]/50 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">
                          {guest.salutation}
                        </span>
                        <span>•</span>
                        <span className="italic">panggilan: {guest.nickname}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inlineEditPhoneId === guest.id ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="tel"
                            autoFocus
                            placeholder="081234567890"
                            value={inlinePhoneInput}
                            onChange={(e) => setInlinePhoneInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlinePhone(guest);
                              if (e.key === 'Escape') setInlineEditPhoneId(null);
                            }}
                            className="w-36 px-2 py-1 text-xs border border-[#0F1B2D] rounded font-mono bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={isSavingPhone}
                            onClick={() => handleSaveInlinePhone(guest)}
                            className="px-2.5 py-1 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-[10px] font-medium"
                          >
                            {isSavingPhone ? '...' : 'Simpan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditPhoneId(null)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : guest.phone ? (
                        <div className="space-y-0.5 group flex items-start justify-between gap-2">
                          <div className="font-mono text-[#0F1B2D]/80">
                            <div>{guest.phone}</div>
                            {guest.lastBlastedAt ? (
                              <span className="inline-block text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                ✓ Terkirim WA
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-mono text-stone-500 bg-stone-50 border border-stone-200 px-1.5 py-0.2 rounded">
                                Belum dikirim
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartInlineEditPhone(guest)}
                            title="Edit Nomor HP"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-400 hover:text-[#0F1B2D] text-[11px]"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            ⚠️ Belum ada No. HP
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleStartInlineEditPhone(guest)}
                              className="text-[11px] text-[#0F1B2D] hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>+ Isi No. HP</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Group */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 text-[#0F1B2D]/70 border border-stone-200">
                        {guest.groupLabel}
                      </span>
                    </td>

                    {/* Pax */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[#0F1B2D]/80">
                      {guest.maxPax} Pax
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {guest.status === 'attending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hadir ({guest.pax} Pax)
                        </span>
                      )}
                      {guest.status === 'not_attending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                          Berhalangan
                        </span>
                      )}
                      {guest.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Open count */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[#0F1B2D]/70">
                      {guest.openCount > 0 ? (
                        <span className="text-emerald-700 font-medium">{guest.openCount}x</span>
                      ) : (
                        <span className="text-stone-400">0x</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(guest.token)}
                          title="Salin Link Undangan"
                          className="px-2.5 py-1 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono transition-colors"
                        >
                          Salin Link
                        </button>

                        <a
                          href={`/u/${guest.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Halaman Tamu di Tab Baru"
                          className="px-2 py-1 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono transition-colors"
                        >
                          ↗ Buka
                        </a>

                        {guest.phone ? (
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(guest)}
                            title="Buka Chat WhatsApp"
                            className="px-2.5 py-1 rounded bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 text-[11px] font-medium transition-colors"
                          >
                            Kirim WA
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartInlineEditPhone(guest)}
                            title="Isi Nomor WhatsApp Tamu"
                            className="px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-medium transition-colors"
                          >
                            + No. HP
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingGuest(guest)}
                          title="Edit Lengkap Tamu"
                          className="px-2.5 py-1 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] transition-colors font-medium"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteGuest(guest.id, guest.name)}
                          title="Hapus Tamu"
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#0F1B2D]/10 text-[11px] text-[#0F1B2D]/60 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Menampilkan <strong>{filteredGuests.length}</strong> dari <strong>{guests.length}</strong> total tamu undangan
              </span>
              {filteredGuests.length < guests.length && (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 self-start sm:self-auto text-[10.5px]">
                  🔍 Filter aktif ({guests.length - filteredGuests.length} tamu tersembunyi)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-sm)] shadow-2xl border border-[#0F1B2D]/10 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
              <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                Tambah Tamu Undangan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#0F1B2D]/40 hover:text-[#0F1B2D]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                  Nama Lengkap Tamu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bapak I Wayan Dharma & Keluarga"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">Sapaan</label>
                  <input
                    type="text"
                    placeholder="Bapak / Ibu / Bli / Kak"
                    value={form.salutation}
                    onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dharma"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+628123456789 atau 0812..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Grup / Kategori
                  </label>
                  <input
                    type="text"
                    placeholder="Keluarga, Kantor, Sahabat..."
                    value={form.groupLabel}
                    onChange={(e) => setForm({ ...form, groupLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Maksimal Tamu (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.maxPax}
                    onChange={(e) => setForm({ ...form, maxPax: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">Nada Sapaan</label>
                  <select
                    value={form.tone}
                    onChange={(e) =>
                      setForm({ ...form, tone: e.target.value as 'formal' | 'warm' | 'casual' })
                    }
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none bg-white"
                  >
                    <option value="warm">Warm (Hangat & Sopan)</option>
                    <option value="formal">Formal (Resmi / Tetua)</option>
                    <option value="casual">Casual (Teman Sebaya)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                  Catatan Internal (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan khusus admin..."
                  value={form.internalNote}
                  onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#0F1B2D]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] font-medium disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Tamu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-sm)] shadow-2xl border border-[#0F1B2D]/10 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
              <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                Edit Tamu: {editingGuest.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="text-[#0F1B2D]/40 hover:text-[#0F1B2D]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateGuest} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                  Nama Lengkap Tamu *
                </label>
                <input
                  type="text"
                  required
                  value={editingGuest.name}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">Sapaan</label>
                  <input
                    type="text"
                    value={editingGuest.salutation}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, salutation: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={editingGuest.nickname}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, nickname: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingGuest.phone}
                    onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Grup / Kategori
                  </label>
                  <input
                    type="text"
                    value={editingGuest.groupLabel}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, groupLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">
                    Maksimal Tamu (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingGuest.maxPax}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        maxPax: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="block text-[#0F1B2D]/70 font-medium mb-1">Nada Sapaan</label>
                  <select
                    value={editingGuest.tone}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        tone: e.target.value as 'formal' | 'warm' | 'casual',
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-[#0F1B2D]/20 focus:outline-none bg-white"
                  >
                    <option value="warm">Warm (Hangat & Sopan)</option>
                    <option value="formal">Formal (Resmi / Tetua)</option>
                    <option value="casual">Casual (Teman Sebaya)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#0F1B2D]/10">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 rounded border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] font-medium disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Perbarui Tamu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
