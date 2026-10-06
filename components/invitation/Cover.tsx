'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';

interface CoverProps {
  guestName: string;
  salutation?: string;
  groomName?: string;
  brideName?: string;
  headline?: string;
  dateFormatted?: string;
  badge?: string;
  guestGreetingLabel?: string;
  openButtonLabel?: string;
  tapHintLabel?: string;
  onOpenInvitation: () => void;
  isForceOpened?: boolean;
}

const SPRITE_CONFIG = {
  cols: 4,
  rows: 5,
  framesPerSheet: 20,
  frameWidth: 405,
  frameHeight: 720,
  totalFrames: 77, // Frame 0: closed, Frames 1-76: opening motion
  sheets: [
    '/envelope/sheet_0.webp',
    '/envelope/sheet_1.webp',
    '/envelope/sheet_2.webp',
    '/envelope/sheet_3.webp',
  ],
  coverClosed: '/envelope/cover_closed.webp',
};

// Dispatch a subtle fluid burst on SplashCursor for ethereal smokey swirls
function triggerSmokeyBurst(x: number, y: number) {
  if (typeof window === 'undefined') return;
  try {
    const downEvent = new MouseEvent('mousedown', {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
    window.dispatchEvent(downEvent);

    // Organic swirl motions
    setTimeout(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: x + 45,
          clientY: y - 35,
          bubbles: true,
        })
      );
    }, 60);

    setTimeout(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: x - 35,
          clientY: y + 25,
          bubbles: true,
        })
      );
    }, 130);

    setTimeout(() => {
      window.dispatchEvent(
        new MouseEvent('mouseup', {
          clientX: x,
          clientY: y,
          bubbles: true,
        })
      );
    }, 220);
  } catch {
    // Ignore any environment restrictions
  }
}

export function Cover({
  guestName,
  salutation,
  groomName,
  brideName,
  headline,
  dateFormatted,
  badge,
  guestGreetingLabel,
  openButtonLabel,
  tapHintLabel,
  onOpenInvitation,
  isForceOpened,
}: CoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uiOverlayRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const smokeRef = useRef<HTMLDivElement | null>(null);

  // Staggered text refs
  const headerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const salutationRef = useRef<HTMLSpanElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);
  const separatorRef = useRef<HTMLDivElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const subtextRef = useRef<HTMLParagraphElement | null>(null);

  // Cinematic editorial text intro preloader refs
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const introLine1Ref = useRef<HTMLDivElement | null>(null);
  const introLine2Ref = useRef<HTMLHeadingElement | null>(null);
  const introLine3Ref = useRef<HTMLDivElement | null>(null);

  const sheetsRef = useRef<HTMLImageElement[]>([]);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
  const currentFrameRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const isLoadedRef = useRef<boolean>(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const { lenis } = useLenisContext();

  useEffect(() => {
    if (isForceOpened) {
      if (containerRef.current) {
        containerRef.current.style.display = 'none';
      }
      lenis?.start();
    } else {
      if (containerRef.current) {
        containerRef.current.style.display = 'block';
      }
    }
  }, [isForceOpened, lenis]);

  const { unlockScroll } = useLenisContext();

  // Helper to draw a specific frame onto the full-screen canvas
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!ctxRef.current || ctxRef.current.canvas !== canvas) {
      ctxRef.current = canvas.getContext('2d', { alpha: true });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If frame 0 and high-res cover is available, draw high-res cover
    if (frameIdx === 0 && coverImgRef.current && coverImgRef.current.complete) {
      const img = coverImgRef.current;
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
      return;
    }

    // Otherwise, draw from sprite sheet
    const sheetIdx = Math.floor(frameIdx / SPRITE_CONFIG.framesPerSheet);
    const slot = frameIdx % SPRITE_CONFIG.framesPerSheet;
    const col = slot % SPRITE_CONFIG.cols;
    const row = Math.floor(slot / SPRITE_CONFIG.cols);

    const sx = col * SPRITE_CONFIG.frameWidth;
    const sy = row * SPRITE_CONFIG.frameHeight;
    const sw = SPRITE_CONFIG.frameWidth;
    const sh = SPRITE_CONFIG.frameHeight;

    const sheetImg = sheetsRef.current[sheetIdx];
    if (sheetImg && sheetImg.complete) {
      const scale = Math.max(w / sw, h / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(sheetImg, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  }, []);

  // Smooth entrance choreograph for UI typography once loading finishes
  const animateTextEntrance = useCallback(() => {
    const tl = gsap.timeline();

    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' },
        0.1
      );
    }

    if (salutationRef.current) {
      tl.fromTo(
        salutationRef.current,
        { opacity: 0, y: 16 },
        { opacity: 0.9, y: 0, duration: 1.0, ease: 'power3.out' },
        0.2
      );
    }

    if (nameRef.current) {
      tl.fromTo(
        nameRef.current,
        { opacity: 0, y: 22, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 1.25, ease: 'power3.out' },
        0.3
      );
    }

    if (separatorRef.current) {
      tl.fromTo(
        separatorRef.current,
        { opacity: 0, scaleX: 0.7 },
        { opacity: 0.8, scaleX: 1, duration: 1.0, ease: 'power2.out' },
        0.42
      );
    }

    if (openButtonRef.current) {
      tl.fromTo(
        openButtonRef.current,
        { opacity: 0, scale: 0.92, y: 14 },
        { opacity: 1, scale: 1, y: 0, duration: 1.15, ease: 'back.out(1.4)' },
        0.55
      );
    }

    if (subtextRef.current) {
      tl.fromTo(
        subtextRef.current,
        { opacity: 0, y: 10 },
        { opacity: 0.7, y: 0, duration: 0.9, ease: 'power2.out' },
        0.7
      );
    }
  }, []);

  // Cinematic editorial text intro preloader with asset preloading synchronization
  useEffect(() => {
    const totalAssets = 1 + SPRITE_CONFIG.sheets.length; // 5 assets total
    let loadedAssets = 0;
    const sheets: HTMLImageElement[] = [];
    let isAssetsReady = false;
    let isIntroAnimDone = false;

    const finishIntro = () => {
      if (isLoadedRef.current) return;
      isLoadedRef.current = true;

      // Ensure frame 0 is rendered cleanly
      drawFrame(0);

      // Silky dissolve of cinematic intro overlay
      if (loaderRef.current) {
        gsap.to(loaderRef.current, {
          opacity: 0,
          scale: 1.04,
          filter: 'blur(8px)',
          duration: 0.85,
          ease: 'power2.inOut',
          onComplete: () => {
            if (loaderRef.current) loaderRef.current.style.display = 'none';
          },
        });
      }

      // Start Cover typography entrance organically as intro dissolves
      setTimeout(() => {
        animateTextEntrance();
      }, 350);
    };

    // GSAP Cinematic Storytelling Text Reveal Timeline
    const introTl = gsap.timeline({
      onComplete: () => {
        isIntroAnimDone = true;
        if (isAssetsReady) {
          finishIntro();
        }
      },
    });

    // Step 1: Smooth reveal "THE WEDDING OF"
    if (introLine1Ref.current) {
      introTl.fromTo(
        introLine1Ref.current,
        { opacity: 0, y: 16, filter: 'blur(8px)' },
        {
          opacity: 0.85,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.95,
          ease: 'power2.out',
        },
        0.25
      );
    }

    // Step 2: Smooth reveal "Dharma & Lutfhy"
    if (introLine2Ref.current) {
      introTl.fromTo(
        introLine2Ref.current,
        { opacity: 0, y: 22, filter: 'blur(10px)', scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 1.15,
          ease: 'power3.out',
        },
        1.05
      );
    }

    // Step 3: Smooth reveal Date
    if (introLine3Ref.current) {
      introTl.fromTo(
        introLine3Ref.current,
        { opacity: 0, y: 14, filter: 'blur(6px)' },
        {
          opacity: 0.75,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power2.out',
        },
        1.85
      );
    }

    // Gentle hold for high-end quiet luxury feel (~0.75s)
    introTl.to({}, { duration: 0.75 });

    const checkAssetsReady = () => {
      loadedAssets++;
      if (loadedAssets >= totalAssets) {
        isAssetsReady = true;
        if (isIntroAnimDone) {
          finishIntro();
        }
      }
    };

    // 1. High-res closed cover
    const cover = new Image();
    cover.src = SPRITE_CONFIG.coverClosed;
    cover.onload = () => {
      coverImgRef.current = cover;
      drawFrame(0);
      checkAssetsReady();
    };
    cover.onerror = checkAssetsReady;

    // 2. Sprite sheets
    SPRITE_CONFIG.sheets.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        checkAssetsReady();
      };
      img.onerror = checkAssetsReady;
      sheets[idx] = img;
    });

    sheetsRef.current = sheets;

    // Safety fallback timeout (5s max)
    const timeout = setTimeout(() => {
      isAssetsReady = true;
      if (isIntroAnimDone || !isLoadedRef.current) {
        finishIntro();
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      introTl.kill();
    };
  }, [drawFrame, animateTextEntrance]);

  // Canvas resize with devicePixelRatio support
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      drawFrame(currentFrameRef.current);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  // Envelope Opening Sequence (With post-open smokey diffusion preventing sudden brightness)
  const handleOpen = useCallback(() => {
    if (isOpened || isOpening || isPlayingRef.current || !isLoadedRef.current) return;
    isPlayingRef.current = true;
    setIsOpening(true);
    setIsOpened(true);

    if (containerRef.current) {
      containerRef.current.style.pointerEvents = 'none';
    }

    // Audio starts playing immediately
    onOpenInvitation();

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.45,
        onComplete: () => {
          unlockScroll();
          if (containerRef.current) containerRef.current.style.display = 'none';
        },
      });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        unlockScroll();
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
      },
    });

    // 1. Silky Smooth Fadeout of Header & Typography
    if (headerRef.current) {
      tl.to(
        headerRef.current,
        {
          opacity: 0,
          y: -22,
          duration: 0.6,
          ease: 'power2.out',
        },
        0
      );
    }

    if (contentRef.current) {
      tl.to(
        contentRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
        },
        0
      );
    }

    if (openButtonRef.current) {
      tl.to(
        openButtonRef.current,
        {
          opacity: 0,
          scale: 0.94,
          duration: 0.45,
          ease: 'power2.in',
        },
        0
      );
    }

    // 2. Silky Dissolve of the Dark Vignette
    if (vignetteRef.current) {
      tl.to(
        vignetteRef.current,
        {
          opacity: 0,
          duration: 0.75,
          ease: 'sine.inOut',
        },
        0
      );
    }

    // 3. Ethereal Smokey Aura / Mist Layer
    // Positioned behind the canvas, it acts as an exposure shield while flaps open,
    // and continues lingering AFTER the envelope opens so the screen doesn't suddenly flash bright!
    if (smokeRef.current) {
      // Fade in the soft smokey shield right as the envelope aperture starts widening
      tl.fromTo(
        smokeRef.current,
        { opacity: 0, scale: 0.85 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: 'power2.out',
        },
        0.35
      );

      // Dissolve the smokey veil AFTER the envelope flaps clear out (from 1.75s to 3.2s)
      tl.to(
        smokeRef.current,
        {
          opacity: 0,
          scale: 1.15,
          duration: 1.45,
          ease: 'power2.inOut',
        },
        1.75
      );
    }

    // 4. Animate Sprite Sheet Frames (0 -> 76) at smooth ~34 fps (2.25s duration)
    const animState = { frame: 0 };
    tl.to(
      animState,
      {
        frame: SPRITE_CONFIG.totalFrames - 1,
        duration: 2.25,
        ease: 'power1.inOut',
        onUpdate: () => {
          const current = Math.round(animState.frame);
          if (current !== currentFrameRef.current) {
            currentFrameRef.current = current;
            drawFrame(current);
          }
        },
      },
      0.08
    );

    // 5. Trigger WebGL fluid smoke burst on SplashCursor right as the envelope opens wide
    tl.call(() => {
      if (typeof window !== 'undefined') {
        triggerSmokeyBurst(window.innerWidth / 2, window.innerHeight / 2);
      }
    }, [], 1.45);

    // 6. Cinematic Match-Cut: Reveal Hero Section with gentle exposure bloom & de-blur from behind the dissipating smoke
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      tl.fromTo(
        heroEl,
        { filter: 'brightness(0.68) blur(10px)', scale: 1.05 },
        { filter: 'brightness(1) blur(0px)', scale: 1, duration: 1.6, ease: 'power2.out' },
        1.5
      );
    }

    // 7. Smoothly fade out the envelope canvas as the flaps exit
    if (canvasRef.current) {
      tl.to(
        canvasRef.current,
        {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        1.85
      );
    }

    // 8. Container finishes completely after the smokey veil dissolves (at 3.2s)
    tl.to({}, { duration: 0.05 }, 3.2);
  }, [isOpened, isOpening, onOpenInvitation, unlockScroll, drawFrame]);

  const coupleNames = `${groomName || 'Dharma'} & ${brideName || 'Lutfhy'}`;
  const displayDate = (dateFormatted || '12 · 12 · 2026').toUpperCase();

  return (
    <div
      ref={containerRef}
      id="cover"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleOpen();
        }
      }}
      aria-label="Klik atau sentuh layar untuk membuka undangan"
      className="fixed inset-0 z-50 overflow-hidden select-none cursor-pointer bg-transparent"
      style={{ height: '100dvh' }}
    >
      {/* ============================================================== */}
      {/* 0. CINEMATIC EDITORIAL TEXT INTRO (No Progress Bar)            */}
      {/* ============================================================== */}
      <div
        ref={loaderRef}
        className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#070e18] text-white pointer-events-auto overflow-hidden select-none"
      >
        {/* Soft Ambient Cinematic Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(28, 48, 78, 0.5) 0%, rgba(10, 18, 30, 0.95) 75%, #070e18 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-lg text-center px-6">
          {/* Step 1: THE WEDDING OF */}
          <div
            ref={introLine1Ref}
            style={{ opacity: 0 }}
            className="label-eyebrow tracking-[0.38em] text-white/75 text-[11px] sm:text-xs font-mono uppercase mb-3 transform-gpu drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          >
            THE WEDDING OF
          </div>

          {/* Step 2: Dharma & Lutfhy */}
          <h2
            ref={introLine2Ref}
            style={{ opacity: 0 }}
            className="font-serif italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-normal tracking-tight my-2 drop-shadow-[0_3px_20px_rgba(255,255,255,0.25)] transform-gpu"
          >
            {coupleNames}
          </h2>

          {/* Step 3: Date */}
          <div
            ref={introLine3Ref}
            style={{ opacity: 0 }}
            className="label-eyebrow tracking-[0.28em] text-[#E8EFF8]/70 text-[10px] sm:text-[11px] font-mono uppercase mt-4 transform-gpu drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          >
            {displayDate}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. ETHEREAL SMOKEY AURA & EXPOSURE SHIELD (BEHIND CANVAS)      */}
      {/* Softens Hero light when opening so it doesn't flash bright,     */}
      {/* then softly dissolves AFTER the envelope flaps clear away!      */}
      {/* ============================================================== */}
      <div
        ref={smokeRef}
        className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-0 overflow-hidden"
      >
        {/* Ambient Exposure Dimmer (Prevents sudden bright flash) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(16, 30, 48, 0.52) 0%, rgba(10, 20, 34, 0.78) 65%, rgba(6, 14, 24, 0.9) 100%)',
          }}
        />

        {/* Primary Luminous Smokey Mist Cloud */}
        <div
          className="w-[125vw] h-[125vw] max-w-[920px] max-h-[920px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(230, 242, 255, 0.75) 0%, rgba(195, 222, 248, 0.38) 35%, rgba(15, 28, 45, 0.22) 65%, transparent 85%)',
            filter: 'blur(36px)',
          }}
        />

        {/* Secondary Floating Ethereal Mist Wisps */}
        <div
          className="absolute w-[85vw] h-[85vw] max-w-[650px] max-h-[650px] rounded-full pointer-events-none animate-pulse"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255, 255, 255, 0.55) 0%, rgba(210, 232, 255, 0.25) 45%, transparent 75%)',
            filter: 'blur(45px)',
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. FULL-SCREEN SPRITE SHEET CANVAS (ENVELOPE OPENING)          */}
      {/* Flaps open to reveal the smokey aura layer underneath          */}
      {/* ============================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none z-20"
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* ============================================================== */}
      {/* 3. PREMIUM GRADIENT SHADE & VIGNETTE (SEPARATION FROM BG)      */}
      {/* Dissolves silky-smooth when opening sequence begins            */}
      {/* ============================================================== */}
      <div
        ref={vignetteRef}
        className="absolute inset-0 z-25 pointer-events-none"
      >
        {/* Subtle Radial Vignette across entire viewport */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(12, 24, 38, 0.08) 0%, rgba(8, 16, 28, 0.38) 70%, rgba(5, 12, 20, 0.55) 100%)',
          }}
        />

        {/* Top Vignette Shade for Header */}
        <div
          className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5, 14, 25, 0.6) 0%, rgba(5, 14, 25, 0.25) 55%, transparent 100%)',
          }}
        />

        {/* Bottom Vignette Shade for Recipient & CTA Button */}
        <div
          className="absolute bottom-0 left-0 right-0 h-80 sm:h-96 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(5, 14, 25, 0.72) 0%, rgba(5, 14, 25, 0.42) 50%, rgba(5, 14, 25, 0.12) 80%, transparent 100%)',
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 4. EDITORIAL UI TYPOGRAPHY & CTA (STAGGERED SMOOTH ENTRANCE)   */}
      {/* ============================================================== */}
      {(() => {
        const coupleNames = `${groomName || 'Dharma'} & ${brideName || 'Lutfhy'}`;
        const displayHeadline = headline || badge || 'We invite you to celebrate our wedding';

        const displayGreeting = salutation
          ? (salutation.toUpperCase().startsWith('KEPADA') || salutation.toUpperCase().startsWith('DEAR')
              ? salutation.toUpperCase()
              : `KEPADA YTH. ${salutation.toUpperCase()}`)
          : (guestGreetingLabel ? guestGreetingLabel.toUpperCase().replace(/:$/, '') : 'KEPADA YTH. BAPAK / IBU / TAMU UNDANGAN');

        return (
          <div
            ref={uiOverlayRef}
            className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none"
          >
            {/* TOP HEADER */}
            <header
              ref={headerRef}
              style={{ opacity: 0 }}
              className="relative z-30 pt-7 sm:pt-10 px-6 sm:px-12 max-w-4xl mx-auto w-full flex flex-col items-center text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
            >
              <span className="label-eyebrow tracking-[0.28em] text-white/80 text-[10px] sm:text-[11px] font-mono uppercase mb-1 drop-shadow-sm">
                {displayHeadline}
              </span>
              <h2 className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-white font-normal tracking-tight drop-shadow-md">
                {coupleNames}
              </h2>
            </header>

            {/* BOTTOM RECIPIENT INFO & MINIMALIST CTA BUTTON */}
            <div
              ref={contentRef}
              className="relative z-30 pb-10 sm:pb-14 px-6 w-full max-w-md mx-auto flex flex-col items-center text-center mt-auto"
            >
              {/* Eyebrow salutation */}
              <span
                ref={salutationRef}
                style={{ opacity: 0 }}
                className="label-eyebrow tracking-[0.24em] text-[#E8EFF8]/85 text-[10px] sm:text-[11px] font-medium mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] uppercase"
              >
                {displayGreeting}
              </span>

              {/* Guest Name */}
              <h1
                ref={nameRef}
                style={{ opacity: 0 }}
                className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-normal tracking-tight mb-5 leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]"
              >
                {guestName}
              </h1>

              {/* Minimalist CTA Button */}
              <button
                ref={openButtonRef}
                style={{ opacity: 0 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen();
                }}
                className="pointer-events-auto group relative flex items-center gap-2.5 bg-white/95 hover:bg-white text-[#0F1B2D] px-7 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_6px_25px_rgba(0,0,0,0.35)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Buka Undangan Pernikahan"
              >
                <span>{openButtonLabel || 'Buka Undangan'}</span>
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
