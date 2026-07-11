import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MapControls from '@/components/map/MapControls';
import RouteStatsBar from '@/components/map/RouteStatsBar';
import PinDialog from '@/components/map/PinDialog';
import SaveRouteDialog from '@/components/map/SaveRouteDialog';
import SavedRoutesDrawer from '@/components/map/SavedRoutesDrawer';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/* global mapkit */

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

// Haversine distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GPS dot factory for custom Annotation
const gpsDotFactory = () => {
  const div = document.createElement('div');
  div.style.cssText = 'width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6);';
  return div;
};

// Pin marker factory for custom Annotation — CSS-based pin shape
const pinMarkerFactory = () => {
  const div = document.createElement('div');
  div.style.cssText = [
    'width:28px', 'height:28px', 'cursor:pointer',
    'background:#f59e0b', 'border:3px solid #ffffff',
    'border-radius:50% 50% 50% 0',
    'transform:rotate(-45deg)',
    'box-shadow:0 2px 6px rgba(0,0,0,0.4)',
    'display:flex', 'align-items:center', 'justify-content:center',
  ].join(';');
  const dot = document.createElement('div');
  dot.style.cssText = 'width:8px;height:8px;background:#ffffff;border-radius:50%;transform:rotate(45deg)';
  div.appendChild(dot);
  return div;
};

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
  const [mapReady, setMapReady] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);

  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const durationTimerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const trackOverlayRef = useRef(null);
  const gpsAnnotationRef = useRef(null);
  const pinAnnotationsRef = useRef([]);
  const pinModeRef = useRef(false);
  const handleMapClickRef = useRef(() => {});

  useEffect(() => { pinModeRef.current = pinMode; }, [pinMode]);

  // Native pointer-based tap detection on the map container (replaces MapKit single-tap)
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || !mapReady || !mapRef.current) return;

    let downX = 0, downY = 0, isDown = false;

    const onPointerDown = (e) => {
      downX = e.clientX;
      downY = e.clientY;
      isDown = true;
    };

    const onPointerUp = (e) => {
      if (!isDown) return;
      isDown = false;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.sqrt(dx * dx + dy * dy) > 10) return; // ignore drags
      if (!pinModeRef.current) return;
      const map = mapRef.current;
      if (!map) return;
      const coord = map.convertPointOnPageToCoordinate(new DOMPoint(e.pageX, e.pageY));
      if (coord) {
        handleMapClickRef.current({ lat: coord.latitude, lon: coord.longitude });
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [mapReady]);

  const handleMapClick = useCallback((latlng) => {
    setPendingPin({ lat: latlng.lat, lon: latlng.lon });
    setEditingPinIdx(null);
    setPinDialogOpen(true);
    setPinMode(false);
  }, []);
  useEffect(() => { handleMapClickRef.current = handleMapClick; }, [handleMapClick]);

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
    setPinMode((v) => !v);
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

  // Map type toggle (Hybrid → Satellite → Standard → Hybrid)
  const handleToggleLayer = useCallback(() => {
    if (!mapRef.current) return;
    const types = [
      mapkit.Map.MapTypes.Hybrid,
      mapkit.Map.MapTypes.Satellite,
      mapkit.Map.MapTypes.Standard,
    ];
    const currentIdx = types.indexOf(mapRef.current.mapType);
    const nextIdx = (currentIdx + 1) % types.length;
    mapRef.current.mapType = types[nextIdx];
  }, []);

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    const initMap = async () => {
      try {
        await loadMapKit();
        if (cancelled) return;
        ensureMapKitInit();
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled || !mapContainerRef.current) return;

        // Try to get current GPS position before initializing
        let lat = 43.6532;
        let lon = -79.3832;
        if (gpsPos) {
          lat = gpsPos[0];
          lon = gpsPos[1];
        } else if (navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            setGpsPos([lat, lon]);
          } catch (e) {
            // Fall back to default Toronto location
          }
        }

        const center = new mapkit.Coordinate(lat, lon);
        const map = new mapkit.Map(mapContainerRef.current, {
          center,
          cameraDistance: 5000,
          mapType: mapkit.Map.MapTypes.Hybrid,
        });
        mapRef.current = map;

        map.addEventListener('single-tap', (event) => {
          if (!pinModeRef.current) return;
          const pt = event.pointOnPage;
          if (pt) {
            const domPoint = new DOMPoint(pt.x ?? pt.clientX ?? 0, pt.y ?? pt.clientY ?? 0);
            const coord = map.convertPointOnPageToCoordinate(domPoint);
            if (coord) {
              handleMapClickRef.current({ lat: coord.latitude, lon: coord.longitude });
            }
          }
        });

        map.addEventListener('region-change-end', () => {
          setMapVersion((v) => v + 1);
        });

        setMapReady(true);
      } catch (e) {
        console.error('MapKit init failed:', e);
      }
    };
    const timer = setTimeout(initMap, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        try { mapRef.current.destroy(); } catch (e) {}
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Update track overlay
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (trackOverlayRef.current) {
      map.removeOverlay(trackOverlayRef.current);
      trackOverlayRef.current = null;
    }

    if (trackPoints.length > 1) {
      const coords = trackPoints.map((p) => new mapkit.Coordinate(p.lat, p.lon));
      const style = new mapkit.Style({
        strokeColor: '#2563eb',
        lineWidth: 4,
        lineJoin: 'round',
        lineCap: 'round',
      });
      const overlay = new mapkit.PolylineOverlay(coords, { style });
      map.addOverlay(overlay);
      trackOverlayRef.current = overlay;
    }
  }, [trackPoints, mapReady]);

  // Update GPS annotation
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (gpsAnnotationRef.current) {
      map.removeAnnotation(gpsAnnotationRef.current);
      gpsAnnotationRef.current = null;
    }

    if (gpsPos) {
      const coord = new mapkit.Coordinate(gpsPos[0], gpsPos[1]);
      const annotation = new mapkit.Annotation(coord, gpsDotFactory, {
        displayPriority: 1000,
        animates: false,
        calloutEnabled: false,
      });
      map.addAnnotation(annotation);
      gpsAnnotationRef.current = annotation;
    }
  }, [gpsPos, mapReady]);

  // Update pin annotations
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    pinAnnotationsRef.current.forEach((a) => map.removeAnnotation(a));
    pinAnnotationsRef.current = [];

    pins.forEach((pin, idx) => {
      const coord = new mapkit.Coordinate(pin.lat, pin.lon);
      const annotation = new mapkit.Annotation(coord, pinMarkerFactory, {
        title: pin.label,
        displayPriority: 1000,
        animates: false,
        calloutEnabled: false,
      });
      annotation.addEventListener('select', () => {
        handlePinClick(idx);
      });
      map.addAnnotation(annotation);
      pinAnnotationsRef.current.push(annotation);
    });
  }, [pins, mapReady, handlePinClick]);

  // Recenter
  useEffect(() => {
    if (!mapReady || !mapRef.current || !recenterTarget) return;
    const coord = new mapkit.Coordinate(recenterTarget[0], recenterTarget[1]);
    mapRef.current.setCenterAnimated(coord);
  }, [recenterTrigger, recenterTarget, mapReady]);

  const hasTrack = trackPoints.length > 0;
  const hasPins = pins.length > 0;

  return (
    <div className="fixed inset-0 z-[4000] bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-[600] flex items-center gap-2 px-2 py-2 bg-background/80 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <Link to="/" className="p-2 -ml-1 rounded-lg hover:bg-accent/10 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-heading font-semibold flex-1">Map</h1>
      </div>

      {/* Map */}
      <div className="absolute inset-0" style={{ top: 'calc(env(safe-area-inset-top) + 48px)' }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        {/* DOM-based pin overlays (reliable fallback for MapKit annotations) */}
        {mapReady && mapRef.current && pins.map((pin, idx) => {
          const coord = new mapkit.Coordinate(pin.lat, pin.lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div
              key={idx}
              onClick={() => handlePinClick(idx)}
              className="absolute z-[450] cursor-pointer"
              style={{ left, top, transform: 'translate(-50%, -100%)' }}
            >
              <div style={{
                width: '28px', height: '28px',
                background: '#f59e0b', border: '3px solid #ffffff',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: '8px', height: '8px', background: '#ffffff', borderRadius: '50%', transform: 'rotate(45deg)' }} />
              </div>
              <div style={{
                position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px',
                pointerEvents: 'none',
              }}>
                {pin.label}
              </div>
            </div>
          );
        })}
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
        hasPins={hasPins}
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