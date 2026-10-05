'use client';

import React, { useState } from 'react';

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
}

const INITIAL_MOCK_GUESTS: GuestItem[] = [
  {
    id: 'g-1',
    name: 'Bapak Budi & Keluarga',
    nickname: 'Budi',
    salutation: 'Bapak',
    phone: '+6281234567890',
    groupLabel: 'Keluarga',
    tone: 'warm',
    maxPax: 2,
    arrivalAt: '2026-12-12T11:00:00+08:00',
    status: 'attending',
    pax: 2,
    openCount: 3,
    token: 'budi-keluarga',
  },
  {
    id: 'g-2',
    name: 'Kadek Mahendra',
    nickname: 'Kadek',
    salutation: 'Bli',
    phone: '+6281987654321',
    groupLabel: 'Teman Kantor TVRI',
    tone: 'casual',
    maxPax: 1,
    arrivalAt: '2026-12-12T12:00:00+08:00',
    status: 'attending',
    pax: 1,
    openCount: 1,
    token: 'kadek-mahendra',
  },
  {
    id: 'g-3',
    name: 'Siti Rahmawati & Rekan',
    nickname: 'Siti',
    salutation: 'Ibu',
    phone: '+6281776543210',
    groupLabel: 'Sahabat Kuliah',
    tone: 'formal',
    maxPax: 2,
    arrivalAt: null,
    status: 'not_attending',
    pax: 0,
    openCount: 2,
    token: 'siti-rahmawati',
  },
  {
    id: 'g-4',
    name: 'I Gede Suardika & Partner',
    nickname: 'Gede',
    salutation: 'Bli',
    phone: '+6281333444555',
    groupLabel: 'Keluarga Besar Bangli',
    tone: 'warm',
    maxPax: 2,
    arrivalAt: '2026-12-12T11:00:00+08:00',
    status: 'pending',
    pax: 0,
    openCount: 0,
    token: 'gede-suardika',
  },
];

export function GuestManager() {
  const [guests, setGuests] = useState<GuestItem[]>(INITIAL_MOCK_GUESTS);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New guest form state
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    salutation: 'Bapak / Ibu',
    phone: '',
    groupLabel: 'Keluarga & Kerabat',
    tone: 'warm' as 'formal' | 'warm' | 'casual',
    maxPax: 2,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/u/${token}`;
    navigator.clipboard.writeText(link);
    showToast('Link undangan disalin ke clipboard!');
  };

  const handleOpenWhatsApp = (guest: GuestItem) => {
    if (!guest.phone) {
      showToast('Tamu ini tidak memiliki nomor WhatsApp!');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/u/${guest.token}`;
    const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Halo ${guest.salutation} ${guest.nickname || guest.name}, dengan bahagia kami mengundang Anda ke pernikahan Dharma & Lutfhy. Detail dan konfirmasi kehadiran dapat dilihat melalui tautan ini: ${link}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const newGuest: GuestItem = {
      id: `g-${Date.now()}`,
      name: form.name.trim(),
      nickname: form.nickname.trim() || form.name.split(' ')[0],
      salutation: form.salutation.trim(),
      phone: form.phone.trim(),
      groupLabel: form.groupLabel.trim(),
      tone: form.tone,
      maxPax: form.maxPax,
      arrivalAt: null,
      status: 'pending',
      pax: 0,
      openCount: 0,
      token: Math.random().toString(36).substring(2, 10),
    };

    setGuests([newGuest, ...guests]);
    setShowAddModal(false);
    setForm({
      name: '',
      nickname: '',
      salutation: 'Bapak / Ibu',
      phone: '',
      groupLabel: 'Keluarga & Kerabat',
      tone: 'warm',
      maxPax: 2,
    });
    showToast('Tamu baru berhasil ditambahkan!');
  };

  const filteredGuests = guests.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) ||
      g.groupLabel.toLowerCase().includes(search.toLowerCase());

    const matchGroup = filterGroup === 'ALL' || g.groupLabel === filterGroup;
    const matchStatus = filterStatus === 'ALL' || g.status === filterStatus;

    return matchSearch && matchGroup && matchStatus;
  });

  const uniqueGroups = Array.from(new Set(guests.map((g) => g.groupLabel)));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-medium bg-[#0F1B2D] text-white border border-white/20 animate-in fade-in">
          {toastMsg}
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

          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none bg-white"
          >
            <option value="ALL">Semua Grup ({guests.length})</option>
            {uniqueGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="attending">Hadir</option>
            <option value="not_attending">Berhalangan</option>
            <option value="pending">Belum Konfirmasi</option>
          </select>
        </div>

        {/* Add Guest Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide shadow-xs shrink-0 cursor-pointer"
        >
          + Tambah Tamu Baru
        </button>
      </div>

      {/* Guest Table */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#0F1B2D]/10 bg-[#F9FAFB] text-[#0F1B2D]/60 font-mono text-[10px] uppercase">
                <th className="py-3 px-4 font-normal">Nama & Sapaan</th>
                <th className="py-3 px-4 font-normal">No. WhatsApp</th>
                <th className="py-3 px-4 font-normal">Grup</th>
                <th className="py-3 px-4 font-normal">Pax</th>
                <th className="py-3 px-4 font-normal">Status RSVP</th>
                <th className="py-3 px-4 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F1B2D]/5">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#0F1B2D]/50 font-mono">
                    Tidak ada tamu yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0F1B2D]">{guest.name}</div>
                      <div className="text-[10px] text-[#0F1B2D]/50 font-mono">
                        {guest.salutation} · {guest.nickname} ({guest.tone})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#0F1B2D]/80">
                      {guest.phone || <span className="text-stone-400 italic">Tanpa No. HP</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-stone-100 text-[10px] font-mono text-stone-700">
                        {guest.groupLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {guest.status === 'attending' ? `${guest.pax}/${guest.maxPax}` : `${guest.maxPax} Kursi`}
                    </td>
                    <td className="py-3 px-4">
                      {guest.status === 'attending' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hadir ({guest.pax})
                        </span>
                      ) : guest.status === 'not_attending' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200">
                          Berhalangan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(guest)}
                        title="Kirim Undangan via WhatsApp"
                        className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-mono"
                      >
                        Kirim WA ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest.token)}
                        title="Salin Link Undangan Unik"
                        className="px-2 py-1 rounded bg-[#0F1B2D]/5 hover:bg-[#0F1B2D]/10 text-[#0F1B2D] text-[10px] font-mono border border-[#0F1B2D]/10"
                      >
                        Salin Link
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Guest */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-sm)] border border-[#0F1B2D]/15 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
              <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">Tambah Tamu Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#0F1B2D]/50 hover:text-[#0F1B2D] text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  Nama Tamu / Pasangan / Keluarga *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bapak Wayan Sedana & Keluarga"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Sapaan
                  </label>
                  <input
                    type="text"
                    placeholder="Bapak / Ibu / Kak"
                    value={form.salutation}
                    onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Panggilan
                  </label>
                  <input
                    type="text"
                    placeholder="Wayan"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                  Nomor WhatsApp (E.164)
                </label>
                <input
                  type="text"
                  placeholder="+6281234567890"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Grup Tamu
                  </label>
                  <input
                    type="text"
                    placeholder="Keluarga / Kantor"
                    value={form.groupLabel}
                    onChange={(e) => setForm({ ...form, groupLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#0F1B2D]/60 block mb-1">
                    Maks. Tamu (Pax)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.maxPax}
                    onChange={(e) => setForm({ ...form, maxPax: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D] font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#0F1B2D]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-stone-500 hover:text-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#0F1B2D] text-white text-xs font-medium"
                >
                  Simpan Tamu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
