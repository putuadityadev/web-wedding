'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import Lenis from 'lenis';
import { registerGSAP, gsap, ScrollTrigger } from './gsap';

interface LenisContextValue {
  lenis: Lenis | null;
  getLenis: () => Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => void;
  isUnlocked: boolean;
  unlockScroll: () => void;
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  getLenis: () => null,
  scrollTo: () => {},
  isUnlocked: false,
  unlockScroll: () => {},
});

export function useLenisContext() {
  return useContext(LenisContext);
}

export function LenisProvider({
  children,
  initiallyLocked = true,
}: {
  children: React.ReactNode;
  initiallyLocked?: boolean;
}) {
  const [isUnlocked, setIsUnlocked] = useState(!initiallyLocked);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    registerGSAP();

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.4,
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 0.9,
      syncTouch: true,
      syncTouchLerp: 0.075,
      touchInertiaExponent: 1.65,
    });

    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(500, 33);

    // Initial state: stop scroll if locked until cover opened
    if (initiallyLocked) {
      if (typeof window !== 'undefined') {
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
      }
      lenis.stop();
      lenis.scrollTo(0, { immediate: true });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      gsap.ticker.remove(tickerCb);
      lenis.destroy();
      lenisRef.current = null;
      document.body.style.overflow = '';
    };
  }, [initiallyLocked]);

  const unlockScroll = React.useCallback(() => {
    setIsUnlocked(true);
    if (lenisRef.current) {
      lenisRef.current.start();
      lenisRef.current.resize();
    }
    document.body.style.overflow = '';
    setTimeout(() => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
      ScrollTrigger.refresh();
    }, 200);
  }, []);

  const scrollTo = React.useCallback((target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => {
    lenisRef.current?.scrollTo(target, options);
  }, []);

  const value = useMemo<LenisContextValue>(() => ({
    get lenis() {
      return lenisRef.current;
    },
    getLenis: () => lenisRef.current,
    scrollTo,
    isUnlocked,
    unlockScroll,
  }), [isUnlocked, unlockScroll, scrollTo]);

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}
