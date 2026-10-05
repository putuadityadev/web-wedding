'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SiteContent } from '@/lib/content/types';

interface CmsSectionPreviewProps {
  section: keyof SiteContent;
  content: SiteContent;
}

export function CmsSectionPreview({ section, content }: CmsSectionPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [coverOpen, setCoverOpen] = useState(section !== 'cover');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Sync content updates into the iframe via postMessage on every change
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !isIframeLoaded) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SYNC_CONTENT',
          content,
        },
        window.location.origin
      );
    } catch (e) {
      console.warn('Failed to sync content to preview iframe:', e);
    }
  }, [content, isIframeLoaded]);

  // Scroll to active section in the iframe when user changes tab in CMS
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !isIframeLoaded) return;
    try {
      const nextOpen = section !== 'cover';
      setCoverOpen(nextOpen);
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'TOGGLE_COVER',
          open: nextOpen,
        },
        window.location.origin
      );
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SCROLL_TO',
          section,
        },
        window.location.origin
      );
    } catch (e) {
      console.warn('Failed to scroll preview iframe:', e);
    }
  }, [section, isIframeLoaded]);

  const handleToggleCover = () => {
    const nextState = !coverOpen;
    setCoverOpen(nextState);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'TOGGLE_COVER',
          open: nextState,
        },
        window.location.origin
      );
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsIframeLoaded(false);
      iframeRef.current.src = `/preview?unlocked=${coverOpen ? '1' : '0'}&t=${Date.now()}`;
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Frame Top Toolbar */}
      <div className="w-full flex items-center justify-between mb-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider uppercase bg-[#0F1B2D] text-white px-2.5 py-1 rounded-sm font-semibold">
            1:1 REAL LANDING PREVIEW
          </span>
          <span className="text-[11px] font-mono text-[#0F1B2D]/60 hidden sm:inline">
            📍 {section.toUpperCase()}
          </span>
        </div>

        {/* Viewport switchers & actions */}
        <div className="flex items-center gap-1.5">
          {/* Cover Toggle */}
          <button
            type="button"
            onClick={handleToggleCover}
            title={coverOpen ? 'Tutup Cover (Lihat Amplop)' : 'Buka Cover (Lihat Isi)'}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-all ${
              !coverOpen
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-medium'
                : 'bg-white border-[#0F1B2D]/15 text-[#0F1B2D]/70 hover:text-[#0F1B2D]'
            }`}
          >
            {coverOpen ? '✉️ Tutup Cover' : '✉️ Buka Cover'}
          </button>

          {/* Device viewport toggle */}
          <div className="flex rounded bg-[#0F1B2D]/5 p-0.5 border border-[#0F1B2D]/10">
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`px-2 py-0.5 text-[11px] rounded transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-white text-[#0F1B2D] shadow-2xs font-medium'
                  : 'text-[#0F1B2D]/50 hover:text-[#0F1B2D]'
              }`}
            >
              📱 Mobile
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`px-2 py-0.5 text-[11px] rounded transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-white text-[#0F1B2D] shadow-2xs font-medium'
                  : 'text-[#0F1B2D]/50 hover:text-[#0F1B2D]'
              }`}
            >
              💻 Wide
            </button>
          </div>

          {/* Reload button */}
          <button
            type="button"
            onClick={handleReload}
            title="Reload Preview"
            className="p-1 rounded hover:bg-stone-200 text-[#0F1B2D]/60 hover:text-[#0F1B2D] transition-colors"
          >
            ↻
          </button>

          {/* Open full tab */}
          <a
            href="/preview"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka di Tab Baru"
            className="p-1 rounded hover:bg-stone-200 text-[#0F1B2D]/60 hover:text-[#0F1B2D] transition-colors"
          >
            ↗
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div
        className={`transition-all duration-300 mx-auto ${
          deviceMode === 'mobile'
            ? 'w-[335px] sm:w-[345px] h-[640px] rounded-[32px] border-[6px] border-[#0F1B2D] shadow-2xl overflow-hidden bg-[var(--paper)] flex flex-col'
            : 'w-full h-[640px] rounded-xl border border-[#0F1B2D]/20 shadow-xl overflow-hidden bg-[var(--paper)] flex flex-col'
        }`}
      >
        {/* Dynamic Island / Mobile Notch (Only visible in mobile mode) */}
        {deviceMode === 'mobile' && (
          <div className="bg-[#0F1B2D] text-white px-6 py-2 flex items-center justify-between text-[11px] font-mono select-none shrink-0 z-30">
            <span className="font-semibold tracking-wider text-[10px]">9:41</span>
            <div className="w-20 h-4 bg-black/70 rounded-full mx-auto" />
            <div className="flex items-center gap-1 opacity-80 text-[10px]">
              <span>5G</span>
              <div className="w-3.5 h-2 border border-white rounded-xs relative">
                <div className="h-full bg-white w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* Real Embedded Landing Page iFrame */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[var(--paper)]">
          {!isIframeLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--paper)] text-[#0F1B2D] space-y-2">
              <svg className="animate-spin w-5 h-5 text-[#0F1B2D]/50" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-[11px] font-mono text-[#0F1B2D]/60 tracking-wider">
                Memuat 1:1 Landing Page...
              </span>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={`/preview?unlocked=${section === 'cover' ? '0' : '1'}`}
            title="Real 1:1 Landing Preview"
            onLoad={() => {
              setIsIframeLoaded(true);
              // Send initial content immediately upon iframe load
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                  { type: 'SYNC_CONTENT', content },
                  window.location.origin
                );
                iframeRef.current.contentWindow.postMessage(
                  { type: 'TOGGLE_COVER', open: section !== 'cover' },
                  window.location.origin
                );
                iframeRef.current.contentWindow.postMessage(
                  { type: 'SCROLL_TO', section },
                  window.location.origin
                );
              }
            }}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
