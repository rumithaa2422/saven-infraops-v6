/**
 * useKeyPress Hook
 * Enterprise Design System V2
 */

import { useEffect } from 'react';

type KeyPredicate = (event: KeyboardEvent) => boolean;
type KeyFilter = string | string[] | KeyPredicate;

/**
 * useKeyPress - respond to keyboard events
 */
export function useKeyPress(
  keyFilter: KeyFilter,
  callback: (event: KeyboardEvent) => void,
  options?: { event?: 'keydown' | 'keyup' }
) {
  const event = options?.event || 'keydown';

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      let isMatch = false;

      if (typeof keyFilter === 'string') {
        isMatch = event.key === keyFilter;
      } else if (Array.isArray(keyFilter)) {
        isMatch = keyFilter.includes(event.key);
      } else if (typeof keyFilter === 'function') {
        isMatch = keyFilter(event);
      }

      if (isMatch) {
        callback(event);
      }
    };

    document.addEventListener(event, handler);
    return () => document.removeEventListener(event, handler);
  }, [keyFilter, callback, event]);
}

export default useKeyPress;
