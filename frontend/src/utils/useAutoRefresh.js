import { useEffect, useRef } from 'react';

/**
 * Refetch when the app/tab becomes visible again (e.g. PWA resume).
 * Throttled to avoid repeated API calls. No background polling.
 */
export function useRefreshOnResume(refetch, { minGapMs = 30000, enabled = true } = {}) {
  const refetchRef = useRef(refetch);
  const lastRunRef = useRef(0);
  const inFlightRef = useRef(false);

  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled) return;

    const run = async () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastRunRef.current < minGapMs) return;
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      lastRunRef.current = now;

      try {
        await refetchRef.current?.({ silent: true });
      } finally {
        inFlightRef.current = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        run();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, minGapMs]);
}

/** @deprecated Use useRefreshOnResume — kept as alias for existing imports */
export function useAutoRefresh(refetch, options = {}) {
  useRefreshOnResume(refetch, options);
}
