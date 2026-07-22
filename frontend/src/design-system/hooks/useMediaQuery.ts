/**
 * useMediaQuery Hook
 * Enterprise Design System V2
 */

import { useState, useEffect } from 'react';

/**
 * useMediaQuery - respond to media query changes
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * useBreakpoints - responsive breakpoints hook
 */
export function useBreakpoints() {
  const isXs = useMediaQuery('(max-width: 479px)');
  const isSm = useMediaQuery('(min-width: 480px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isLg = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isXl = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const is2xl = useMediaQuery('(min-width: 1536px)');

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile: isXs || isSm,
    isTablet: isMd,
    isDesktop: isLg || isXl || is2xl,
  };
}

export default useMediaQuery;
