'use client';

import React, { useEffect, useRef, useState } from 'react';

interface InteractiveMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  mapsUrl?: string;
  venueName?: string;
  venueAddress?: string;
}

export function InteractiveMap({
  lat = -8.3981403,
  lng = 115.3643337,
  zoom = 16,
  mapsUrl = 'https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337',
  venueName = 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
  venueAddress = 'Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614',
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;
    let isCancelled = false;

    async function setupMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (isCancelled || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map with clean minimal settings
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      // OpenStreetMap tiles (100% free, no API key needed, zero watermark)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Simple clean minimal pin
      const pinIcon = L.divIcon({
        className: 'clean-map-pin',
        html: `
          <div style="position:relative; transform: translate(-50%, -100%); cursor:pointer;">
            <div style="width: 14px; height: 14px; background: #142A42; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
            <div style="width: 2px; height: 10px; background: #142A42; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      marker.on('click', () => {
        const a = document.createElement('a');
        a.href = mapsUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });

      mapInstanceRef.current = map;
    }

    setupMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, lat, lng, zoom, mapsUrl]);

  return (
    <div className="relative w-full rounded-[var(--radius-sm)] overflow-hidden border border-[var(--ink)]/15 bg-[#EAF0F6]">
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        className="editorial-map w-full h-[360px] sm:h-[420px] z-10"
      />

      {/* Minimal clean floating link to Google Maps */}
      <div className="absolute top-4 right-4 z-20">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-[var(--ink)] border border-[var(--ink)]/15 text-[11px] label-eyebrow tracking-[0.16em] backdrop-blur-sm transition-all shadow-xs"
        >
          <span>BUKA DI GOOGLE MAPS</span>
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 12L12 4M12 4H6M12 4V10"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {/* Minimal Coordinates badge bottom left */}
      <div className="absolute bottom-3 left-3 z-20 text-[10px] font-mono text-[var(--ink)] opacity-60 bg-white/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-[var(--ink)]/10">
        -8.3981° S, 115.3643° E · Bangli, Bali
      </div>
    </div>
  );
}
