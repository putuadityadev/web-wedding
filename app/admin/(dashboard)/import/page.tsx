'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { normalizePhoneNumber } from '@/lib/guests/phone';

interface RawRow {
  [key: string]: unknown;
}

interface ImportSummary {
  batchId: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  withPhoneCount?: number;
  withoutPhoneCount?: number;
  invalidPhoneCount?: number;
  totalProcessed: number;
}

function extractFieldValue(row: RawRow, aliases: string[]): string {
  for (const alias of aliases) {
    const val = row[alias];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
}

function extractRowFields(row: RawRow) {
  const name = extractFieldValue(row, [
    'nama',
    'name',
    'nama_lengkap',
    'nama_tamu',
    'guest_name',
    'guest',
  ]);

  const rawPhone = extractFieldValue(row, [
    'no_hp',
    'no_hp_wa',
    'phone',
    'wa',
    'whatsapp',
    'nomor_hp',
    'nomor',
    'nohp',
    'hp',
    'kontak',
    'telepon',
    'telp',
    'no_telp',
    'no_telepon',
    'mobile',
    'no_wa',
  ]);

  const cleanPhone = normalizePhoneNumber(rawPhone);

  const salutation =
    extractFieldValue(row, ['sapaan', 'salutation', 'gelar', 'title']) || 'Bapak / Ibu';

  const nickname =
    extractFieldValue(row, ['panggilan', 'nickname', 'nama_panggilan']) || (name ? name.split(' ')[0] : '');

  const group =
    extractFieldValue(row, ['grup', 'group', 'kategori', 'category', 'rombongan']) ||
    'Keluarga & Kerabat';

  const rawPax = extractFieldValue(row, [
    'maks_tamu',
    'max_pax',
    'pax',
    'jumlah_tamu',
    'kuota',
  ]);
  const pax = Number(rawPax) > 0 ? Number(rawPax) : 2;

  const rawTone = extractFieldValue(row, ['nada', 'tone']).toLowerCase();
  const tone = ['formal', 'warm', 'casual'].includes(rawTone) ? rawTone : 'warm';

  return {
    name,
    rawPhone,
    cleanPhone,
    hasRawPhone: Boolean(rawPhone),
    isPhoneValid: Boolean(cleanPhone),
    salutation,
    nickname,
    group,
    pax,
    tone,
  };
}

export default function AdminImportPage() {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSummary(null);
    setErrorMsg(null);

    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) =>
        header
          .trim()
          .toLowerCase()
          .replace(/[\s\.\-\/\\]+/g, '_')
          .replace(/^_+|_+$/g, ''),
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMsg('File CSV tidak memiliki baris data.');
          setRows([]);
          return;
        }
        setRows(results.data);
      },
      error: (err) => {
        setErrorMsg(`Gagal membaca file CSV: ${err.message}`);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'nama,no_hp,sapaan,grup,maks_tamu,nada\n' +
      'Bapak I Wayan Sedana & Keluarga,081234567890,Bapak,Keluarga,2,warm\n' +
      'Kadek Mahendra,081987654321,Bli,Teman Kantor,1,casual\n' +
      'Ibu Ni Luh Ayu,081333444555,Ibu,Kerabat,2,formal\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_tamu_dharma_lutfhy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommit = async () => {
    if (rows.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Map rows with pre-extracted clean data so server receives normalized payload
      const rowsToSend = rows.map((r) => {
        const fields = extractRowFields(r);
        return {
          ...r,
          nama: fields.name,
          no_hp: fields.cleanPhone || fields.rawPhone,
          clean_phone: fields.cleanPhone || '',
          sapaan: fields.salutation,
          panggilan: fields.nickname,
          grup: fields.group,
          maks_tamu: fields.pax,
          nada: fields.tone,
        };
      });

      const res = await fetch('/api/admin/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rowsToSend,
          duplicateMode,
          filename: fileName || 'import_tamu.csv',
        }),
      });

      const responseText = await res.text();
      let json: {
        ok?: boolean;
        error?: string;
        batchId?: string;
        createdCount?: number;
        updatedCount?: number;
        skippedCount?: number;
        withPhoneCount?: number;
        withoutPhoneCount?: number;
        invalidPhoneCount?: number;
        totalProcessed?: number;
      } = {};

      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(`Respon server tidak valid (${res.status}): ${responseText.slice(0, 100) || 'Gagal memproses import'}`);
      }

      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Terjadi kesalahan saat memproses import (${res.status})`);
      }

      setSummary({
        batchId: json.batchId || '',
        createdCount: json.createdCount ?? 0,
        updatedCount: json.updatedCount ?? 0,
        skippedCount: json.skippedCount ?? 0,
        withPhoneCount: json.withPhoneCount ?? 0,
        withoutPhoneCount: json.withoutPhoneCount ?? 0,
        invalidPhoneCount: json.invalidPhoneCount ?? 0,
        totalProcessed: json.totalProcessed ?? 0,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengimpor tamu ke database';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setRows([]);
    setFileName(null);
    setSummary(null);
    setErrorMsg(null);
  };

  // Row validation counts using extractRowFields
  const parsedRowsWithFields = rows.map((r) => ({
    raw: r,
    fields: extractRowFields(r),
  }));

  const validRows = parsedRowsWithFields.filter((item) => Boolean(item.fields.name));
  const invalidRows = parsedRowsWithFields.filter((item) => !Boolean(item.fields.name));
  const validPhoneRows = validRows.filter((item) => item.fields.isPhoneValid);
  const missingPhoneRows = validRows.filter((item) => !item.fields.hasRawPhone);
  const invalidPhoneRows = validRows.filter((item) => item.fields.hasRawPhone && !item.fields.isPhoneValid);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
            IMPORT DATA MASSAL
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
            Import Tamu dari Excel / CSV
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl">
            Unggah file CSV untuk memasukkan puluhan hingga ratusan tamu sekaligus ke database Supabase dan secara otomatis membuat tautan unik personal per tamu.
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900">
            <span>💡</span>
            <span>
              <strong>Dukungan Format Fleksibel:</strong> Mendukung format nomor HP Indonesia (08..., 8..., +62..., 62...), notasi ilmiah Excel, maupun nomor internasional. Tamu tanpa nomor HP tetap tersimpan aman.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium shadow-2xs shrink-0 cursor-pointer"
        >
          <span>📥 Unduh Template CSV</span>
        </button>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] p-4 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-600 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Result Summary Banner (Post-Commit) */}
      {summary && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-800 font-semibold block">
                ✓ IMPORT BERHASIL DIPROSES
              </span>
              <h3 className="font-serif text-xl font-medium text-emerald-950">
                {summary.createdCount + summary.updatedCount} Tamu Berhasil Disimpan ke Supabase!
              </h3>
              <p className="text-xs text-emerald-800/80">
                Tautan unik personal telah dibuat untuk setiap tamu. Anda dapat langsung melanjutkan ke menu Blasting WhatsApp untuk mengirim undangan.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded border border-emerald-300">
              Batch: {summary.batchId.substring(0, 8)}...
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-white/80 p-3 rounded border border-emerald-200/80 text-xs">
              <div className="text-[10px] font-mono text-emerald-800/60 uppercase">Tamu Baru</div>
              <div className="text-xl font-serif font-medium text-emerald-900 mt-1">
                {summary.createdCount}
              </div>
            </div>
            <div className="bg-white/80 p-3 rounded border border-emerald-200/80 text-xs">
              <div className="text-[10px] font-mono text-emerald-800/60 uppercase">Ada No. HP</div>
              <div className="text-xl font-serif font-medium text-emerald-700 mt-1">
                {summary.withPhoneCount ?? 0}
              </div>
            </div>
            <div className="bg-white/80 p-3 rounded border border-emerald-200/80 text-xs">
              <div className="text-[10px] font-mono text-emerald-800/60 uppercase">Tanpa No. HP</div>
              <div className="text-xl font-serif font-medium text-stone-700 mt-1">
                {summary.withoutPhoneCount ?? 0}
              </div>
            </div>
            <div className="bg-white/80 p-3 rounded border border-emerald-200/80 text-xs">
              <div className="text-[10px] font-mono text-emerald-800/60 uppercase">Diperbarui</div>
              <div className="text-xl font-serif font-medium text-blue-900 mt-1">
                {summary.updatedCount}
              </div>
            </div>
            <div className="bg-white/80 p-3 rounded border border-emerald-200/80 text-xs">
              <div className="text-[10px] font-mono text-emerald-800/60 uppercase">Dilewati</div>
              <div className="text-xl font-serif font-medium text-stone-600 mt-1">
                {summary.skippedCount}
              </div>
            </div>
          </div>

          {summary.invalidPhoneCount !== undefined && summary.invalidPhoneCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              ℹ️ Terdapat <strong>{summary.invalidPhoneCount} nomor HP</strong> yang tidak dapat dikenali formatnya sehingga disimpan tanpa nomor HP. Anda dapat melengkapinya kapan saja melalui menu Buku Tamu.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-emerald-200/80">
            <Link
              href={`/admin/blast?batchId=${summary.batchId}`}
              className="px-4 py-2.5 rounded bg-[#25D366] text-white hover:bg-[#20ba5a] text-xs font-medium tracking-wide shadow-xs inline-flex items-center gap-1.5 transition-all"
            >
              <span>🚀 Buka WhatsApp Blasting (Batch Ini)</span>
            </Link>
            <Link
              href="/admin/guests"
              className="px-4 py-2.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide shadow-xs inline-flex items-center gap-1.5 transition-all"
            >
              <span>👥 Lihat di Buku Tamu</span>
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-2.5 rounded bg-white border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 text-xs font-medium transition-all"
            >
              Import File Lain
            </button>
          </div>
        </div>
      )}

      {/* Upload Dropzone (When not committed or previewing) */}
      {!summary && (
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-8 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#0F1B2D]/5 text-[#0F1B2D] flex items-center justify-center text-2xl">
              📄
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">Pilih Berkas CSV</h3>
              <p className="text-xs text-[#0F1B2D]/50 mt-1">
                File format .CSV (UTF-8, pemisah koma atau titik koma) hasil ekspor Excel atau Google Sheets.
              </p>
            </div>

            <label className="inline-block px-5 py-2.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium cursor-pointer transition-all shadow-xs">
              <span>Pilih File CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {fileName && (
              <div className="text-xs font-mono text-[#0F1B2D]/70 pt-2 bg-stone-50 py-2 px-3 rounded border border-stone-200 inline-block">
                File: <strong>{fileName}</strong> ({rows.length} baris terdeteksi)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Table & Duplicate Settings (When rows parsed and not yet committed) */}
      {rows.length > 0 && !summary && (
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#0F1B2D]/10 gap-4">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                Pratinjau Data ({rows.length} Tamu)
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#0F1B2D]/60 mt-1">
                <span className="text-emerald-700 font-medium">✓ {validRows.length} baris valid</span>
                <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  📱 {validPhoneRows.length} siap kirim WA
                </span>
                {missingPhoneRows.length > 0 && (
                  <span className="text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    ℹ️ {missingPhoneRows.length} tanpa No. HP
                  </span>
                )}
                {invalidPhoneRows.length > 0 && (
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                    ⚠️ {invalidPhoneRows.length} format No. HP tidak valid
                  </span>
                )}
                {invalidRows.length > 0 && (
                  <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    ✕ {invalidRows.length} tanpa nama (dilewati)
                  </span>
                )}
              </div>
            </div>

            {/* Commit Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded border border-[#0F1B2D]/15 text-[#0F1B2D] hover:bg-stone-50 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={isProcessing || validRows.length === 0}
                className="px-5 py-2.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-medium tracking-wide shadow-xs transition-all disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Simpan {validRows.length} Tamu ke Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Duplicate Mode Options */}
          <div className="bg-[#F8F9FA] p-4 rounded border border-[#0F1B2D]/10 space-y-2 text-xs">
            <label className="font-medium text-[#0F1B2D] block">
              Penanganan Duplikasi Tamu (Berdasarkan No. HP atau Nama & Grup):
            </label>
            <div className="flex flex-col sm:flex-row gap-4 text-[#0F1B2D]/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dupMode"
                  value="skip"
                  checked={duplicateMode === 'skip'}
                  onChange={() => setDuplicateMode('skip')}
                  className="accent-[#0F1B2D]"
                />
                <span>Lewati tamu jika nomor WhatsApp atau nama sudah terdaftar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dupMode"
                  value="update"
                  checked={duplicateMode === 'update'}
                  onChange={() => setDuplicateMode('update')}
                  className="accent-[#0F1B2D]"
                />
                <span>Perbarui data tamu jika nomor WhatsApp atau nama sudah terdaftar</span>
              </label>
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-[#0F1B2D]/10 rounded">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0F1B2D]/10 bg-[#F9FAFB] text-[#0F1B2D]/60 font-mono text-[10px] uppercase sticky top-0 z-10">
                  <th className="py-2.5 px-3 text-center w-12 font-normal">No.</th>
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3">No. WhatsApp (Ternormalisasi)</th>
                  <th className="py-2.5 px-3">Sapaan</th>
                  <th className="py-2.5 px-3">Grup</th>
                  <th className="py-2.5 px-3">Maks Pax</th>
                  <th className="py-2.5 px-3">Nada</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B2D]/5">
                {parsedRowsWithFields.map((item, idx) => {
                  const {
                    name,
                    rawPhone,
                    cleanPhone,
                    hasRawPhone,
                    isPhoneValid,
                    salutation,
                    group,
                    pax,
                    tone,
                  } = item.fields;

                  return (
                    <tr key={idx} className="hover:bg-[#F9FAFB]/70">
                      <td className="py-2 px-3 text-center font-mono text-[#0F1B2D]/40 text-[11px] select-none">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-[#0F1B2D]">
                        {name ? name : <span className="text-red-500 italic">(Nama kosong)</span>}
                      </td>
                      <td className="py-2 px-3">
                        {isPhoneValid && cleanPhone ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-emerald-800 font-medium">
                              {cleanPhone}
                            </span>
                            {rawPhone && rawPhone !== cleanPhone && (
                              <span className="block text-[9px] font-mono text-stone-400">
                                asal: {rawPhone}
                              </span>
                            )}
                          </div>
                        ) : hasRawPhone ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 text-[10px] font-mono">
                              ⚠️ Format tidak valid
                            </span>
                            <span className="block text-[9px] font-mono text-stone-500 truncate max-w-[140px]" title={rawPhone}>
                              {rawPhone}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-[10px] font-mono">
                            Belum ada No. HP
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#0F1B2D]/70">{salutation}</td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">
                          {group}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[#0F1B2D]/70">{pax}</td>
                      <td className="py-2 px-3 font-mono text-[#0F1B2D]/70">{tone}</td>
                      <td className="py-2 px-3">
                        {!name ? (
                          <span className="text-red-600 font-mono text-[10px] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Nama Kosong (Dilewati)
                          </span>
                        ) : isPhoneValid ? (
                          <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Siap Import
                          </span>
                        ) : hasRawPhone ? (
                          <span className="text-amber-800 font-mono text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                            Simpan (Tanpa No. HP)
                          </span>
                        ) : (
                          <span className="text-stone-600 font-mono text-[10px] bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                            Simpan (Tanpa No. HP)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
