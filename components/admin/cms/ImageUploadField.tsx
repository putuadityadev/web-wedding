'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';

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
  const [uploading, setUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isVideo =
    mediaType === 'video' ||
    (value && (value.endsWith('.mp4') || value.endsWith('.webm') || value.endsWith('.mov') || value.endsWith('.m4v')));

  const isAudio =
    (accept && accept.includes('audio')) ||
    (value && (value.endsWith('.mp3') || value.endsWith('.wav') || value.endsWith('.m4a') || value.endsWith('.ogg')));

  const resolvedAccept =
    accept ||
    (mediaType === 'video'
      ? 'video/mp4,video/webm,video/quicktime'
      : mediaType === 'any'
      ? 'image/*,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/*'
      : 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setJustUploaded(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Upload gagal');
      }

      onChange(data.url);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file';
      setError(msg);
    } finally {
      setUploading(false);
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
        <div className="p-2 rounded bg-red-50 text-red-700 text-[11px] border border-red-200">
          {error}
        </div>
      )}

      {justUploaded && (
        <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-200 flex items-center gap-2 font-medium">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>
            File berhasil diunggah! Pastikan klik tombol <strong>&ldquo;Simpan Perubahan&rdquo;</strong> agar tampil di landing page.
          </span>
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
                  unoptimized={value.startsWith('http')}
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
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium tracking-wide shadow-2xs transition-all disabled:opacity-50"
              >
                {uploading
                  ? 'Mengunggah...'
                  : value
                  ? isVideo
                    ? 'Ganti Video'
                    : 'Ganti Foto'
                  : isVideo
                  ? 'Unggah Video'
                  : 'Unggah Foto'}
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 text-xs transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>

            <p className="text-[10px] text-[#0F1B2D]/45 font-mono truncate max-w-xs" title={value}>
              {value
                ? value
                : isVideo
                ? 'Format MP4, WebM, MOV (maks 50MB)'
                : 'Format JPG, PNG, WEBP, atau AVIF (maks 15MB)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
