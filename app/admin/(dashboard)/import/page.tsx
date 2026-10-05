'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';

interface ParsedRow {
  nama: string;
  no_hp?: string;
  sapaan?: string;
  grup?: string;
  maks_tamu?: string;
}

export default function AdminImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setCommitted(false);

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'nama,no_hp,sapaan,grup,maks_tamu\n' +
      'Bapak I Wayan Sedana & Keluarga,+6281234567890,Bapak,Keluarga,2\n' +
      'Kadek Mahendra,+6281987654321,Bli,Teman Kantor,1\n' +
      'Ibu Ni Luh Ayu,+6281333444555,Ibu,Kerabat,2\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_tamu_dharma_lutfhy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommit = () => {
    setCommitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
            IMPORT & EXPORT DATA
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
            Import Tamu dari Excel / CSV
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1">
            Unggah file CSV untuk memasukkan ratusan tamu secara serentak.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium shadow-2xs shrink-0"
        >
          <span>📥 Unduh Template CSV</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-8 text-center shadow-xs">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#0F1B2D]/5 text-[#0F1B2D] flex items-center justify-center text-xl">
            📄
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">Pilih File CSV</h3>
            <p className="text-xs text-[#0F1B2D]/50 mt-1">
              File UTF-8 dengan pemisah koma (,) atau titik koma (;) dari Excel.
            </p>
          </div>

          <label className="inline-block px-4 py-2.5 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium cursor-pointer transition-all shadow-xs">
            <span>Pilih File dari Komputer</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {fileName && (
            <div className="text-xs font-mono text-[#0F1B2D]/70 pt-2">
              File terpilih: <strong>{fileName}</strong> ({rows.length} baris terbaca)
            </div>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {rows.length > 0 && (
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#0F1B2D]/10">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
                Pratinjau Data ({rows.length} Tamu)
              </h3>
              <p className="text-xs text-[#0F1B2D]/50 mt-0.5">
                Pastikan nama dan nomor WhatsApp sudah sesuai sebelum memproses.
              </p>
            </div>

            {!committed ? (
              <button
                type="button"
                onClick={handleCommit}
                className="px-4 py-2 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-medium transition-all shadow-xs"
              >
                ✓ Simpan Semua Tamu ke Database
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 text-xs font-mono font-medium border border-emerald-200">
                ✓ Berhasil Diimport!
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0F1B2D]/10 bg-[#F9FAFB] text-[#0F1B2D]/60 font-mono text-[10px] uppercase sticky top-0">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3">No. HP</th>
                  <th className="py-2.5 px-3">Sapaan</th>
                  <th className="py-2.5 px-3">Grup</th>
                  <th className="py-2.5 px-3">Pax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B2D]/5">
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="hover:bg-[#F9FAFB]">
                    <td className="py-2 px-3 font-mono text-[10px] text-stone-400">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-[#0F1B2D]">{r.nama}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#0F1B2D]/70">{r.no_hp || '-'}</td>
                    <td className="py-2 px-3 text-[#0F1B2D]/60">{r.sapaan || '-'}</td>
                    <td className="py-2 px-3 font-mono text-[10px] text-stone-600">{r.grup || 'Umum'}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{r.maks_tamu || '2'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
