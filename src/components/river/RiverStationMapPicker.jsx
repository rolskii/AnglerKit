/* global mapkit */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Check, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { prepareMapKit } from '@/lib/mapkitLoader';

// Module-level cache — the full ~1800-station list doesn't change during a
// session, so every time the picker is opened again we reuse it instead of
// re-fetching and re-building a couple thousand annotations from scratch.
let stationListCache = null;
let stationListPromise = null;

function fetchAllStations() {
  if (stationListCache) return Promise.resolve(stationListCache);
  if (stationListPromise) return stationListPromise;
  stationListPromise = base44.functions.invoke('hydrometric', { listStations: true })
    .then(res => {
      if (res.data?.error) {
        console.error('[RiverStationMapPicker] listStations returned an error:', res.data.error);
        stationListPromise = null; // don't cache a failure — let the next open retry
        return [];
      }
      const stations = res.data?.stations || [];
      if (stations.length === 0) {
        console.error('[RiverStationMapPicker] listStations returned zero stations. Full response:', res.data);
        stationListPromise = null;
        return [];
      }
      stationListCache = stations;
      return stations;
    })
    .catch((e) => {
      console.error('[RiverStationMapPicker] listStations call threw:', e);
      stationListPromise = null;
      return [];
    });
  return stationListPromise;
}

const DOT_GLYPH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="6"/></svg>';
const STAR_GLYPH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

// Map picker specific to River Conditions — plots every ECCC hydrometric
// station in Canada rather than acting as a generic city/place picker like
// the shared LocationMapPicker used on Weather/Moon/Home.
export default function RiverStationMapPicker({ open, onOpenChange, initialCoords, onSelect }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStations, setAllStations] = useState([]);
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [stationsLoadFailed, setStationsLoadFailed] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const stationAnnotationsRef = useRef([]);
  const favoriteAnnotationsRef = useRef([]);

  const loadFavoriteStations = async () => {
    try {
      const results = await base44.entities.RiverFavoriteStation.list('-created_date', 200);
      setFavoriteStations(results);
      return results;
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (!open) return;
    loadFavoriteStations();
  }, [open]);

  // Initialize MapKit JS and plot every station once the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setMapLoading(true);
    setMapError(null);
    setSelectedStation(null);

    const initMap = async () => {
      try {
        const [stations, favs] = await Promise.all([fetchAllStations(), loadFavoriteStations()]);
        if (cancelled) return;
        setAllStations(stations);
        // Distinguish "call failed / returned nothing" from "still loading" so
        // the user isn't left wondering why only favorites show up on the map.
        setStationsLoadFailed(stations.length === 0);

        await prepareMapKit();
        if (cancelled || !mapContainerRef.current) return;

        const startLat = initialCoords?.lat ?? 56;
        const startLon = initialCoords?.lon ?? -106;
        const center = new mapkit.Coordinate(startLat, startLon);
        const map = new mapkit.Map(mapContainerRef.current, {
          center,
          // Zoomed out enough to see a wide swath of Canada on first open,
          // rather than one station in isolation.
          cameraDistance: initialCoords ? 300000 : 4000000,
          mapType: mapkit.Map.MapTypes.Standard,
          showsUserLocationControl: false,
        });
        mapRef.current = map;

        const favIds = new Set(favs.map(f => f.station_id));

        const selectStationOnMap = (station, coord) => {
          setSelectedStation(station);
          setSearchValue(station.name);
          setShowSuggestions(false);
          if (coord) map.setCenterAnimated(coord);
        };

        // Every non-favorited station — small clustered dots so a few
        // thousand markers stay legible while zoomed out.
        const stationAnnotations = stations
          .filter(s => !favIds.has(s.id))
          .map(s => {
            const coord = new mapkit.Coordinate(s.lat, s.lon);
            const annotation = new mapkit.MarkerAnnotation(coord, {
              title: s.name,
              color: '#64748b',
              glyphImage: { 1: DOT_GLYPH },
              clusteringIdentifier: 'river-stations',
            });
            annotation.addEventListener('select', () => {
              if (cancelled) return;
              selectStationOnMap(s, coord);
            });
            return annotation;
          });
        try {
          map.addAnnotations(stationAnnotations);
          stationAnnotationsRef.current = stationAnnotations;
        } catch (e) {
          // Map may have been torn down during async init
        }

        // Favorited stations — never clustered, always visible as stars.
        const favAnnotations = favs.filter(f => f.lat != null && f.lon != null).map(f => {
          const coord = new mapkit.Coordinate(f.lat, f.lon);
          const annotation = new mapkit.MarkerAnnotation(coord, {
            title: f.station_name,
            subtitle: 'Favorite station',
            color: '#f59e0b',
            glyphImage: { 1: STAR_GLYPH },
          });
          annotation.addEventListener('select', () => {
            if (cancelled) return;
            selectStationOnMap({ id: f.station_id, name: f.station_name, lat: f.lat, lon: f.lon }, coord);
          });
          return annotation;
        });
        try {
          map.addAnnotations(favAnnotations);
          favoriteAnnotationsRef.current = favAnnotations;
        } catch (e) {
          // Map may have been torn down during async init
        }

        setMapLoading(false);
      } catch (e) {
        console.error('River station map init failed:', e);
        setMapError(e?.message || 'Map failed to load');
        setMapLoading(false);
      }
    };

    const timer = setTimeout(initMap, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        // Remove annotations BEFORE destroying so MapKit's internal async
        // annotation rendering (_addAnnotationToMapAsync) doesn't try to
        // touch a destroyed map instance (this._map becomes null).
        try {
          const anns = [...stationAnnotationsRef.current, ...favoriteAnnotationsRef.current];
          if (anns.length) mapRef.current.removeAnnotations(anns);
        } catch (e) {}
        try { mapRef.current.destroy(); } catch (e) {}
        mapRef.current = null;
      }
      stationAnnotationsRef.current = [];
      favoriteAnnotationsRef.current = [];
    };
  }, [open, retryTick]);

  const handleRetryStations = () => {
    stationListCache = null;
    stationListPromise = null;
    setRetryTick(t => t + 1);
  };

  const handleSearchInput = (value) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim().toLowerCase();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const source = allStations.length ? allStations : stationListCache || [];
      const matches = source
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 20);
      setSuggestions(matches);
      setShowSuggestions(true);
    }, 200);
  };

  const selectSuggestion = (s) => {
    setShowSuggestions(false);
    setSearchValue(s.name);
    setSelectedStation(s);
    if (mapRef.current && s.lat != null && s.lon != null) {
      mapRef.current.setCenterAnimated(new mapkit.Coordinate(s.lat, s.lon));
    }
  };

  const handleConfirm = () => {
    if (!selectedStation) return;
    onSelect(selectedStation);
    onOpenChange(false);
  };

  const currentFavorite = useMemo(() => {
    if (!selectedStation) return null;
    return favoriteStations.find(f => f.station_id === selectedStation.id) || null;
  }, [selectedStation, favoriteStations]);

  const toggleFavorite = async () => {
    if (!selectedStation || savingFavorite) return;
    setSavingFavorite(true);
    try {
      if (currentFavorite) {
        await base44.entities.RiverFavoriteStation.delete(currentFavorite.id);
      } else {
        await base44.entities.RiverFavoriteStation.create({
          station_id: selectedStation.id,
          station_name: selectedStation.name,
          lat: selectedStation.lat ?? null,
          lon: selectedStation.lon ?? null,
        });
      }
      await loadFavoriteStations();
    } catch (e) {
      // ignore
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleSelectFavorite = (fav) => {
    const station = { id: fav.station_id, name: fav.station_name, lat: fav.lat, lon: fav.lon };
    setSelectedStation(station);
    setSearchValue(fav.station_name);
    if (mapRef.current && fav.lat != null && fav.lon != null) {
      mapRef.current.setCenterAnimated(new mapkit.Coordinate(fav.lat, fav.lon));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 top-4 translate-y-0 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Choose a River Station</DialogTitle>
        </DialogHeader>

        {/* Map */}
        <div className="relative h-[300px] w-full bg-muted">
          <div ref={mapContainerRef} className="h-full w-full" />
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          )}
          {mapError && !mapLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Map unavailable</p>
              <p className="text-[10px] text-muted-foreground/60">{mapError}</p>
            </div>
          )}
          {!mapLoading && !mapError && !stationsLoadFailed && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] whitespace-nowrap">
              Tap a station to select it
            </div>
          )}
          {!mapLoading && !mapError && stationsLoadFailed && (
            <div className="absolute top-2 left-2 right-2 px-3 py-2 rounded-lg bg-red-600/90 text-white text-xs flex items-center justify-between gap-2">
              <span>Couldn't load the full station list — only favorites are shown.</span>
              <button onClick={handleRetryStations} className="shrink-0 underline font-medium">Retry</button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={searchValue}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              placeholder="Search for a river or station…"
              className="text-sm bg-transparent flex-1 outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-[5000] left-4 right-4 mt-1 max-h-48 overflow-y-auto bg-popover rounded-lg shadow-lg border border-border">
              {suggestions.map((s) => (
                <button
                  key={s.id}
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

        {/* Confirm + Favorite */}
        <div className="px-4 py-3 flex flex-col gap-2 border-t border-border">
          <p className="text-xs text-muted-foreground truncate w-full">
            {selectedStation ? selectedStation.name : 'Tap a station on the map or search above'}
          </p>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={toggleFavorite}
              disabled={!selectedStation || savingFavorite}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                currentFavorite
                  ? 'text-amber-500 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-muted-foreground border-border hover:text-amber-500 hover:border-amber-500/40'
              } disabled:opacity-40 disabled:pointer-events-none`}
              title={currentFavorite ? 'Remove from favorite stations' : 'Save this station'}
            >
              <Star className="w-4 h-4" fill={currentFavorite ? 'currentColor' : 'none'} />
              {currentFavorite ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedStation}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Check className="w-4 h-4" /> Use
            </button>
          </div>
        </div>

        {/* Favorite stations list — this is where favorites live, not on the main page */}
        {favoriteStations.length > 0 && (
          <div className="px-4 pb-3 border-t border-border pt-2">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wide mb-1.5">FAVORITE STATIONS</p>
            <div className="flex gap-1.5 flex-wrap max-h-32 overflow-y-auto">
              {favoriteStations.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => handleSelectFavorite(fav)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                    fav.station_id === selectedStation?.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/20 hover:text-primary'
                  }`}
                >
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  {fav.station_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}