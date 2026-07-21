import { useCallback, useEffect, useRef, useState } from 'react';

// Periodically re-runs `refetchFn` in the background (default every 15 min)
// so pages like Weather/Moon/River Conditions stay current without the user
// needing to manually reload. Skips ticks while the tab/app isn't visible
// (no point re-fetching data nobody's looking at, and it saves battery/data).
// Also exposes `refresh()` so a pull-to-refresh gesture or any other manual
// trigger can share the exact same fetch logic.
export function useAutoRefresh(refetchFn, intervalMs = 15 * 60 * 1000) {
  const [refreshing, setRefreshing] = useState(false);
  const refetchRef = useRef(refetchFn);
  refetchRef.current = refetchFn;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchRef.current();
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refetchRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { refreshing, refresh };
}
