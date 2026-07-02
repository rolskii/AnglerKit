import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Check } from 'lucide-react';
import { searchLocations } from '@/lib/geocode';

// Fix default marker icon for Leaflet under bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component that tracks map movement and reports center
function MapEventHandler({ onMoveEnd }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
}

// Component to fly to a new position when it changes externally
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 10), { duration: 0.8 });
    }
  }, [position?.[0], position?.[1]]);
  return null;
}

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

export default function LocationMapPicker({ open, onOpenChange, initialCoords, onSelect }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [markerPos, setMarkerPos] = useState(
    initialCoords ? [initialCoords.lat, initialCoords.lon] : [43.6532, -79.3832]
  );
  const [flyPos, setFlyPos] = useState(null);
  const [placeName, setPlaceName] = useState(initialCoords?.name || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMarkerPos(initialCoords ? [initialCoords.lat, initialCoords.lon] : [43.6532, -79.3832]);
      setPlaceName(initialCoords?.name || '');
      setSearchValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, initialCoords]);

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
    setMarkerPos([s.lat, s.lon]);
    setFlyPos([s.lat, s.lon]);
    setPlaceName(s.name);
    setSearchValue(s.name);
    setShowSuggestions(false);
  };

  const handleMoveEnd = async (lat, lon) => {
    setMarkerPos([lat, lon]);
    const name = await reverseGeocode(lat, lon);
    if (name) {
      setPlaceName(name);
      setSearchValue(name);
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
        <div className="relative h-[300px] w-full">
          <MapContainer
            center={markerPos}
            zoom={10}
            scrollWheelZoom={false}
            className="h-full w-full"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={markerPos} />
            <MapEventHandler onMoveEnd={handleMoveEnd} />
            <FlyTo position={flyPos} />
          </MapContainer>
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