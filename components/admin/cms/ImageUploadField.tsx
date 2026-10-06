'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  optimizeImageForUpload,
  formatBytes,
  OptimizeResult,
} from '@/lib/media/clientImageOptimizer';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
  aspectRatio?: string;
  accept?: string;
  mediaType?: 'image' | 'video' | 'any';
}

export function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'general',
  hint,
  aspectRatio = '4/5',
  accept,
  mediaType = 'image',
}: ImageUploadFieldProps) {
  const [stage, setStage] = useState<'idle' | 'optimizing' | 'uploading'>('idle');
  const [justUploadedInfo, setJustUploadedInfo] = useState<{
    message: string;
    stats?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isVideo =
    mediaType === 'video' ||
    (value &&
      (value.endsWith('.mp4') ||
        value.endsWith('.webm') ||
        value.endsWith('.mov') ||
        value.endsWith('.m4v') ||
        value.endsWith('.mkv')));

  const isAudio =
    (accept && accept.includes('audio')) ||
    (value &&
      (value.endsWith('.mp3') ||
        value.endsWith('.wav') ||
        value.endsWith('.m4a') ||
        value.endsWith('.ogg') ||
        value.endsWith('.flac')));

  // Format accept yang ramah & tidak membatasi perangkat kamera / smartphone
  const resolvedAccept =
    accept ||
    (mediaType === 'video'
      ? 'video/*,video/mp4,video/webm,video/quicktime'
      : mediaType === 'any'
      ? 'image/*,video/*,audio/*'
      : 'image/*'); // Mendukung AVIF, HEIC, JPEG, PNG, WebP dari kamera manapun

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setError(null);
    setJustUploadedInfo(null);

    try {
      let fileToUpload = rawFile;
      let optInfo: OptimizeResult | null = null;

      // 1. Optimasi & konversi foto ke WebP secara otomatis di sisi browser
      const isImg =
        rawFile.type.startsWith('image/') ||
        mediaType === 'image' ||
        /\.(jpe?g|png|webp|avif|heic|heif|bmp|tiff)$/i.test(rawFile.name);

      if (isImg && !rawFile.type.startsWith('video/') && !rawFile.type.startsWith('audio/')) {
        setStage('optimizing');
        try {
          optInfo = await optimizeImageForUpload(rawFile, {
            maxDimension: 2560,
            quality: 0.85,
          });
          if (optInfo && optInfo.file) {
            fileToUpload = optInfo.file;
          }
        } catch (optErr) {
          console.warn('[ImageUpload] Optimasi client dilewati, mengunggah file asli:', optErr);
        }
      }

      // 2. Unggah ke endpoint server
      setStage('uploading');
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      // Parsing respon secara aman — anti-crash syntax error
      const responseText = await res.text();
      let data: { ok?: boolean; url?: string; error?: string } = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        if (res.status === 413) {
          throw new Error('Ukuran file terlalu besar untuk server. Gunakan file yang lebih kecil atau kurangi resolusi.');
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error('Sesi admin berakhir. Silakan login kembali di tab baru lalu coba unggah lagi.');
        }
        throw new Error(`Respon server tidak valid (${res.status}): ${responseText.slice(0, 100) || 'Gagal memproses unggahan'}`);
      }

      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || `Upload gagal dengan kode status ${res.status}`);
      }

      // 3. Terapkan URL baru ke state CMS
      onChange(data.url);

      const statsText =
        optInfo && optInfo.optimized && optInfo.savedPercent && optInfo.savedPercent > 0
          ? `(dioptimasi ${formatBytes(optInfo.originalSize)} → ${formatBytes(optInfo.newSize)} WebP, hemat ${optInfo.savedPercent}%)`
          : undefined;

      setJustUploadedInfo({
        message: 'File berhasil diunggah!',
        stats: statsText,
      });

      setTimeout(() => setJustUploadedInfo(null), 10000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file';
      setError(msg);
    } finally {
      setStage('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualUrlSave = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
    }
  };

  const isBusy = stage !== 'idle';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[#0F1B2D]/70 font-medium">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] font-mono text-[#0F1B2D]/50 hover:text-[#0F1B2D] underline underline-offset-2"
        >
          {showUrlInput ? 'Pilih File Saja' : 'Input URL Manual'}
        </button>
      </div>

      {hint && <p className="text-[10px] text-[#0F1B2D]/50">{hint}</p>}

      {error && (
        <div className="p-2.5 rounded bg-red-50 text-red-700 text-[11px] border border-red-200 flex items-start justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {justUploadedInfo && (
        <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-200 flex items-start gap-2 font-medium">
          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
          <div className="flex-1">
            <span>
              {justUploadedInfo.message} {justUploadedInfo.stats && <span className="text-emerald-700 font-normal">{justUploadedInfo.stats}</span>}{' '}
              Pastikan klik tombol <strong>&ldquo;Simpan Perubahan&rdquo;</strong> di pojok kanan atas agar tersimpan ke database.
            </span>
          </div>
        </div>
      )}

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 px-3 py-2 rounded text-xs border border-[#0F1B2D]/20 focus:outline-none focus:border-[#0F1B2D]"
          />
          <button
            type="button"
            onClick={handleManualUrlSave}
            className="px-3 py-2 bg-[#0F1B2D] text-white rounded text-xs font-medium"
          >
            Terapkan
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-4 p-3 rounded border border-dashed border-[#0F1B2D]/20 bg-[#F9FAFB]">
          {/* Thumbnail preview */}
          {value ? (
            <div
              className="relative w-20 h-24 rounded overflow-hidden bg-black/10 border border-black/10 shrink-0"
              style={{ aspectRatio }}
            >
              {isVideo ? (
                <video
                  src={value}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : isAudio ? (
                <div className="w-full h-full bg-[#0F1B2D]/10 flex flex-col items-center justify-center p-2 text-center text-[#0F1B2D]">
                  <span className="text-xl">🎵</span>
                  <span className="text-[9px] font-mono mt-1 font-semibold uppercase">AUDIO</span>
                </div>
              ) : (
                <Image
                  src={value}
                  alt={label}
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              )}
            </div>
          ) : (
            <div className="w-20 h-24 rounded bg-stone-200/50 flex items-center justify-center text-[10px] text-stone-400 font-mono shrink-0">
              {isVideo ? 'NO VIDEO' : isAudio ? 'NO AUDIO' : 'KOSONG'}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={resolvedAccept}
              onChange={handleFileChange}
              disabled={isBusy}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="px-3 py-1.5 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium tracking-wide shadow-2xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {stage === 'optimizing' ? (
                  <>
                    <span className="inline-block animate-spin">⚡</span>
                    <span>Mengompres Foto...</span>
                  </>
                ) : stage === 'uploading' ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Mengunggah...</span>
                  </>
                ) : value ? (
                  isVideo ? 'Ganti Video' : isAudio ? 'Ganti Audio' : 'Ganti Foto'
                ) : (
                  isVideo ? 'Unggah Video' : isAudio ? 'Unggah Audio' : 'Unggah Foto'
                )}
              </button>

              {value && !isBusy && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 text-xs transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>

            <p className="text-[10px] text-[#0F1B2D]/50 font-mono truncate max-w-xs" title={value}>
              {value
                ? value
                : isVideo
                ? 'Format video bebas (MP4, WebM, MOV, dsb.)'
                : isAudio
                ? 'Format audio MP3, WAV, M4A, dsb.'
                : 'Format foto bebas (AVIF, HEIC, JPG, PNG, WebP otomatis dioptimasi)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
