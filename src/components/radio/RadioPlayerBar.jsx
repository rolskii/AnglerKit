import React from 'react';
import { Radio, Loader2, Play, Pause, Volume2, VolumeX, X } from 'lucide-react';

const GREEN = '#1B754A';

/**
 * Floating pill player bar shown when a station is loaded.
 */
export default function RadioPlayerBar({ player }) {
  const { current, playing, loading, muted, toggle, toggleMute, stop } = player;
  if (!current) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[3400] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border border-border" style={{ backgroundColor: '#F7F7F5' }}>
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white"
          style={{ backgroundColor: GREEN }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : playing ? (
            <Pause className="w-4 h-4" fill="currentColor" />
          ) : (
            <Play className="w-4 h-4" fill="currentColor" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{current.name}</p>
          {current.location && <p className="text-[10px] text-muted-foreground truncate">{current.location}</p>}
        </div>
        <button onClick={toggleMute} className="p-1.5 shrink-0 text-muted-foreground" aria-label="Mute">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button onClick={stop} className="p-1.5 shrink-0 text-muted-foreground" aria-label="Stop">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}