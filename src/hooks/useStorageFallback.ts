import { useEffect, useState } from 'react';
import { isFallbackActiveForKey } from '../utils/storage';

const WATCHED_KEY = 'calcnest_history_v1';
const POLL_INTERVAL_MS = 2000;

/**
 * Returns true when the app is operating on in-memory fallback storage
 * (i.e. localStorage is unavailable or quota-exceeded for the history key).
 *
 * Polls every 2 s so it reacts when the condition changes during a session.
 */
export function useStorageFallback(): boolean {
  const [isFallback, setIsFallback] = useState<boolean>(() =>
    isFallbackActiveForKey(WATCHED_KEY)
  );

  useEffect(() => {
    const check = () => {
      setIsFallback(isFallbackActiveForKey(WATCHED_KEY));
    };

    const id = setInterval(check, POLL_INTERVAL_MS);
    // Also check immediately in case state changed before mount
    check();
    return () => clearInterval(id);
  }, []);

  return isFallback;
}
