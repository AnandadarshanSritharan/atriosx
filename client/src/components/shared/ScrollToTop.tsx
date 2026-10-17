import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets window scroll position to (0, 0) whenever the route changes in React Router.
 * Supports anchor hashes (#section-id) for intra-page links.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Instantly reset scroll to top so the next page always starts from the top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
