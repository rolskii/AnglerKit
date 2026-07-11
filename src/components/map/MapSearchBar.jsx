import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';

/* global mapkit */

export default function MapSearchBar({ mapRef, mapReady }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.mapkit) return;
    searchRef.current = new mapkit.Search({ region: mapRef.current.region });
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !searchRef.current) return;
    const map = mapRef.current;
    const handler = () => {
      if (searchRef.current) searchRef.current.region = map.region;
    };
    map.addEventListener('region-change-end', handler);
    return () => map.removeEventListener('region-change-end', handler);
  }, [mapReady]);

  const handleInput = (value) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (!searchRef.current) { setSuggestions([]); return; }
      searchRef.current.autocomplete(value, (err, data) => {
        if (err || !data || !data.results) { setSuggestions([]); return; }
        const results = data.results.map(r => {
          const lines = r.displayLines || [];
          const name = lines.join(', ') || r.name || 'Unknown';
          return { name, autocompleteResult: r };
        }).filter(r => r.name && r.name !== 'Unknown');
        setSuggestions(results);
        setShowSuggestions(true);
      });
    }, 300);
  };

  const selectSuggestion = (s) => {
    setShowSuggestions(false);
    setSearchValue(s.name);
    if (!searchRef.current || !s.autocompleteResult) return;
    searchRef.current.search(s.autocompleteResult, (err, data) => {
      if (err || !data || !data.places || !data.places[0]) return;
      const place = data.places[0];
      if (!place.coordinate) return;
      if (mapRef.current) {
        mapRef.current.setCenterAnimated(place.coordinate);
      }
    });
  };

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/80">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={searchValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search location..."
          className="text-sm bg-transparent flex-1 outline-none placeholder:text-muted-foreground/50"
        />
        {searchValue && (
          <button onClick={() => { setSearchValue(''); setSuggestions([]); setShowSuggestions(false); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-popover rounded-xl shadow-lg border border-border z-[6000]">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 truncate flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}