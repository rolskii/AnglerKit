import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import MapControls from '@/components/map/MapControls';
import RouteStatsBar from '@/components/map/RouteStatsBar';
import PinDialog from '@/components/map/PinDialog';
import SaveRouteDialog from '@/components/map/SaveRouteDialog';
import SavedRoutesDrawer from '@/components/map/SavedRoutesDrawer';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix Leaflet default marker icon paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom pin icon (amber)
const pinIcon = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">📍</div>',
  className: 'custom-pin-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

// GPS position icon (blue dot)
const gpsIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>',
  className: 'gps-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Haversine distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Component that re-centers the map
function Recenter({ center, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Component that handles map clicks for pin placement
function MapClickHandler({ pinMode, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (pinMode) onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapView() {
  const [trackPoints, setTrackPoints] = useState([]);
  const [pins, setPins] = useState([]);
  const [gpsPos, setGpsPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingPin, setPendingPin] = useState(null);
  const [editingPinIdx, setEditingPinIdx] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [routesOpen, setRoutesOpen] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [useTopo, setUseTopo] = useState(true);

  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const durationTimerRef = useRef(null);
  const mapRef = useRef(null);

  // Load saved routes
  const loadRoutes = useCallback(async () => {
    try {
      const routes = await base44.entities.MapCourse.list('-updated_date', 50);
      setSavedRoutes(routes || []);
    } catch (e) {
      console.error('Failed to load routes:', e);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Duration timer
  useEffect(() => {
    if (isTracking && !isPaused) {
      startTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDurationSec(elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current) / 1000);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (isPaused && startTimeRef.current) {
        elapsedBeforePauseRef.current += (Date.now() - startTimeRef.current) / 1000;
        startTimeRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isTracking, isPaused]);

  // GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not available on this device.');
      return;
    }
    if (isPaused) {
      setIsPaused(false);
      setIsTracking(true);
      return;
    }
    setIsTracking(true);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    setDurationSec(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPoint = { lat: latitude, lon: longitude, ts: Date.now() };
        setGpsPos([latitude, longitude]);
        setTrackPoints((prev) => {
          const updated = [...prev, newPoint];
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const d = haversine(last.lat, last.lon, latitude, longitude);
            if (d < 0.005) return prev; // ignore jitter under 5m
            setDistanceKm((prevD) => prevD + d);
          }
          return updated;
        });
      },
      (err) => {
        console.error('GPS error:', err);
        alert('Unable to access GPS. Please check location permissions.');
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  }, [isPaused]);

  const pauseTracking = useCallback(() => {
    setIsPaused(true);
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    setIsPaused(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Center on GPS
  const centerOnGPS = useCallback(() => {
    if (gpsPos) {
      setRecenterTarget(gpsPos);
      setRecenterTrigger((t) => t + 1);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = [pos.coords.latitude, pos.coords.longitude];
          setGpsPos(c);
          setRecenterTarget(c);
          setRecenterTrigger((t) => t + 1);
        },
        () => alert('Unable to get your location.'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [gpsPos]);

  // Pin handling
  const handleAddPin = useCallback(() => {
    if (pinMode) {
      // In pin mode, tapping the map places a pin. If on GPS, use current position.
      setPinMode(false);
    } else {
      setPinMode(true);
    }
  }, [pinMode]);

  const handleMapClick = useCallback((latlng) => {
    setPendingPin({ lat: latlng.lat, lon: latlng.lng });
    setEditingPinIdx(null);
    setPinDialogOpen(true);
    setPinMode(false);
  }, []);

  const handlePinSave = useCallback((label) => {
    if (editingPinIdx !== null) {
      setPins((prev) => prev.map((p, i) => (i === editingPinIdx ? { ...p, label } : p)));
    } else if (pendingPin) {
      setPins((prev) => [...prev, { ...pendingPin, label }]);
    }
    setPendingPin(null);
    setEditingPinIdx(null);
  }, [pendingPin, editingPinIdx]);

  const handlePinClick = useCallback((idx) => {
    setEditingPinIdx(idx);
    setPinDialogOpen(true);
  }, []);

  // Save route
  const handleSaveRoute = useCallback(async (name, description) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    try {
      await base44.entities.MapCourse.create({
        name,
        description,
        track: trackPoints,
        pins,
        distance_km: Math.round(distanceKm * 100) / 100,
        duration_sec: Math.round(durationSec),
        date: dateStr,
      });
      await loadRoutes();
      // Clear current track
      setTrackPoints([]);
      setPins([]);
      setDistanceKm(0);
      setDurationSec(0);
      elapsedBeforePauseRef.current = 0;
    } catch (e) {
      console.error('Failed to save route:', e);
      alert('Failed to save route. Please try again.');
    }
  }, [trackPoints, pins, distanceKm, durationSec, loadRoutes]);

  // Load a saved route
  const handleLoadRoute = useCallback((route) => {
    setTrackPoints(route.track || []);
    setPins(route.pins || []);
    setDistanceKm(route.distance_km || 0);
    setDurationSec(route.duration_sec || 0);
    setIsTracking(false);
    setIsPaused(false);
    setRoutesOpen(false);
    if (route.track && route.track.length > 0) {
      const first = route.track[0];
      setRecenterTarget([first.lat, first.lon]);
      setRecenterTrigger((t) => t + 1);
    }
  }, []);

  const handleRouteDeleted = useCallback((id) => {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggleLayer = useCallback(() => {
    setUseTopo((v) => !v);
  }, []);

  const hasTrack = trackPoints.length > 0;
  const polylinePositions = trackPoints.map((p) => [p.lat, p.lon]);

  return (
    <div className="fixed inset-0 z-[4000] bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-[600] flex items-center gap-2 px-2 py-2 bg-background/80 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <Link to="/" className="p-2 -ml-1 rounded-lg hover:bg-accent/10 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-heading font-semibold flex-1">Topo Map</h1>
      </div>

      {/* Map */}
      <div className="absolute inset-0" style={{ top: 'calc(env(safe-area-inset-top) + 48px)' }}>
        <MapContainer
          center={gpsPos || [43.6532, -79.3832]}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          ref={mapRef}
        >
          {useTopo ? (
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenTopoMap (CC-BY-SA)'
              maxZoom={17}
            />
          ) : (
            <>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
                maxZoom={19}
              />
            </>
          )}

          {/* Recorded track */}
          {polylinePositions.length > 1 && (
            <Polyline positions={polylinePositions} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }} />
          )}

          {/* GPS position marker */}
          {gpsPos && <Marker position={gpsPos} icon={gpsIcon} />}

          {/* POI pins */}
          {pins.map((pin, idx) => (
            <Marker
              key={idx}
              position={[pin.lat, pin.lon]}
              icon={pinIcon}
              eventHandlers={{ click: () => handlePinClick(idx) }}
            >
              <Popup>
                <div className="text-sm font-medium">{pin.label}</div>
              </Popup>
            </Marker>
          ))}

          <Recenter center={recenterTarget} trigger={recenterTrigger} />
          <MapClickHandler pinMode={pinMode} onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Stats bar */}
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }}>
        <RouteStatsBar
          isTracking={isTracking}
          isPaused={isPaused}
          trackPoints={trackPoints}
          distanceKm={distanceKm}
          durationSec={durationSec}
        />
      </div>

      {/* Pin mode hint */}
      {pinMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-medium shadow-lg">
          Tap the map to drop a pin
        </div>
      )}

      {/* Controls */}
      <MapControls
        isTracking={isTracking}
        isPaused={isPaused}
        hasTrack={hasTrack}
        pinMode={pinMode}
        onStart={startTracking}
        onPause={pauseTracking}
        onStop={stopTracking}
        onAddPin={handleAddPin}
        onSave={() => setSaveDialogOpen(true)}
        onCenter={centerOnGPS}
        onToggleLayer={handleToggleLayer}
        onOpenRoutes={() => { loadRoutes(); setRoutesOpen(true); }}
      />

      {/* Dialogs */}
      <PinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        initialLabel={editingPinIdx !== null ? pins[editingPinIdx]?.label : ''}
        onSave={handlePinSave}
      />
      <SaveRouteDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveRoute}
      />
      <SavedRoutesDrawer
        open={routesOpen}
        onOpenChange={setRoutesOpen}
        routes={savedRoutes}
        onLoad={handleLoadRoute}
        onDeleted={handleRouteDeleted}
      />
    </div>
  );
}