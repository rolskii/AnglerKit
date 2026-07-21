import { useEffect, useState } from 'react';

// Ticks a `Date` forward every `intervalMs` (default 60s). Used to drive
// live "now" markers on charts and to detect midnight day-rollover without
// needing a full data refetch.
export function useNowTick(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
