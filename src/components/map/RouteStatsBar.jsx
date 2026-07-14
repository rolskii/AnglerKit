import React from 'react';
import { formatDistance, isImperial } from '@/lib/sphericalArea';

export default function RouteStatsBar({ isTracking, isPaused, trackPoints, distanceKm, durationSec }) {
  if (!isTracking && !isPaused && trackPoints.length === 0) return null;

  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-3 left-3 z-[500] flex gap-2">
      <div className="px-3 py-2 rounded-xl bg-background/90 backdrop-blur-xl border border-border shadow-lg">
        <div className="flex items-center gap-2">
          {(isTracking || isPaused) && (
            <span className={`w-2 h-2 rounded-full ${isTracking && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
          )}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-foreground">{formatDistance(distanceKm, isImperial())}</span>
              <span className="text-muted-foreground">{formatDuration(durationSec)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{trackPoints.length} points</span>
          </div>
        </div>
      </div>
    </div>
  );
}