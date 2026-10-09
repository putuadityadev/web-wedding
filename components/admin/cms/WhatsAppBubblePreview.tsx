'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SiteContent } from '@/lib/content/types';
import { formatWhatsAppMessage } from '@/lib/guests/whatsapp';

interface WhatsAppBubblePreviewProps {
  content: SiteContent;
}

export function WhatsAppBubblePreview({ content }: WhatsAppBubblePreviewProps) {
  const [waMode, setWaMode] = useState<'dark' | 'light'>('dark');
  const [imgError, setImgError] = useState(false);

  const branding = content.branding || {
    siteTitle: 'The Wedding of Dharma & Luthfi',
    siteDescription: 'Undangan pernikahan digital I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo.',
    ogImage: '/apple-icon.png',
    ogImageAlt: 'Pernikahan Dharma & Luthfi',
    whatsappShareText: '',
  };

  const groomName = content.hero?.groomName || 'Dharma';
  const brideName = content.hero?.brideName || 'Luthfi';

  const hostDomain =
    typeof window !== 'undefined' && window.location.host
      ? window.location.host
      : 'dharmaluthfi.archantara.id';

  const previewOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : `https://${hostDomain}`;

  // Format message preview using shared whatsapp helper
  const messageText = formatWhatsAppMessage(
    {
      name: 'Bro Aditya',
      nickname: 'Aditya',
      salutation: '',
      token: 'HxvyTHaQDeSr',
    },
    content,
    previewOrigin
  );

  const isDark = waMode === 'dark';

  // Format text to highlight links like real WhatsApp
  const renderMessageBody = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <span
            key={index}
            className={`underline break-all font-medium ${
              isDark ? 'text-[#53BDEB]' : 'text-[#027EB5]'
            }`}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="w-full flex flex-col h-full bg-[#0F1B2D]/5 rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Top Controller Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-stone-200 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-stone-800">Preview WhatsApp Bubble</span>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-full text-[11px]">
          <button
            type="button"
            onClick={() => setWaMode('dark')}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              isDark
                ? 'bg-[#111B21] text-white shadow-2xs font-medium'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🌙 Mode Gelap
          </button>
          <button
            type="button"
            onClick={() => setWaMode('light')}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              !isDark
                ? 'bg-white text-stone-900 shadow-2xs font-medium'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ☀️ Mode Terang
          </button>
        </div>
      </div>

      {/* WhatsApp Simulated Chat Screen */}
      <div
        className={`flex-1 flex flex-col justify-between transition-colors duration-200 min-h-[500px] select-none ${
          isDark ? 'bg-[#0B141A] text-[#E9EDEF]' : 'bg-[#EFEAE2] text-[#111B21]'
        }`}
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(#182229 1px, transparent 1px)'
            : 'radial-gradient(#DFD9CE 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* WhatsApp App Header Bar */}
        <div
          className={`px-3 py-2.5 flex items-center justify-between shadow-xs shrink-0 ${
            isDark ? 'bg-[#202C33] text-white' : 'bg-[#008069] text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-serif text-xs font-semibold text-white shrink-0 overflow-hidden">
              {content.couple?.groom?.photoSrc ? (
                <img
                  src={content.couple.groom.photoSrc}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{groomName.charAt(0)}&amp;{brideName.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight truncate">
                {groomName} &amp; {brideName}
              </p>
              <p className="text-[10px] opacity-75 font-sans leading-none mt-0.5">online</p>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-90">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-end space-y-2 overflow-y-auto">
          {/* Date Badge */}
          <div className="flex justify-center mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-sans font-medium uppercase tracking-wider shadow-2xs ${
                isDark ? 'bg-[#182229] text-[#8696A0]' : 'bg-white/90 text-[#54656F]'
              }`}
            >
              HARI INI
            </span>
          </div>

          {/* WhatsApp Message Bubble (Matches User Reference Screenshot) */}
          <div className="flex justify-end group">
            <div
              className={`max-w-[96%] sm:max-w-[90%] rounded-2xl rounded-tr-xs p-2 sm:p-2.5 shadow-md flex flex-col gap-2 relative transition-all ${
                isDark
                  ? 'bg-[#202C33] text-[#E9EDEF]'
                  : 'bg-white text-[#111B21]'
              }`}
            >
              {/* WhatsApp Rich Link Preview Card */}
              <div
                className={`rounded-xl p-2.5 flex items-start gap-3 transition-colors ${
                  isDark
                    ? 'bg-[#111B21] border border-white/5'
                    : 'bg-[#F0F2F5] border border-black/5'
                }`}
              >
                {/* Thumbnail Image (OG Image configured in CMS) */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-900 border border-black/10 shrink-0 flex items-center justify-center">
                  {branding.ogImage && !imgError ? (
                    <img
                      src={branding.ogImage}
                      alt={branding.ogImageAlt || branding.siteTitle}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0F1B2D] text-amber-200 text-center p-1">
                      <span className="text-xl">💍</span>
                      <span className="text-[9px] font-mono mt-0.5 text-stone-300">Thumbnail</span>
                    </div>
                  )}
                </div>

                {/* Meta Title, Description, and Domain */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4
                    className={`font-semibold text-xs sm:text-sm line-clamp-1 leading-snug ${
                      isDark ? 'text-white' : 'text-[#111B21]'
                    }`}
                  >
                    {branding.siteTitle || 'The Wedding of Dharma & Luthfi'}
                  </h4>
                  <p
                    className={`text-[11px] sm:text-xs line-clamp-2 leading-relaxed mt-0.5 ${
                      isDark ? 'text-[#8696A0]' : 'text-[#667781]'
                    }`}
                  >
                    {branding.siteDescription ||
                      'Undangan pernikahan digital I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo.'}
                  </p>
                  <p
                    className={`text-[10px] font-sans mt-1 truncate ${
                      isDark ? 'text-[#8696A0]' : 'text-[#667781]'
                    }`}
                  >
                    {hostDomain}
                  </p>
                </div>
              </div>

              {/* Message Text Body */}
              <div className="px-1 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line font-sans select-text">
                {renderMessageBody(messageText)}
              </div>

              {/* Timestamp & Status */}
              <div className="flex items-center justify-end gap-1 px-1 self-end mt-0.5">
                <span
                  className={`text-[10px] font-sans ${
                    isDark ? 'text-[#8696A0]' : 'text-[#667781]'
                  }`}
                >
                  12:55
                </span>
                {/* Double checkmarks */}
                <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 11" fill="none">
                  <path
                    d="M11.05.5a.64.64 0 0 0-.46.19l-5.7 5.7L2.4 3.9a.65.65 0 0 0-.91.92l3 3a.64.64 0 0 0 .91 0l6.15-6.16a.65.65 0 0 0-.46-1.16Z"
                    fill="currentColor"
                  />
                  <path
                    d="M15.05.5a.64.64 0 0 0-.46.19l-5.7 5.7-.35-.35a.65.65 0 1 0-.91.92l.8.8a.64.64 0 0 0 .91 0l6.16-6.16a.65.65 0 0 0-.45-1.16Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Simulated Bottom Input Bar */}
        <div
          className={`p-2 flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#202C33]' : 'bg-[#F0F2F5]'
          }`}
        >
          <div
            className={`flex-1 rounded-full px-4 py-2 text-xs flex items-center justify-between ${
              isDark ? 'bg-[#2A3942] text-[#8696A0]' : 'bg-white text-[#54656F]'
            }`}
          >
            <span>Ketik pesan...</span>
            <span className="opacity-60 text-sm">📎</span>
          </div>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-[#00A884] text-white' : 'bg-[#008069] text-white'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
