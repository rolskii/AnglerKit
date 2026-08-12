import React, { useEffect, useRef, useState } from 'react';
import { Radio, X, Search, MapPin, Heart, Play, Loader2, AudioLines } from 'lucide-react';
import { LOCATION_TAGS } from '@/hooks/useRadioPlayer';

const GREEN = '#1E8457';
const LIGHT_GREEN = '#E5F0E9';
const CORAL = '#FF6B6B';

export default function RadioPanel({ open, onClose, player }) {
  const {
    current, playing, loading, error, saved, results, searching, activeQuery,
    play, toggle, isSaved, toggleSave, search, searchByTag, loadDefaults,
  } = player;
  const [term, setTerm] = useState('');
  const listRef = useRef(null);

  // Load popular stations the first time the panel opens.
  useEffect(() => {
    if (open && results.length === 0 && !searching) loadDefaults();
  }, [open]); // eslint-disable-line

  if (!open) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    search(term);
  };

  const StationRow = ({ station }) => {
    const isCurrent = current?.id === station.id;
    const savedFlag = isSaved(station);
    return (
      <div
        onClick={() => (isCurrent ? toggle() : play(station))}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
        style={isCurrent ? { backgroundColor: LIGHT_GREEN } : undefined}
      >
        <div
          className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: isCurrent ? GREEN : '#F1F1EF' }}
        >
          {station.favicon ? (
            <img src={station.favicon} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <Radio className="w-4 h-4" style={{ color: isCurrent ? '#fff' : GREEN }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{station.name}</p>
          {station.location && <p className="text-xs text-muted-foreground truncate">{station.location}</p>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleSave(station); }}
          className="p-1.5 shrink-0"
          aria-label={savedFlag ? 'Remove from saved' : 'Save station'}
        >
          <Heart className="w-[18px] h-[18px]" style={{ color: savedFlag ? CORAL : '#9CA3AF' }} fill={savedFlag ? CORAL : 'none'} />
        </button>
        <div className="w-6 shrink-0 flex justify-center">
          {isCurrent && loading ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: GREEN }} />
          ) : isCurrent && playing ? (
            <AudioLines className="w-4 h-4" style={{ color: GREEN }} />
          ) : (
            <Play className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[3500] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Radio className="w-5 h-5" style={{ color: GREEN }} />
          <h2 className="flex-1 font-heading font-bold text-base tracking-wide" style={{ color: GREEN }}>RADIO GARDEN</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-muted border border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Toronto"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-full text-white text-sm font-semibold shrink-0 disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            Go
          </button>
        </form>

        {/* Location tags */}
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {LOCATION_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => searchByTag(tag.q)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeQuery === tag.q ? LIGHT_GREEN : '#F4F4F2',
                color: activeQuery === tag.q ? GREEN : '#4B5563',
              }}
            >
              <MapPin className="w-3 h-3" />
              {tag.label}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {/* Saved */}
          <section>
            <h3 className="px-1 pt-2 pb-1 text-[11px] font-bold tracking-widest text-muted-foreground">SAVED</h3>
            {saved.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">Tap the heart on a station to save it here.</p>
            ) : (
              saved.map((s) => <StationRow key={s.id} station={s} />)
            )}
          </section>

          {/* Search results */}
          <section>
            <h3 className="px-1 pt-1 pb-1 text-[11px] font-bold tracking-widest text-muted-foreground">
              {activeQuery ? `RESULTS · ${activeQuery.toUpperCase()}` : 'POPULAR STATIONS'}
            </h3>
            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: GREEN }} />
              </div>
            )}
            {!searching && results.length === 0 && (
              <p className="px-1 py-2 text-xs text-muted-foreground">No stations found. Try another search.</p>
            )}
            {!searching && results.map((s) => <StationRow key={s.id} station={s} />)}
          </section>

          {error && (
            <p className="text-xs text-destructive text-center px-4 py-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}