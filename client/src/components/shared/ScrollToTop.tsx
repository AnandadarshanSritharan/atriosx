import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Disable automatic mobile browser scroll restoration so page transitions always start at top
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  try {
    window.history.scrollRestoration = 'manual';
  } catch (e) {
    // Ignore in unsupported environments
  }
}

export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  const resetScroll = () => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Reset all possible scroll targets across mobile and desktop browsers
    try {
      window.scrollTo(0, 0);
    } catch (e) {}

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  };

  // Run before paint
  useLayoutEffect(() => {
    resetScroll();
  }, [pathname, search, hash]);

  // Run after paint + safety timers to defeat mobile browser async scroll restoration
  useEffect(() => {
    resetScroll();

    const frameId = requestAnimationFrame(resetScroll);
    const timer1 = setTimeout(resetScroll, 20);
    const timer2 = setTimeout(resetScroll, 80);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
