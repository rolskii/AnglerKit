import React, { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MapControls from '@/components/map/MapControls';
import RouteStatsBar from '@/components/map/RouteStatsBar';
import PinDialog from '@/components/map/PinDialog';
import SaveRouteDialog from '@/components/map/SaveRouteDialog';
import RouteInfoDialog from '@/components/map/RouteInfoDialog';
import SavedRoutesDrawer from '@/components/map/SavedRoutesDrawer';
import DrawLayer from '@/components/map/DrawLayer';
import DrawBar from '@/components/map/DrawBar';
import DrawingDialog from '@/components/map/DrawingDialog';
import MeasureBar from '@/components/map/MeasureBar';
import AreaBar from '@/components/map/AreaBar';
import { computeSphericalArea, formatArea, formatDistance, isImperial } from '@/lib/sphericalArea';
import { ChevronLeft, Route, Pencil } from 'lucide-react';
import { getSharedLocation, setSharedLocation } from '@/lib/sharedLocation';
import { Link } from 'react-router-dom';
import BottomTabBar from '@/components/BottomTabBar';
import MapSearchBar from '@/components/map/MapSearchBar';
import FishIcon from '@/components/FishIcon';
import AppLogo from '@/components/AppLogo';
import { useToast } from '@/components/ui/use-toast';
import { prepareMapKit } from '@/lib/mapkitLoader';

/* global mapkit */

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
  const { toast } = useToast();
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
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeInfoOpen, setRouteInfoOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawings, setDrawings] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [editingDrawingIdx, setEditingDrawingIdx] = useState(null);
  const [redrawingIdx, setRedrawingIdx] = useState(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [savedMeasurements, setSavedMeasurements] = useState([]);
  const [areaMode, setAreaMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapVersion, setMapVersion] = useState(0);
  const [loadedRouteId, setLoadedRouteId] = useState(null);
  const [imperial, setImperial] = useState(() => isImperial());


  // Persist pins to localStorage so they survive page navigation
  const PINS_KEY = 'mapview_pins';
  const TRACK_KEY = 'mapview_track';
  const DIST_KEY = 'mapview_distance';
  const DUR_KEY = 'mapview_duration';

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
  const allRoutesOverlaysRef = useRef([]);
  const measureModeRef = useRef(false);
  const handleMeasureClickRef = useRef(() => {});
  const drawingOverlaysRef = useRef([]);
  const measureOverlayRef = useRef(null);
  const savedMeasureOverlaysRef = useRef([]);
  const redrawingIdxRef = useRef(null);
  const areaModeRef = useRef(false);
  const handleAreaClickRef = useRef(() => {});
  const areaOverlayRef = useRef(null);
  const savedAreaOverlaysRef = useRef([]);


  useEffect(() => { pinModeRef.current = pinMode; }, [pinMode]);
  useEffect(() => { measureModeRef.current = measureMode; }, [measureMode]);
  useEffect(() => { areaModeRef.current = areaMode; }, [areaMode]);
  useEffect(() => { redrawingIdxRef.current = redrawingIdx; }, [redrawingIdx]);
  useEffect(() => { if (!drawMode && redrawingIdx !== null) setRedrawingIdx(null); }, [drawMode, redrawingIdx]);

  // Sync imperial unit preference with weather page toggle
  useEffect(() => {
    const handler = () => setImperial(isImperial());
    window.addEventListener('storage', handler);
    window.addEventListener('weatherTempUnitChanged', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('weatherTempUnitChanged', handler);
    };
  }, []);

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
      if (!pinModeRef.current && !measureModeRef.current && !areaModeRef.current) return;
      const map = mapRef.current;
      if (!map) return;
      const coord = map.convertPointOnPageToCoordinate(new DOMPoint(e.pageX, e.pageY));
      if (coord) {
        if (pinModeRef.current) {
          handleMapClickRef.current({ lat: coord.latitude, lon: coord.longitude });
        } else if (measureModeRef.current) {
          handleMeasureClickRef.current({ lat: coord.latitude, lon: coord.longitude });
        } else if (areaModeRef.current) {
          handleAreaClickRef.current({ lat: coord.latitude, lon: coord.longitude });
        }
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
      toast({ title: 'Failed to load routes', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    loadRoutes();
    // Restore unsaved pins/track from previous session
    try {
      const savedPins = localStorage.getItem(PINS_KEY);
      if (savedPins) setPins(JSON.parse(savedPins));
      const savedTrack = localStorage.getItem(TRACK_KEY);
      if (savedTrack) setTrackPoints(JSON.parse(savedTrack));
      const savedDist = localStorage.getItem(DIST_KEY);
      if (savedDist) setDistanceKm(parseFloat(savedDist) || 0);
      const savedDur = localStorage.getItem(DUR_KEY);
      if (savedDur) setDurationSec(parseFloat(savedDur) || 0);
    } catch (e) {}
  }, [loadRoutes]);

  // Save pins to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(PINS_KEY, JSON.stringify(pins)); } catch (e) {}
  }, [pins]);

  // Save track data to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem(TRACK_KEY, JSON.stringify(trackPoints)); } catch (e) {}
  }, [trackPoints]);

  useEffect(() => {
    try { localStorage.setItem(DIST_KEY, String(distanceKm)); } catch (e) {}
  }, [distanceKm]);

  useEffect(() => {
    try { localStorage.setItem(DUR_KEY, String(durationSec)); } catch (e) {}
  }, [durationSec]);

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

        // Auto-recenter if the GPS position has moved off-screen
        const map = mapRef.current;
        const container = mapContainerRef.current;
        if (map && container) {
          try {
            const coord = new mapkit.Coordinate(latitude, longitude);
            const pt = map.convertCoordinateToPointOnPage(coord);
            if (pt) {
              const rect = container.getBoundingClientRect();
              const margin = 60; // pixels of slack before recentering
              if (pt.x < rect.left + margin || pt.x > rect.right - margin ||
                  pt.y < rect.top + margin || pt.y > rect.bottom - margin) {
                map.setCenterAnimated(coord);
              }
            }
          } catch (e) {}
        }
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
    setDrawMode(false);
    setMeasureMode(false);
    setAreaMode(false);
  }, []);

  const handlePinSave = useCallback(async (label, marker) => {
    let updatedPins;
    if (editingPinIdx !== null) {
      updatedPins = pins.map((p, i) => (i === editingPinIdx ? { ...p, label, marker: marker || 'pin' } : p));
      setPins(updatedPins);
    } else if (pendingPin) {
      updatedPins = [...pins, { ...pendingPin, label, marker: marker || 'pin' }];
      setPins(updatedPins);
    } else {
      return;
    }

    setPendingPin(null);
    setEditingPinIdx(null);

    // During active tracking, pins are saved with the route via the disk icon
    if (isTracking || isPaused) return;

    try {
      if (loadedRouteId) {
        await base44.entities.MapCourse.update(loadedRouteId, { pins: updatedPins });
      } else {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const newRecord = await base44.entities.MapCourse.create({
          name: label,
          pins: updatedPins,
          date: dateStr,
        });
        setLoadedRouteId(newRecord.id);
      }
      await loadRoutes();
    } catch (e) {
      console.error('Failed to persist pin:', e);
    }
  }, [pendingPin, editingPinIdx, pins, loadedRouteId, isTracking, isPaused, loadRoutes, toast]);

  const handlePinDelete = useCallback(async () => {
    let updatedPins = pins;
    if (editingPinIdx !== null) {
      updatedPins = pins.filter((_, i) => i !== editingPinIdx);
      setPins(updatedPins);
    }
    setPendingPin(null);
    setEditingPinIdx(null);

    if (isTracking || isPaused || !loadedRouteId || updatedPins === pins) return;

    try {
      await base44.entities.MapCourse.update(loadedRouteId, { pins: updatedPins });
      await loadRoutes();
      toast({ title: 'Pin deleted' });
    } catch (e) {
      console.error('Failed to persist pin deletion:', e);
      toast({ title: 'Failed to update', description: e?.message, variant: 'destructive' });
    }
  }, [editingPinIdx, pins, loadedRouteId, isTracking, isPaused, loadRoutes, toast]);

  const handlePinClick = useCallback((idx) => {
    setEditingPinIdx(idx);
    setPinDialogOpen(true);
  }, []);

  // Drawing handlers
  const handleToggleDraw = useCallback(() => {
    setDrawMode((v) => !v);
    setPinMode(false);
    setMeasureMode(false);
    setAreaMode(false);
  }, []);

  const handleDrawClear = useCallback(() => {
    setDrawings([]);
    setCurrentStroke([]);
  }, []);

  const handleDrawStroke = useCallback((points, done) => {
    if (done) {
      if (points.length > 1) {
        if (redrawingIdxRef.current !== null) {
          setDrawings((prev) => prev.map((d, i) => (i === redrawingIdxRef.current ? { ...d, points } : d)));
          setRedrawingIdx(null);
        } else {
          setDrawings((prev) => [...prev, { color: drawColor, points }]);
        }
      }
      setCurrentStroke(null);
    } else {
      setCurrentStroke({ color: drawColor, points });
    }
  }, [drawColor]);

  // Measurement handlers
  const handleToggleMeasure = useCallback(() => {
    setMeasureMode((v) => !v);
    setPinMode(false);
    setDrawMode(false);
    setAreaMode(false);
  }, []);

  const handleMeasureClick = useCallback((latlng) => {
    setMeasurePoints((prev) => [...prev, latlng]);
  }, []);
  useEffect(() => { handleMeasureClickRef.current = handleMeasureClick; }, [handleMeasureClick]);

  const handleMeasureUndo = useCallback(() => {
    setMeasurePoints((prev) => prev.slice(0, -1));
  }, []);

  const handleMeasureClear = useCallback(() => {
    setMeasurePoints([]);
  }, []);

  const handleMeasureSave = useCallback(() => {
    if (measurePoints.length < 2) return;
    const dist = measurePoints.reduce((sum, p, i) => {
      if (i === 0) return 0;
      const prev = measurePoints[i - 1];
      return sum + haversine(prev.lat, prev.lon, p.lat, p.lon);
    }, 0);
    setSavedMeasurements((prev) => [...prev, { points: measurePoints, distance_km: Math.round(dist * 100) / 100 }]);
    setMeasurePoints([]);
  }, [measurePoints]);

  // Area handlers
  const handleToggleArea = useCallback(() => {
    setAreaMode((v) => !v);
    setPinMode(false);
    setDrawMode(false);
    setMeasureMode(false);
  }, []);

  const handleAreaClick = useCallback((latlng) => {
    setAreaPoints((prev) => [...prev, latlng]);
  }, []);
  useEffect(() => { handleAreaClickRef.current = handleAreaClick; }, [handleAreaClick]);

  const handleAreaUndo = useCallback(() => {
    setAreaPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleAreaClear = useCallback(() => {
    setAreaPoints([]);
  }, []);

  const handleAreaSave = useCallback(() => {
    if (areaPoints.length < 3) return;
    const areaM2 = computeSphericalArea(areaPoints);
    setSavedAreas((prev) => [...prev, { points: areaPoints, area_m2: Math.round(areaM2) }]);
    setAreaPoints([]);
  }, [areaPoints]);

  // Drawing label/description handlers
  const handleDrawingClick = useCallback((idx) => {
    setEditingDrawingIdx(idx);
    setDrawDialogOpen(true);
  }, []);

  const handleDrawingSave = useCallback((label, description, newColor) => {
    if (editingDrawingIdx !== null) {
      setDrawings((prev) => prev.map((d, i) => (i === editingDrawingIdx ? { ...d, label, description, color: newColor } : d)));
    }
    setEditingDrawingIdx(null);
  }, [editingDrawingIdx]);

  const handleDrawingDelete = useCallback(() => {
    if (editingDrawingIdx !== null) {
      setDrawings((prev) => prev.filter((_, i) => i !== editingDrawingIdx));
    }
    setEditingDrawingIdx(null);
  }, [editingDrawingIdx]);

  const handleRedraw = useCallback(() => {
    if (editingDrawingIdx === null) return;
    const drawing = drawings[editingDrawingIdx];
    setRedrawingIdx(editingDrawingIdx);
    setDrawColor(drawing?.color || '#ef4444');
    setDrawDialogOpen(false);
    setEditingDrawingIdx(null);
    setDrawMode(true);
    setPinMode(false);
    setMeasureMode(false);
    setAreaMode(false);
  }, [editingDrawingIdx, drawings]);

  // Save route
  const handleSaveRoute = useCallback(async (name, description) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    try {
      const allMeasurements = [...savedMeasurements];
      if (measurePoints.length >= 2) {
        const dist = measurePoints.reduce((sum, p, i) => {
          if (i === 0) return 0;
          const prev = measurePoints[i - 1];
          return sum + haversine(prev.lat, prev.lon, p.lat, p.lon);
        }, 0);
        allMeasurements.push({ points: measurePoints, distance_km: Math.round(dist * 100) / 100 });
      }
      const allAreas = [...savedAreas];
      if (areaPoints.length >= 3) {
        allAreas.push({ points: areaPoints, area_m2: Math.round(computeSphericalArea(areaPoints)) });
      }
      const payload = {
        name,
        description,
        track: trackPoints,
        pins,
        drawings,
        measurements: allMeasurements,
        areas: allAreas,
        distance_km: Math.round(distanceKm * 100) / 100,
        duration_sec: Math.round(durationSec),
        date: dateStr,
      };
      if (loadedRouteId) {
        await base44.entities.MapCourse.update(loadedRouteId, payload);
      } else {
        await base44.entities.MapCourse.create(payload);
      }
      await loadRoutes();
      toast({ title: 'Saved successfully', description: `${name} has been saved.` });
      setTrackPoints([]);
      setPins([]);
      setDrawings([]);
      setSavedMeasurements([]);
      setMeasurePoints([]);
      setSavedAreas([]);
      setAreaPoints([]);
      setLoadedRouteId(null);
      setDistanceKm(0);
      setDurationSec(0);
      elapsedBeforePauseRef.current = 0;
      try {
        localStorage.removeItem(PINS_KEY);
        localStorage.removeItem(TRACK_KEY);
        localStorage.removeItem(DIST_KEY);
        localStorage.removeItem(DUR_KEY);
      } catch (e) {}
    } catch (e) {
      console.error('Save failed:', e);
      toast({
        title: 'Failed to save',
        description: e?.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [trackPoints, pins, drawings, distanceKm, durationSec, savedMeasurements, measurePoints, loadRoutes, toast, loadedRouteId]);

  // Load a saved route
  const handleLoadRoute = useCallback((route, targetCoords) => {
    setTrackPoints(route.track || []);
    setPins(route.pins || []);
    setDrawings(route.drawings || []);
    setSavedMeasurements(route.measurements || []);
    setSavedAreas(route.areas || []);
    setMeasurePoints([]);
    setAreaPoints([]);
    setDistanceKm(route.distance_km || 0);
    setDurationSec(route.duration_sec || 0);
    setIsTracking(false);
    setIsPaused(false);
    setRoutesOpen(false);
    setLoadedRouteId(route.id);
    const target = targetCoords ||
      (route.track && route.track.length > 0 ? [route.track[0].lat, route.track[0].lon] : null) ||
      (route.pins && route.pins.length > 0 ? [route.pins[0].lat, route.pins[0].lon] : null);
    if (target) {
      setRecenterTarget(target);
      setRecenterTrigger((t) => t + 1);
    }
  }, []);

  const handleRouteDeleted = useCallback((id) => {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
    if (id === loadedRouteId) {
      setTrackPoints([]);
      setPins([]);
      setDrawings([]);
      setSavedMeasurements([]);
      setMeasurePoints([]);
      setSavedAreas([]);
      setAreaPoints([]);
      setDistanceKm(0);
      setDurationSec(0);
      setLoadedRouteId(null);
      try {
        localStorage.removeItem(PINS_KEY);
        localStorage.removeItem(TRACK_KEY);
        localStorage.removeItem(DIST_KEY);
        localStorage.removeItem(DUR_KEY);
      } catch (e) {}
    }
  }, [loadedRouteId]);

  const handleSaveRouteName = useCallback(async (name) => {
    if (!selectedRoute) return;
    try {
      await base44.entities.MapCourse.update(selectedRoute.id, { name });
      await loadRoutes();
    } catch (e) {
      console.error('Failed to update route name:', e);
      toast({ title: 'Failed to rename', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  }, [selectedRoute, loadRoutes, toast]);

  const handleLoadRouteFromInfo = useCallback((route) => {
    handleLoadRoute(route);
    setShowAllRoutes(false);
  }, [handleLoadRoute]);

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
    setMapError(null);
    const initMap = async () => {
      try {
        await prepareMapKit();
        if (cancelled || !mapContainerRef.current) return;

        const sharedLoc = getSharedLocation();
        const center = new mapkit.Coordinate(sharedLoc.coords.lat, sharedLoc.coords.lon);
        const map = new mapkit.Map(mapContainerRef.current, {
          center,
          cameraDistance: 300,
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
        setMapError(e?.message || 'Map failed to load');
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

  // Request GPS position and recenter map once available
  useEffect(() => {
    if (!mapReady || !mapRef.current || gpsPos) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setGpsPos(c);
        const coord = new mapkit.Coordinate(c[0], c[1]);
        mapRef.current.setCameraDistanceAnimated(300);
        mapRef.current.setCenterAnimated(coord);
      },
      (err) => console.warn('Geolocation failed:', err.message),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  }, [mapReady, gpsPos]);

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

  // Render all saved routes as polyline overlays
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const ROUTE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

    if (showAllRoutes) {
      savedRoutes.forEach((route, idx) => {
        if (!route.track || route.track.length < 2) return;
        const coords = route.track.map((p) => new mapkit.Coordinate(p.lat, p.lon));
        const style = new mapkit.Style({
          strokeColor: ROUTE_COLORS[idx % ROUTE_COLORS.length],
          lineWidth: 4,
          lineJoin: 'round',
          lineCap: 'round',
        });
        const overlay = new mapkit.PolylineOverlay(coords, { style });
        map.addOverlay(overlay);
        allRoutesOverlaysRef.current.push(overlay);
      });
    }

    return () => {
      allRoutesOverlaysRef.current.forEach((o) => {
        try { map.removeOverlay(o); } catch (e) {}
      });
      allRoutesOverlaysRef.current = [];
    };
  }, [showAllRoutes, savedRoutes, mapReady]);

  // Render drawings as polyline overlays
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    drawingOverlaysRef.current.forEach((o) => { try { map.removeOverlay(o); } catch (e) {} });
    drawingOverlaysRef.current = [];

    const allStrokes = [...drawings];
    if (currentStroke && currentStroke.points && currentStroke.points.length >= 2) allStrokes.push(currentStroke);

    allStrokes.forEach((stroke) => {
      const pts = Array.isArray(stroke) ? stroke : stroke.points;
      if (!pts || pts.length < 2) return;
      const coords = pts.map((p) => new mapkit.Coordinate(p.lat, p.lon));
      const isCurrent = stroke === currentStroke;
      const color = Array.isArray(stroke) ? '#dc2626' : (stroke.color || '#dc2626');
      const style = new mapkit.Style({
        strokeColor: color,
        lineWidth: 3,
        lineJoin: 'round',
        lineCap: 'round',
      });
      const overlay = new mapkit.PolylineOverlay(coords, { style });
      map.addOverlay(overlay);
      drawingOverlaysRef.current.push(overlay);
    });
  }, [drawings, currentStroke, mapReady]);

  // Render measurement polyline overlay
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (measureOverlayRef.current) {
      try { map.removeOverlay(measureOverlayRef.current); } catch (e) {}
      measureOverlayRef.current = null;
    }

    if (measurePoints.length >= 2) {
      const coords = measurePoints.map((p) => new mapkit.Coordinate(p.lat, p.lon));
      const style = new mapkit.Style({
        strokeColor: '#3b82f6',
        lineWidth: 3,
        lineJoin: 'round',
        lineCap: 'round',
        lineDash: [6, 6],
      });
      const overlay = new mapkit.PolylineOverlay(coords, { style });
      map.addOverlay(overlay);
      measureOverlayRef.current = overlay;
    }
  }, [measurePoints, mapReady]);

  // Render saved measurements as solid yellow polyline overlays
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    savedMeasureOverlaysRef.current.forEach((o) => { try { map.removeOverlay(o); } catch (e) {} });
    savedMeasureOverlaysRef.current = [];

    savedMeasurements.forEach((m) => {
      if (!m.points || m.points.length < 2) return;
      const coords = m.points.map((p) => new mapkit.Coordinate(p.lat, p.lon));
      const style = new mapkit.Style({
        strokeColor: '#3b82f6',
        lineWidth: 3,
        lineJoin: 'round',
        lineCap: 'round',
      });
      const overlay = new mapkit.PolylineOverlay(coords, { style });
      map.addOverlay(overlay);
      savedMeasureOverlaysRef.current.push(overlay);
    });
  }, [savedMeasurements, mapReady]);

  // Render active area polygon overlay
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (areaOverlayRef.current) {
      try { map.removeOverlay(areaOverlayRef.current); } catch (e) {}
      areaOverlayRef.current = null;
    }

    if (areaPoints.length >= 3) {
      const coords = areaPoints.map((p) => new mapkit.Coordinate(p.lat, p.lon));
      const style = new mapkit.Style({
        strokeColor: '#10b981',
        fillColor: 'rgba(16,185,129,0.2)',
        lineWidth: 3,
        lineJoin: 'round',
      });
      const overlay = new mapkit.PolygonOverlay(coords, { style });
      map.addOverlay(overlay);
      areaOverlayRef.current = overlay;
    }
  }, [areaPoints, mapReady]);

  // Render saved area polygon overlays
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    savedAreaOverlaysRef.current.forEach((o) => { try { map.removeOverlay(o); } catch (e) {} });
    savedAreaOverlaysRef.current = [];

    savedAreas.forEach((a) => {
      if (!a.points || a.points.length < 3) return;
      const coords = a.points.map((p) => new mapkit.Coordinate(p.lat, p.lon));
      const style = new mapkit.Style({
        strokeColor: '#10b981',
        fillColor: 'rgba(16,185,129,0.15)',
        lineWidth: 2,
        lineJoin: 'round',
      });
      const overlay = new mapkit.PolygonOverlay(coords, { style });
      map.addOverlay(overlay);
      savedAreaOverlaysRef.current.push(overlay);
    });
  }, [savedAreas, mapReady]);

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

  // Pins are rendered as DOM overlays (see JSX below) — no MapKit annotations needed

  // Recenter
  useEffect(() => {
    if (!mapReady || !mapRef.current || !recenterTarget) return;
    const coord = new mapkit.Coordinate(recenterTarget[0], recenterTarget[1]);
    mapRef.current.setCenterAnimated(coord);
  }, [recenterTrigger, recenterTarget, mapReady]);

  const hasTrack = trackPoints.length > 0;
  const hasPins = pins.length > 0;
  const hasDrawings = drawings.length > 0;
  const hasAreas = savedAreas.length > 0 || areaPoints.length > 0;
  const measureTotalKm = measurePoints.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = measurePoints[i - 1];
    return sum + haversine(prev.lat, prev.lon, p.lat, p.lon);
  }, 0);
  const areaM2 = computeSphericalArea(areaPoints);

  return (
    <div className="fixed inset-0 z-[4000] bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-[600] flex items-center gap-2 px-2 py-2 bg-background/80 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <Link to="/" className="flex items-center gap-2 pl-1 pr-2 rounded-lg hover:bg-accent/10 transition-colors shrink-0">
          <AppLogo className="w-7 h-7" />
          <span className="font-heading font-semibold tracking-tight text-sm hidden sm:inline">AnglerKit</span>
        </Link>
        <MapSearchBar mapRef={mapRef} mapReady={mapReady} onSelect={(name, lat, lon) => setSharedLocation(name, lat, lon)} />
      </div>

      {/* Map */}
      <div className="absolute inset-0" style={{ top: 'calc(env(safe-area-inset-top) + 48px)' }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        {mapError && !mapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
            <p className="text-sm text-muted-foreground mb-1">Map unavailable</p>
            <p className="text-xs text-muted-foreground/60">{mapError}</p>
          </div>
        )}
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
              {pin.marker === 'fish' ? (
                <div style={{
                  width: '36px', height: '36px',
                  background: '#10b981', border: '3px solid #ffffff',
                  borderRadius: '50%',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FishIcon style={{ width: '22px', height: '22px', color: 'white' }} />
                </div>
              ) : (
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
              )}
              <div style={{
                position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px',
                pointerEvents: 'none',
              }}>
                {pin.label}
              </div>
            </div>
          );
        })}
        {/* All routes centroid markers — clickable to view stats & rename */}
        {mapReady && mapRef.current && showAllRoutes && savedRoutes.map((route, idx) => {
          // Pins-only entries: show each pin as a clickable marker
          if ((!route.track || route.track.length === 0) && route.pins && route.pins.length > 0) {
            return route.pins.map((pin, pIdx) => {
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
                  key={`${route.id}-pin-${pIdx}`}
                  onClick={() => { setSelectedRoute(route); setRouteInfoOpen(true); }}
                  className="absolute z-[455] cursor-pointer"
                  style={{ left, top, transform: 'translate(-50%, -100%)' }}
                >
                  {pin.marker === 'fish' ? (
                    <div style={{
                      width: '32px', height: '32px',
                      background: '#10b981', border: '3px solid #ffffff',
                      borderRadius: '50%',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FishIcon style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                  ) : (
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
                  )}
                  <div style={{
                    position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                    background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px',
                    pointerEvents: 'none',
                  }}>
                    {pin.label || route.name}
                  </div>
                </div>
              );
            });
          }
          if (!route.track || route.track.length === 0) return null;
          const lat = route.track.reduce((sum, p) => sum + p.lat, 0) / route.track.length;
          const lon = route.track.reduce((sum, p) => sum + p.lon, 0) / route.track.length;
          const coord = new mapkit.Coordinate(lat, lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
          const color = colors[idx % colors.length];
          return (
            <div
              key={route.id}
              onClick={() => { setSelectedRoute(route); setRouteInfoOpen(true); }}
              className="absolute z-[455] cursor-pointer"
              style={{ left, top, transform: 'translate(-50%, -50%)' }}
            >
              <div style={{
                width: '32px', height: '32px',
                background: color, border: '3px solid #ffffff',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Route className="w-4 h-4 text-white" />
              </div>
              <div style={{
                position: 'absolute', top: '36px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px',
                pointerEvents: 'none',
              }}>
                {route.name}
              </div>
            </div>
          );
        })}
        {/* Drawing capture layer */}
        <DrawLayer active={drawMode} mapRef={mapRef} onStroke={handleDrawStroke} />

        {/* Drawing centroid markers — clickable to view/edit details */}
        {!drawMode && mapReady && mapRef.current && drawings.map((stroke, idx) => {
          const pts = Array.isArray(stroke) ? stroke : stroke.points;
          if (!pts || pts.length < 2) return null;
          const lat = pts.reduce((sum, p) => sum + p.lat, 0) / pts.length;
          const lon = pts.reduce((sum, p) => sum + p.lon, 0) / pts.length;
          const coord = new mapkit.Coordinate(lat, lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          const color = Array.isArray(stroke) ? '#ef4444' : (stroke.color || '#ef4444');
          return (
            <div
              key={`draw-${idx}`}
              onClick={() => handleDrawingClick(idx)}
              className="absolute z-[457] cursor-pointer"
              style={{ left, top, transform: 'translate(-50%, -50%)' }}
            >
              <div style={{
                width: '22px', height: '22px',
                background: color, border: '2px solid #ffffff',
                borderRadius: '50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Pencil className="w-3 h-3 text-white" />
              </div>
              {stroke.label && (
                <div style={{
                  position: 'absolute', top: '26px', left: '50%', transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                  background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px',
                  pointerEvents: 'none',
                }}>
                  {stroke.label}
                </div>
              )}
            </div>
          );
        })}

        {/* Saved measurement point markers */}
        {mapReady && mapRef.current && savedMeasurements.map((m, mIdx) => m.points.map((pt, idx) => {
          const coord = new mapkit.Coordinate(pt.lat, pt.lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div key={`sm-${mIdx}-${idx}`} className="absolute z-[454] pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: '16px', height: '16px', background: '#3b82f6', border: '2px solid #ffffff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
            </div>
          );
        }))}
        {/* Measurement point markers */}
        {mapReady && mapRef.current && measurePoints.map((pt, idx) => {
          const coord = new mapkit.Coordinate(pt.lat, pt.lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div key={`mp-${idx}`} className="absolute z-[455] pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: '24px', height: '24px', background: '#3b82f6', border: '3px solid #ffffff', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{idx + 1}</span>
              </div>
            </div>
          );
        })}
        {/* Measurement segment distance labels */}
        {mapReady && mapRef.current && measurePoints.map((pt, idx) => {
          if (idx === 0) return null;
          const prev = measurePoints[idx - 1];
          const midLat = (prev.lat + pt.lat) / 2;
          const midLon = (prev.lon + pt.lon) / 2;
          const segDist = haversine(prev.lat, prev.lon, pt.lat, pt.lon);
          const coord = new mapkit.Coordinate(midLat, midLon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -50 || left > containerRect.width + 50 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div key={`seg-${idx}`} className="absolute z-[456] pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(59,130,246,0.9)', color: 'white', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                {formatDistance(segDist, imperial)}
              </span>
            </div>
          );
        })}
        {/* Area point markers */}
        {mapReady && mapRef.current && areaPoints.map((pt, idx) => {
          const coord = new mapkit.Coordinate(pt.lat, pt.lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div key={`ap-${idx}`} className="absolute z-[455] pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: '24px', height: '24px', background: '#10b981', border: '3px solid #ffffff', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{idx + 1}</span>
              </div>
            </div>
          );
        })}
        {/* Active area centroid label */}
        {mapReady && mapRef.current && areaPoints.length >= 3 && (() => {
          const lat = areaPoints.reduce((s, p) => s + p.lat, 0) / areaPoints.length;
          const lon = areaPoints.reduce((s, p) => s + p.lon, 0) / areaPoints.length;
          const coord = new mapkit.Coordinate(lat, lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -60 || left > containerRect.width + 60 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div className="absolute z-[456] pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(16,185,129,0.9)', color: 'white', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                {formatArea(areaM2, imperial)}
              </span>
            </div>
          );
        })()}
        {/* Saved area centroid labels */}
        {mapReady && mapRef.current && savedAreas.map((a, aIdx) => {
          if (!a.points || a.points.length < 3) return null;
          const lat = a.points.reduce((s, p) => s + p.lat, 0) / a.points.length;
          const lon = a.points.reduce((s, p) => s + p.lon, 0) / a.points.length;
          const coord = new mapkit.Coordinate(lat, lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -60 || left > containerRect.width + 60 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div key={`sa-${aIdx}`} className="absolute z-[456] pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(16,185,129,0.8)', color: 'white', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                {formatArea(a.area_m2, imperial)}
              </span>
            </div>
          );
        })}
        {/* Preview pin while dialog is open — shows immediately at tapped location */}
        {mapReady && mapRef.current && pendingPin && pinDialogOpen && editingPinIdx === null && (() => {
          const coord = new mapkit.Coordinate(pendingPin.lat, pendingPin.lon);
          const point = mapRef.current.convertCoordinateToPointOnPage(coord);
          if (!point) return null;
          const containerRect = mapContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return null;
          const left = point.x - containerRect.left;
          const top = point.y - containerRect.top;
          if (left < -30 || left > containerRect.width + 30 || top < -30 || top > containerRect.height + 30) return null;
          return (
            <div
              className="absolute z-[460] pointer-events-none"
              style={{ left, top, transform: 'translate(-50%, -100%)' }}
            >
              <div style={{
                width: '32px', height: '32px',
                background: '#ef4444', border: '3px solid #ffffff',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse-slow 1.5s ease-in-out infinite',
              }}>
                <div style={{ width: '10px', height: '10px', background: '#ffffff', borderRadius: '50%', transform: 'rotate(45deg)' }} />
              </div>
              <div style={{
                position: 'absolute', top: '36px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
                background: 'rgba(239,68,68,0.9)', color: 'white', padding: '2px 8px', borderRadius: '4px',
              }}>
                New Pin
              </div>
            </div>
          );
        })()}
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
      {/* Measure mode hint */}
      {measureMode && measurePoints.length === 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium shadow-lg">
          Tap the map to add measurement points
        </div>
      )}
      {/* Area mode hint */}
      {areaMode && areaPoints.length === 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-medium shadow-lg">
          Tap the map to define a boundary
        </div>
      )}
      {areaMode && areaPoints.length > 0 && areaPoints.length < 3 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-medium shadow-lg">
          {3 - areaPoints.length} more {3 - areaPoints.length === 1 ? 'point' : 'points'} to close the boundary
        </div>
      )}
      {/* Redraw hint */}
      {redrawingIdx !== null && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-purple-500 text-white text-sm font-medium shadow-lg">
          Redraw to replace this stroke
        </div>
      )}
      {/* Draw mode bar */}
      {drawMode && (
        <DrawBar onClear={handleDrawClear} strokeCount={drawings.length} color={drawColor} onColorChange={setDrawColor} />
      )}
      {/* Measurement bar */}
      {measurePoints.length > 0 && (
        <MeasureBar
          distanceLabel={formatDistance(measureTotalKm, imperial)}
          pointCount={measurePoints.length}
          onUndo={handleMeasureUndo}
          onClear={handleMeasureClear}
          onSave={handleMeasureSave}
        />
      )}
      {/* Area bar */}
      {areaPoints.length > 0 && (
        <AreaBar
          areaLabel={formatArea(areaM2, imperial)}
          pointCount={areaPoints.length}
          onUndo={handleAreaUndo}
          onClear={handleAreaClear}
          onSave={handleAreaSave}
        />
      )}

      {/* Controls */}
      <MapControls
        isTracking={isTracking}
        isPaused={isPaused}
        hasTrack={hasTrack}
        hasPins={hasPins}
        hasDrawings={hasDrawings}
        hasAreas={hasAreas}
        pinMode={pinMode}
        onStart={startTracking}
        onPause={pauseTracking}
        onStop={stopTracking}
        onAddPin={handleAddPin}
        onSave={() => setSaveDialogOpen(true)}
        onCenter={centerOnGPS}
        onToggleLayer={handleToggleLayer}
        onOpenRoutes={() => { loadRoutes(); setRoutesOpen(true); }}
        showAllRoutes={showAllRoutes}
        onToggleAllRoutes={() => { loadRoutes(); setShowAllRoutes((v) => !v); }}
        drawMode={drawMode}
        measureMode={measureMode}
        areaMode={areaMode}
        onToggleDraw={handleToggleDraw}
        onToggleMeasure={handleToggleMeasure}
        onToggleArea={handleToggleArea}
      />

      {/* Dialogs */}
      <PinDialog
        open={pinDialogOpen}
        onOpenChange={(open) => {
          setPinDialogOpen(open);
          if (!open) {
            setPendingPin(null);
            setEditingPinIdx(null);
          }
        }}
        initialLabel={editingPinIdx !== null ? pins[editingPinIdx]?.label : ''}
        initialMarker={editingPinIdx !== null ? pins[editingPinIdx]?.marker : 'pin'}
        isEditing={editingPinIdx !== null}
        onSave={handlePinSave}
        onDelete={handlePinDelete}
      />
      <SaveRouteDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveRoute}
        hasTrack={hasTrack}
      />
      <RouteInfoDialog
        open={routeInfoOpen}
        onOpenChange={setRouteInfoOpen}
        route={selectedRoute}
        onSaveName={handleSaveRouteName}
        onLoad={handleLoadRouteFromInfo}
        onDelete={handleRouteDeleted}
      />
      <DrawingDialog
        open={drawDialogOpen}
        onOpenChange={(open) => {
          setDrawDialogOpen(open);
          if (!open) setEditingDrawingIdx(null);
        }}
        initialLabel={editingDrawingIdx !== null ? drawings[editingDrawingIdx]?.label : ''}
        initialDescription={editingDrawingIdx !== null ? drawings[editingDrawingIdx]?.description : ''}
        color={editingDrawingIdx !== null ? (drawings[editingDrawingIdx]?.color || '#ef4444') : '#ef4444'}
        onSave={handleDrawingSave}
        onDelete={handleDrawingDelete}
        onRedraw={handleRedraw}
      />
      <SavedRoutesDrawer
        open={routesOpen}
        onOpenChange={setRoutesOpen}
        routes={savedRoutes}
        onLoad={handleLoadRoute}
        onDeleted={handleRouteDeleted}
        onRouteUpdated={loadRoutes}
      />

      <BottomTabBar />
    </div>
  );
}