'use client';

import { useEffect, useRef } from 'react';
import { useLenisContext } from '@/lib/motion/lenis';

/**
 * ScrollSnapSync
 * Instant, zero-lag chapter scrolling for full-screen (100% DVH) sections:
 * Hero -> Quote -> Groom -> Bride -> Story (and free scroll afterwards).
 * Instantly transitions to the next section on scroll without delay or debounce.
 */
export function ScrollSnapSync() {
  const { lenis, isUnlocked } = useLenisContext();
  const isTransitioningRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;

    const getSnapSections = (): HTMLElement[] => {
      return Array.from(document.querySelectorAll<HTMLElement>('[data-snap-section="true"]'));
    };

    const getCurrentSectionIndex = (sections: HTMLElement[]): number => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      for (let i = 0; i < sections.length; i++) {
        const top = sections[i].offsetTop;
        const bottom = top + sections[i].offsetHeight;
        if (y >= top - 25 && y < bottom - vh * 0.4) {
          return i;
        }
      }
      if (y < sections[0].offsetTop) return 0;
      if (y >= sections[sections.length - 1].offsetTop - 25) return sections.length - 1;
      return 0;
    };

    const navigateToSection = (targetSec: HTMLElement, callback?: () => void) => {
      isTransitioningRef.current = true;
      const targetTop = targetSec.offsetTop;

      if (lenis) {
        lenis.scrollTo(targetTop, {
          duration: 0.82,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          onComplete: () => {
            setTimeout(() => {
              isTransitioningRef.current = false;
              callback?.();
            }, 60);
          },
        });
      } else {
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isTransitioningRef.current = false;
          callback?.();
        }, 700);
      }
    };

    const onWheel = (e: WheelEvent) => {
      // If actively animating, prevent further wheel triggers
      if (isTransitioningRef.current) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 16) return;

      const sections = getSnapSections();
      if (sections.length === 0) return;

      const y = window.scrollY;
      const lastSnapSec = sections[sections.length - 1];
      const lastSnapBottom = lastSnapSec.offsetTop + lastSnapSec.offsetHeight;

      // If user is deep down in Story / Event / Gallery (beyond chapter snaps)
      if (y > lastSnapBottom + 15) {
        // Allow completely free normal scrolling!
        // If scrolling UP and entering the border of Bride, catch and snap smoothly:
        if (e.deltaY < -20 && y <= lastSnapBottom + 80) {
          e.preventDefault();
          navigateToSection(lastSnapSec);
        }
        return;
      }

      const currentIdx = getCurrentSectionIndex(sections);

      if (e.deltaY > 0) {
        // SCROLL DOWN: Instantly glide to next section without hesitation
        if (currentIdx < sections.length - 1) {
          e.preventDefault();
          navigateToSection(sections[currentIdx + 1]);
        } else if (currentIdx === sections.length - 1) {
          // At Bride scrolling down: transition smoothly to Story
          const storyEl = document.getElementById('story');
          if (storyEl) {
            e.preventDefault();
            navigateToSection(storyEl);
          }
        }
      } else if (e.deltaY < 0) {
        // SCROLL UP: Instantly glide to previous section
        if (currentIdx > 0) {
          e.preventDefault();
          navigateToSection(sections[currentIdx - 1]);
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null || isTransitioningRef.current) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      // Responsive touch threshold
      if (Math.abs(deltaY) < 32) return;

      const sections = getSnapSections();
      if (sections.length === 0) return;

      const y = window.scrollY;
      const lastSnapSec = sections[sections.length - 1];
      const lastSnapBottom = lastSnapSec.offsetTop + lastSnapSec.offsetHeight;

      // Past Bride: free scrolling
      if (y > lastSnapBottom + 15) {
        if (deltaY < -32 && y <= lastSnapBottom + 80) {
          touchStartYRef.current = null;
          navigateToSection(lastSnapSec);
        }
        return;
      }

      const currentIdx = getCurrentSectionIndex(sections);

      if (deltaY > 0) {
        // Swipe UP / Scroll DOWN: immediately glide to next section
        if (currentIdx < sections.length - 1) {
          touchStartYRef.current = null;
          navigateToSection(sections[currentIdx + 1]);
        } else if (currentIdx === sections.length - 1) {
          const storyEl = document.getElementById('story');
          if (storyEl) {
            touchStartYRef.current = null;
            navigateToSection(storyEl);
          }
        }
      } else if (deltaY < 0) {
        // Swipe DOWN / Scroll UP: immediately glide to previous section
        if (currentIdx > 0) {
          touchStartYRef.current = null;
          navigateToSection(sections[currentIdx - 1]);
        }
      }
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    // Keyboard Arrow navigation for full-screen chapters
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        const sections = getSnapSections();
        const currentIdx = getCurrentSectionIndex(sections);
        if (currentIdx < sections.length - 1) {
          e.preventDefault();
          navigateToSection(sections[currentIdx + 1]);
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        const sections = getSnapSections();
        const currentIdx = getCurrentSectionIndex(sections);
        if (currentIdx > 0 && currentIdx < sections.length) {
          e.preventDefault();
          navigateToSection(sections[currentIdx - 1]);
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lenis, isUnlocked]);

  return null;
}
