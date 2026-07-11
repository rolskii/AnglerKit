/* global mapkit */
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Check, Star } from 'lucide-react';
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

export default function LocationMapPicker({ open, onOpenChange, initialCoords, savedLocations = [], onSelect }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [markerPos, setMarkerPos] = useState(
    initialCoords ? [initialCoords.lat, initialCoords.lon] : [43.6532, -79.3832]
  );
  const [placeName, setPlaceName] = useState(initialCoords?.name || '');
  const [mapLoading, setMapLoading] = useState(false);
  const [localSavedLocations, setLocalSavedLocations] = useState(savedLocations);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const skipReverseGeocodeRef = useRef(false);
  const savedAnnotationsRef = useRef([]);
  const searchRef = useRef(null);
  const lastAutocompleteResultsRef = useRef([]);

  useEffect(() => {
    const syncSaved = () => {
      const stored = localStorage.getItem('moonSavedLocations');
      setLocalSavedLocations(stored ? JSON.parse(stored) : []);
    };
    window.addEventListener('moonSavedLocationsChanged', syncSaved);
    return () => window.removeEventListener('moonSavedLocationsChanged', syncSaved);
  }, []);

  useEffect(() => {
    if (open) {
      setMarkerPos(initialCoords ? [initialCoords.lat, initialCoords.lon] : [43.6532, -79.3832]);
      setPlaceName(initialCoords?.name || '');
      setSearchValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      const stored = localStorage.getItem('moonSavedLocations');
      setLocalSavedLocations(stored ? JSON.parse(stored) : []);
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

        // Create MapKit JS search instance for location-biased autocomplete
        searchRef.current = new mapkit.Search({ region: map.region });

        // Ensure placeName is set (in case region-change-end doesn't fire on init)
        if (!placeName) {
          const initName = await reverseGeocode(markerPos[0], markerPos[1]);
          if (!cancelled) {
            const fallback = initName || `${markerPos[0].toFixed(2)}, ${markerPos[1].toFixed(2)}`;
            setPlaceName(fallback);
            setSearchValue(fallback);
          }
        }

        // Add saved location markers (star annotations) — read fresh from localStorage
        const storedLocs = localStorage.getItem('moonSavedLocations');
        const freshSaved = storedLocs ? JSON.parse(storedLocs) : [];
        if (freshSaved && freshSaved.length > 0) {
          const annotations = freshSaved.map((loc) => {
            const coord = new mapkit.Coordinate(loc.lat, loc.lon);
            const annotation = new mapkit.MarkerAnnotation(coord, {
              title: loc.name,
              subtitle: 'Saved location',
              color: '#f59e0b',
              glyphImage: { 1: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
            });
            annotation.addEventListener('select', () => {
              if (cancelled) return;
              skipReverseGeocodeRef.current = true;
              setMarkerPos([loc.lat, loc.lon]);
              setPlaceName(loc.name);
              setSearchValue(loc.name);
              map.setCenterAnimated(coord);
            });
            return annotation;
          });
          map.addAnnotations(annotations);
          savedAnnotationsRef.current = annotations;
        }

        map.addEventListener('region-change-end', async () => {
          if (cancelled) return;
          const c = map.center;
          setMarkerPos([c.latitude, c.longitude]);
          if (searchRef.current) searchRef.current.region = map.region;
          if (skipReverseGeocodeRef.current) {
            skipReverseGeocodeRef.current = false;
            return;
          }
          const name = await reverseGeocode(c.latitude, c.longitude);
          if (!cancelled) {
            const finalName = name || `${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)}`;
            setPlaceName(finalName);
            setSearchValue(finalName);
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
      savedAnnotationsRef.current = [];
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
    debounceRef.current = setTimeout(() => {
      if (!searchRef.current) { setSuggestions([]); return; }
      searchRef.current.autocomplete(value, (err, data) => {
        if (err || !data || !data.results) { setSuggestions([]); return; }
        lastAutocompleteResultsRef.current = data.results;
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
    // Pass the SearchAutocompleteResult object directly to search() for full place details
    searchRef.current.search(s.autocompleteResult, (err, data) => {
      if (err || !data || !data.places || !data.places[0]) return;
      const place = data.places[0];
      if (!place.coordinate) return;
      skipReverseGeocodeRef.current = true;
      setMarkerPos([place.coordinate.latitude, place.coordinate.longitude]);
      setPlaceName(s.name);
      if (mapRef.current) {
        mapRef.current.setCenterAnimated(place.coordinate);
      }
    });
  };

  const handleConfirm = () => {
    onSelect(placeName || 'Selected location', markerPos[0], markerPos[1]);
    onOpenChange(false);
  };

  const isCurrentSaved = () => {
    return localSavedLocations.some(loc =>
      loc.name === placeName ||
      (Math.abs(loc.lat - markerPos[0]) < 0.001 && Math.abs(loc.lon - markerPos[1]) < 0.001)
    );
  };

  const toggleSaveCurrent = () => {
    if (!placeName) return;
    const stored = localStorage.getItem('moonSavedLocations');
    const current = stored ? JSON.parse(stored) : [];
    let updated;
    const isMatch = (loc) =>
      loc.name === placeName ||
      (Math.abs(loc.lat - markerPos[0]) < 0.001 && Math.abs(loc.lon - markerPos[1]) < 0.001);
    if (current.some(isMatch)) {
      updated = current.filter(loc => !isMatch(loc));
    } else {
      updated = [...current, { name: placeName, lat: markerPos[0], lon: markerPos[1] }];
    }
    localStorage.setItem('moonSavedLocations', JSON.stringify(updated));
    setLocalSavedLocations(updated);
    window.dispatchEvent(new Event('moonSavedLocationsChanged'));
  };

  const handleSelectSaved = (loc) => {
    skipReverseGeocodeRef.current = true;
    setMarkerPos([loc.lat, loc.lon]);
    setPlaceName(loc.name);
    setSearchValue(loc.name);
    if (mapRef.current) {
      mapRef.current.setCenterAnimated(new mapkit.Coordinate(loc.lat, loc.lon));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Choose Location</DialogTitle>
        </DialogHeader>

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

        {/* Search bar */}
        <div className="px-4 py-2 relative">
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

        {/* Confirm button + Save */}
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-border">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {placeName || 'Drag the map to pick a spot'}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSaveCurrent}
              disabled={!placeName}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                isCurrentSaved()
                  ? 'text-amber-500 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-muted-foreground border-border hover:text-amber-500 hover:border-amber-500/40'
              } disabled:opacity-40 disabled:pointer-events-none`}
              title={isCurrentSaved() ? 'Remove from saved' : 'Save this location'}
            >
              <Star className="w-4 h-4" fill={isCurrentSaved() ? 'currentColor' : 'none'} />
              {isCurrentSaved() ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" /> Use
            </button>
          </div>
        </div>

        {/* Saved locations list */}
        {localSavedLocations.length > 0 && (
          <div className="px-4 pb-3 border-t border-border pt-2">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wide mb-1.5">SAVED LOCATIONS</p>
            <div className="flex gap-1.5 flex-wrap">
              {localSavedLocations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleSelectSaved(loc)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                    loc.name === placeName
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/20 hover:text-primary'
                  }`}
                >
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}