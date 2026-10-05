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
      lerp: 0.1,
      syncTouch: false, // native touch scrolling on mobile
    });

    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    // Initial state: stop scroll if locked until cover opened
    if (initiallyLocked) {
      lenis.stop();
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
