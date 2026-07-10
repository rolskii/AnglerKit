/* global mapkit */
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Check } from 'lucide-react';
import { searchLocations } from '@/lib/geocode';
import { base44 } from '@/api/base44Client';

// Reverse geocode using BigDataCloud free API
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();
    const parts = [data.city || data.locality || data.principalSubdivision, data.countryCode].filter(Boolean);
    return parts.join(', ');
  } catch (e) {
    return null;
  }
};

// Load MapKit JS script once
let mapkitLoaded = false;
let mapkitLoadPromise = null;

function loadMapKit() {
  if (mapkitLoaded) return Promise.resolve();
  if (mapkitLoadPromise) return mapkitLoadPromise;

  mapkitLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.onload = () => { mapkitLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load MapKit JS'));
    document.head.appendChild(script);
  });
  return mapkitLoadPromise;
}

// Track mapkit.init — should only be called once
let mapkitInitialized = false;

function ensureMapKitInit() {
  if (mapkitInitialized) return;
  mapkit.init({
    authorizationCallback: (done) => {
      const origin = window.location.hostname || '*';
      base44.functions.invoke('applemaps', { mode: 'mapkit_token', origin })
        .then((res) => done(res.data.token))
        .catch((err) => console.error('MapKit token fetch failed:', err));
    },
  });
  mapkitInitialized = true;
}

export default function LocationMapPicker({ open, onOpenChange, initialCoords, onSelect }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [markerPos, setMarkerPos] = useState(
    initialCoords ? [initialCoords.lat, initialCoords.lon] : [43.6532, -79.3832]
  );
  const [placeName, setPlaceName] = useState(initialCoords?.name || '');
  const [mapLoading, setMapLoading] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const skipReverseGeocodeRef = useRef(false);

  useEffect(() => {
    if (open) {
      setMarkerPos(initialCoords ? [initialCoords.lat, initialCoords.lon] : [43.6532, -79.3832]);
      setPlaceName(initialCoords?.name || '');
      setSearchValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, initialCoords]);

  // Initialize MapKit JS map when dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setMapLoading(true);

    const initMap = async () => {
      try {
        await loadMapKit();
        if (cancelled) return;

        ensureMapKitInit();

        // Wait a frame for the dialog container to be laid out
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled || !mapContainerRef.current) return;

        const center = new mapkit.Coordinate(markerPos[0], markerPos[1]);
        const map = new mapkit.Map(mapContainerRef.current, {
          center,
          cameraDistance: 80000,
          mapType: mapkit.Map.MapTypes.Hybrid,
        });

        mapRef.current = map;

        map.addEventListener('region-change-end', async () => {
          if (cancelled) return;
          const c = map.center;
          setMarkerPos([c.latitude, c.longitude]);
          if (skipReverseGeocodeRef.current) {
            skipReverseGeocodeRef.current = false;
            return;
          }
          const name = await reverseGeocode(c.latitude, c.longitude);
          if (name && !cancelled) {
            setPlaceName(name);
            setSearchValue(name);
          }
        });

        setMapLoading(false);
      } catch (e) {
        console.error('MapKit init failed:', e);
        setMapLoading(false);
      }
    };

    // Small delay to ensure dialog portal DOM is ready
    const timer = setTimeout(initMap, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        try { mapRef.current.destroy(); } catch (e) {}
        mapRef.current = null;
      }
    };
  }, [open]);

  const handleSearchInput = (value) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(value, 5);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (e) {
        setSuggestions([]);
      }
    }, 300);
  };

  const selectSuggestion = (s) => {
    skipReverseGeocodeRef.current = true;
    setMarkerPos([s.lat, s.lon]);
    setPlaceName(s.name);
    setSearchValue(s.name);
    setShowSuggestions(false);
    if (mapRef.current) {
      mapRef.current.setCenterAnimated(new mapkit.Coordinate(s.lat, s.lon));
    }
  };

  const handleConfirm = () => {
    onSelect(placeName || 'Selected location', markerPos[0], markerPos[1]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Choose Location</DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-4 pb-2 relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={searchValue}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              placeholder="Search city or pan the map..."
              className="text-sm bg-transparent flex-1 outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-[5000] left-4 right-4 mt-1 max-h-48 overflow-y-auto bg-popover rounded-lg shadow-lg border border-border">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 truncate flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative h-[300px] w-full bg-muted">
          <div ref={mapContainerRef} className="h-full w-full" />
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          )}
          {/* Center pin overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 -mt-8 text-primary drop-shadow-lg">
              <MapPin className="w-8 h-8" fill="currentColor" />
            </div>
          </div>
          {/* Hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] whitespace-nowrap">
            Drag map to set location
          </div>
        </div>

        {/* Confirm button */}
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-border">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {placeName || 'Drag the map to pick a spot'}
          </p>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Check className="w-4 h-4" /> Use
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}