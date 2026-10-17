import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Disable automatic mobile browser scroll restoration so page transitions always start at top
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  try {
    window.history.scrollRestoration = 'manual';
  } catch (e) { /* ignore */ }
}

// Temporarily disable smooth scrolling during route transitions
function disableSmoothScroll() {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  return () => { html.style.scrollBehavior = prev; };
}

function forceScrollTop() {
  try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }); } catch (_) {}
  try { window.scrollTo(0, 0); } catch (_) {}
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  // Also reset any scrollable root element
  const root = document.getElementById('root');
  if (root) root.scrollTop = 0;
}

export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Run synchronously before paint
  useLayoutEffect(() => {
    if (hash) return; // Let hash links handle themselves
    const restore = disableSmoothScroll();
    forceScrollTop();
    restore();
  }, [pathname, search, hash]);

  useEffect(() => {
    if (hash) {
      // Handle anchor links
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }

    // Clear any previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const restore = disableSmoothScroll();
    forceScrollTop();

    // Multi-tier fallback: mobile browsers restore scroll asynchronously
    const t1 = setTimeout(() => { forceScrollTop(); }, 50);
    const t2 = setTimeout(() => { forceScrollTop(); }, 150);
    const t3 = setTimeout(() => { forceScrollTop(); restore(); }, 300);

    timersRef.current = [t1, t2, t3];

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
