'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content/types';
import { formatWhatsAppMessage, buildWhatsAppUrl } from '@/lib/guests/whatsapp';

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

interface GuestManagerProps {
  siteContent?: SiteContent;
}

export function GuestManager({ siteContent }: GuestManagerProps) {
  const content = siteContent || DEFAULT_SITE_CONTENT;
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

  // Bulk selection & deletion state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [guestToDelete, setGuestToDelete] = useState<GuestItem | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique salutations from guests
  const salutations = React.useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      const sal = g.salutation?.trim();
      if (sal) set.add(sal);
    });
    return Array.from(set).sort();
  }, [guests]);

  // Group statistics for selection & bulk actions
  const groupStats = React.useMemo(() => {
    const map = new Map<string, { total: number; selected: number }>();
    groups.forEach((grp) => {
      if (grp) map.set(grp, { total: 0, selected: 0 });
    });
    guests.forEach((g) => {
      const grp = g.groupLabel?.trim() || 'Tanpa Grup';
      const entry = map.get(grp) || { total: 0, selected: 0 };
      entry.total += 1;
      if (selectedIds.includes(g.id)) {
        entry.selected += 1;
      }
      map.set(grp, entry);
    });
    return Array.from(map.entries())
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        selected: stat.selected,
      }))
      .sort((a, b) => b.total - a.total);
  }, [guests, groups, selectedIds]);

  const selectedGroupSummary = React.useMemo(() => {
    if (selectedIds.length === 0) return '';
    const selectedGuests = guests.filter((g) => selectedIds.includes(g.id));
    const counts: Record<string, number> = {};
    selectedGuests.forEach((g) => {
      const grp = g.groupLabel?.trim() || 'Tanpa Grup';
      counts[grp] = (counts[grp] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([grp, count]) => `${grp} (${count})`)
      .join(', ');
  }, [guests, selectedIds]);

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

  const handleCopyWhatsAppMessage = (guest: GuestItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const message = formatWhatsAppMessage(guest, content, origin);
    navigator.clipboard.writeText(message);
    showToast(`Pesan undangan WhatsApp untuk "${guest.name}" berhasil disalin!`);
  };

  const handleOpenWhatsApp = async (guest: GuestItem) => {
    if (!guest.phone) {
      showToast('Tamu ini belum memiliki nomor WhatsApp!', 'error');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const message = formatWhatsAppMessage(guest, content, origin);
    const waUrl = buildWhatsAppUrl(guest.phone, message);

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

    // Open WhatsApp directly via api.whatsapp.com to prevent emoji corruption
    window.open(waUrl, '_blank');
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

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredGuests.map((g) => g.id);
    if (visibleIds.length === 0) return;
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleGroupSelection = (groupName: string) => {
    const groupGuestIds = guests
      .filter((g) => (g.groupLabel?.trim() || 'Tanpa Grup') === groupName.trim())
      .map((g) => g.id);
    if (groupGuestIds.length === 0) return;

    const allSelected = groupGuestIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !groupGuestIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...groupGuestIds])));
    }
  };

  const handleSelectAllGroups = (select: boolean) => {
    if (select) {
      setSelectedIds(guests.map((g) => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteEntireGroup = (groupName: string) => {
    const groupGuestIds = guests
      .filter((g) => (g.groupLabel?.trim() || 'Tanpa Grup') === groupName.trim())
      .map((g) => g.id);
    if (groupGuestIds.length === 0) {
      showToast(`Tidak ada tamu dalam grup "${groupName}"`, 'error');
      return;
    }
    setSelectedIds(groupGuestIds);
    setShowGroupSelectModal(false);
    setShowBulkDeleteModal(true);
  };

  const handleCopySelectedLinks = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const selectedGuests = guests.filter((g) => selectedIds.includes(g.id));
    if (selectedGuests.length === 0) return;
    const text = selectedGuests
      .map((g) => `${g.name} (${g.groupLabel || 'Tamu'}): ${origin}/u/${g.token}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast(`${selectedGuests.length} tautan undangan berhasil disalin!`);
  };

  const handleDeleteGuest = (guest: GuestItem) => {
    setGuestToDelete(guest);
  };

  const handleConfirmSingleDelete = async () => {
    if (!guestToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/guests/${guestToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menghapus tamu');
      }

      showToast(`Tamu "${guestToDelete.name}" berhasil dihapus.`);
      setGuests((prev) => prev.filter((g) => g.id !== guestToDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== guestToDelete.id));
      setGuestToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tamu';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const countToDelete = selectedIds.length;
      const res = await fetch('/api/admin/guests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menghapus tamu massal');
      }

      showToast(`Berhasil menghapus ${countToDelete} tamu undangan.`);
      const deletedSet = new Set(selectedIds);
      setGuests((prev) => prev.filter((g) => !deletedSet.has(g.id)));
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tamu massal';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
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
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowGroupSelectModal(true)}
            className={`px-3.5 py-2.5 rounded text-xs font-medium tracking-wide shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              selectedIds.length > 0
                ? 'bg-amber-100/90 border border-amber-300 text-amber-950 font-semibold'
                : 'bg-white border border-[#0F1B2D]/20 text-[#0F1B2D] hover:bg-stone-50'
            }`}
          >
            <span>🏷️ Pilih per Grup</span>
            {selectedIds.length > 0 && (
              <span className="bg-[#0F1B2D] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {selectedIds.length}
              </span>
            )}
          </button>
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

      {/* Active Group Filter Action Helper */}
      {filterGroup !== 'ALL' && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-[var(--radius-sm)] p-3.5 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-medium">
              Grup: {filterGroup}
            </span>
            <span>
              Menampilkan <strong>{filteredGuests.length}</strong> tamu dalam grup ini.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleGroupSelection(filterGroup)}
              className="px-2.5 py-1.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-medium text-[11px] transition-colors cursor-pointer"
            >
              {filteredGuests.length > 0 && filteredGuests.every((g) => selectedIds.includes(g.id))
                ? '✕ Batalkan Pilihan Grup Ini'
                : `☑ Pilih Semua di Grup Ini (${filteredGuests.length})`}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteEntireGroup(filterGroup)}
              className="px-2.5 py-1.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>🗑️ Hapus Semua di Grup Ini</span>
            </button>
          </div>
        </div>
      )}

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
                  <th className="py-3 px-3 font-normal text-center w-10">
                    <input
                      type="checkbox"
                      aria-label="Pilih semua tamu yang tampil"
                      checked={filteredGuests.length > 0 && filteredGuests.every((g) => selectedIds.includes(g.id))}
                      ref={(el) => {
                        if (el) {
                          const hasSome = filteredGuests.some((g) => selectedIds.includes(g.id));
                          const hasAll = filteredGuests.length > 0 && filteredGuests.every((g) => selectedIds.includes(g.id));
                          el.indeterminate = hasSome && !hasAll;
                        }
                      }}
                      onChange={handleToggleSelectAllVisible}
                      className="w-4 h-4 rounded border-[#0F1B2D]/30 text-[#0F1B2D] focus:ring-0 cursor-pointer accent-[#0F1B2D]"
                    />
                  </th>
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
                {filteredGuests.map((guest, idx) => {
                  const isRowSelected = selectedIds.includes(guest.id);
                  return (
                  <tr
                    key={guest.id}
                    className={`transition-colors ${
                      isRowSelected
                        ? 'bg-amber-50/50 hover:bg-amber-100/50'
                        : 'hover:bg-[#F9FAFB]/80'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${guest.name}`}
                        checked={isRowSelected}
                        onChange={() => handleToggleSelect(guest.id)}
                        className="w-4 h-4 rounded border-[#0F1B2D]/30 text-[#0F1B2D] focus:ring-0 cursor-pointer accent-[#0F1B2D]"
                      />
                    </td>

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

                        <button
                          type="button"
                          onClick={() => handleCopyWhatsAppMessage(guest)}
                          title="Salin Draf Pesan Undangan WhatsApp Lengkap"
                          className="px-2.5 py-1 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[#0F1B2D] text-[11px] font-mono transition-colors"
                        >
                          Salin Pesan
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
                          onClick={() => handleDeleteGuest(guest)}
                          title="Hapus Tamu"
                          className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#0F1B2D]/10 text-[11px] text-[#0F1B2D]/60 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Menampilkan <strong>{filteredGuests.length}</strong> dari <strong>{guests.length}</strong> total tamu undangan
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-[#0F1B2D] font-semibold bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                    ✓ {selectedIds.length} tamu terpilih
                  </span>
                )}
              </div>
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

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[calc(100%-2rem)] bg-[#0F1B2D] text-white rounded-xl shadow-2xl border border-white/10 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="bg-amber-400 text-stone-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono">
              {selectedIds.length}
            </span>
            <div className="text-xs">
              <span className="font-medium">tamu dipilih</span>
              {selectedGroupSummary && (
                <span className="text-stone-300 text-[11px] block sm:inline sm:ml-2 opacity-80 truncate max-w-xs">
                  ({selectedGroupSummary})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
            >
              Batalkan
            </button>

            <button
              type="button"
              onClick={handleCopySelectedLinks}
              title="Salin semua link tamu yang dipilih"
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>📋 Salin Link</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Hapus Terpilih ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Select by Group Modal */}
      {showGroupSelectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-sm)] shadow-2xl border border-[#0F1B2D]/10 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                  Pilih Tamu Berdasarkan Grup
                </h3>
                <p className="text-xs text-[#0F1B2D]/60 mt-0.5">
                  Centang grup untuk memilih semua anggota grup tersebut secara cepat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupSelectModal(false)}
                className="text-[#0F1B2D]/40 hover:text-[#0F1B2D] p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="pt-3 pb-2">
              <input
                type="text"
                placeholder="Cari grup..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#0F1B2D]/5 my-2 border border-stone-200/80 rounded">
              {groupStats.filter((grp) => grp.name.toLowerCase().includes(groupSearchQuery.toLowerCase())).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#0F1B2D]/50">
                  Tidak ada grup yang cocok dengan pencarian.
                </div>
              ) : (
                groupStats
                  .filter((grp) => grp.name.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                  .map((grp) => {
                    const isAllGroupSelected = grp.total > 0 && grp.selected === grp.total;
                    const isSomeGroupSelected = grp.selected > 0 && grp.selected < grp.total;
                    return (
                      <div
                        key={grp.name}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          isAllGroupSelected
                            ? 'bg-amber-50/50'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllGroupSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeGroupSelected;
                            }}
                            onChange={() => handleToggleGroupSelection(grp.name)}
                            className="w-4 h-4 rounded border-[#0F1B2D]/30 text-[#0F1B2D] focus:ring-0 cursor-pointer accent-[#0F1B2D]"
                          />
                          <div>
                            <div className="font-medium text-xs text-[#0F1B2D]">{grp.name}</div>
                            <div className="text-[10px] text-[#0F1B2D]/50 font-mono mt-0.5">
                              {grp.total} total tamu • {grp.selected} terpilih
                            </div>
                          </div>
                        </label>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleGroupSelection(grp.name)}
                            className="px-2 py-1 rounded border border-[#0F1B2D]/15 hover:bg-[#0F1B2D]/5 text-[10.5px] font-medium text-[#0F1B2D] cursor-pointer"
                          >
                            {isAllGroupSelected ? 'Batal' : 'Pilih Semua'}
                          </button>
                          {grp.total > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEntireGroup(grp.name)}
                              title={`Hapus semua ${grp.total} tamu di grup ${grp.name}`}
                              className="px-2 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[10.5px] font-medium text-rose-700 cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>🗑️ Hapus Grup</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#0F1B2D]/10 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllGroups(true)}
                  className="text-[11px] text-[#0F1B2D] hover:underline font-medium cursor-pointer"
                >
                  Pilih Semua Grup
                </button>
                <span className="text-[#0F1B2D]/30">•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllGroups(false)}
                  className="text-[11px] text-[#0F1B2D]/60 hover:text-[#0F1B2D] cursor-pointer"
                >
                  Bersihkan Pilihan
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowGroupSelectModal(false)}
                className="px-4 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] font-medium text-xs cursor-pointer self-end sm:self-auto"
              >
                Selesai ({selectedIds.length} Tamu Terpilih)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Single Delete Modal */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-sm)] shadow-2xl border border-[#0F1B2D]/10 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                  Hapus Tamu Undangan?
                </h3>
                <p className="text-xs text-[#0F1B2D]/70 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data tamu ini secara permanen?
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-stone-50 rounded border border-stone-200/80 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#0F1B2D]/60">Nama Tamu:</span>
                <span className="font-medium text-[#0F1B2D]">{guestToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#0F1B2D]/60">Grup:</span>
                <span className="font-mono bg-stone-200/60 px-1.5 py-0.5 rounded text-[11px] text-[#0F1B2D]">
                  {guestToDelete.groupLabel || 'Tanpa Grup'}
                </span>
              </div>
              {guestToDelete.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-[#0F1B2D]/60">No. WhatsApp:</span>
                  <span className="font-mono text-[#0F1B2D]">{guestToDelete.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[#0F1B2D]/60">Status RSVP:</span>
                <span className="font-medium">
                  {guestToDelete.status === 'attending'
                    ? 'Hadir'
                    : guestToDelete.status === 'not_attending'
                    ? 'Berhalangan'
                    : 'Pending'}
                </span>
              </div>
            </div>

            <div className="mt-3.5 p-3 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 flex items-start gap-2">
              <span className="text-rose-600 font-bold shrink-0">⚠️</span>
              <span>
                Tindakan ini tidak dapat dibatalkan. Tautan undangan personal dan data konfirmasi kehadiran akan dihapus dari sistem.
              </span>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setGuestToDelete(null)}
                className="px-4 py-2 rounded border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 font-medium text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <span>Ya, Hapus Tamu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-sm)] shadow-2xl border border-[#0F1B2D]/10 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                  Hapus {selectedIds.length} Tamu Sekaligus?
                </h3>
                <p className="text-xs text-[#0F1B2D]/70 leading-relaxed">
                  Anda akan menghapus data dari <strong>{selectedIds.length} tamu undangan</strong> yang dipilih secara massal.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-stone-50 rounded border border-stone-200/80 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#0F1B2D]/60 font-medium">Grup Terdampak:</span>
                <span className="font-mono text-[11px] text-[#0F1B2D] truncate max-w-xs">{selectedGroupSummary || '-'}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#0F1B2D]/60 block mb-1.5 font-medium">
                  Pratinjau Tamu ({selectedIds.length} orang):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2.5 rounded border border-stone-200/60 divide-y divide-stone-100">
                  {guests
                    .filter((g) => selectedIds.includes(g.id))
                    .map((g) => (
                      <div key={g.id} className="pt-1 first:pt-0 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-[#0F1B2D] truncate max-w-[240px]">{g.name}</span>
                        <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded shrink-0">
                          {g.groupLabel || 'Tanpa Grup'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-3.5 p-3 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 flex items-start gap-2">
              <span className="text-rose-600 font-bold shrink-0">⚠️</span>
              <span>
                <strong>PERINGATAN:</strong> Tindakan ini TIDAK DAPAT DIBATALKAN. Semua tautan undangan dan konfirmasi RSVP tamu-tamu tersebut akan dihapus permanen.
              </span>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 font-medium text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus {selectedIds.length} Tamu...</span>
                  </>
                ) : (
                  <>
                    <span>Ya, Hapus {selectedIds.length} Tamu Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
