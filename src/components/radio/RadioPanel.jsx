import React, { useEffect, useRef, useState } from 'react';
import { Radio, X, Search, Heart, Loader2 } from 'lucide-react';
import { LOCATION_TAGS } from '@/hooks/useRadioPlayer';

const GREEN = '#1B754A';
const CORAL = '#FF3B30';
const INACTIVE_HEART = '#C7C7CC';
const CLOSE_GREY = '#333333';
const TITLE_GREY = '#333333';
const TAG_BG = '#F0F0F0';
const TAG_TEXT = '#333333';
const SUBTEXT_GREY = '#777777';
const ROW_BORDER = '#EFEFEF';

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
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
        style={{ borderBottom: `1px solid ${ROW_BORDER}` }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#333333' }}>{station.name}</p>
          {station.location && <p className="text-xs truncate" style={{ color: SUBTEXT_GREY }}>{station.location}</p>}
        </div>
        {isCurrent && loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: GREEN }} />}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleSave(station); }}
          className="p-1 shrink-0"
          aria-label={savedFlag ? 'Remove from saved' : 'Save station'}
        >
          <Heart className="w-[18px] h-[18px]" style={{ color: savedFlag ? CORAL : INACTIVE_HEART }} fill={savedFlag ? CORAL : 'none'} />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border/60">
          <Radio className="w-5 h-5" style={{ color: TITLE_GREY }} strokeWidth={2.2} />
          <h2 className="flex-1 font-heading font-bold text-base tracking-wide" style={{ color: TITLE_GREY }}>RADIO GARDEN</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Close">
            <X className="w-5 h-5" style={{ color: CLOSE_GREY }} />
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
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {LOCATION_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => searchByTag(tag.q)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeQuery === tag.q ? '#E5F0E9' : TAG_BG,
                color: activeQuery === tag.q ? GREEN : TAG_TEXT,
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div ref={listRef} className="flex-1 overflow-y-auto pb-2">
          {/* Saved */}
          <section className="px-1">
            <h3 className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-widest" style={{ color: SUBTEXT_GREY }}>SAVED</h3>
            {saved.length === 0 ? (
              <p className="px-4 py-2 text-xs" style={{ color: SUBTEXT_GREY }}>Tap the heart on a station to save it here.</p>
            ) : (
              saved.map((s) => <StationRow key={s.id} station={s} />)
            )}
          </section>

          {/* Search results */}
          <section className="px-1">
            <h3 className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-widest" style={{ color: SUBTEXT_GREY }}>
              {activeQuery ? `RESULTS · ${activeQuery.toUpperCase()}` : 'POPULAR STATIONS'}
            </h3>
            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: GREEN }} />
              </div>
            )}
            {!searching && results.length === 0 && (
              <p className="px-4 py-2 text-xs" style={{ color: SUBTEXT_GREY }}>No stations found. Try another search.</p>
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