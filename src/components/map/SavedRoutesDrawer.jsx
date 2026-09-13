import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MapPin, Route, Trash2, Calendar, Navigation, Ruler, Hexagon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FishIcon from '@/components/FishIcon';
import { formatDistance, formatArea, isImperial } from '@/lib/sphericalArea';

// Bounding-box center of an arbitrary list of {lat, lon} points.
// Returns null if there are no usable points.
function centerOfPoints(points) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) return [points[0].lat, points[0].lon];
  const lats = points.map((p) => p.lat).filter((v) => typeof v === 'number' && !isNaN(v));
  const lons = points.map((p) => p.lon).filter((v) => typeof v === 'number' && !isNaN(v));
  if (lats.length === 0 || lons.length === 0) return null;
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lons) + Math.max(...lons)) / 2,
  ];
}

export default function SavedRoutesDrawer({ open, onOpenChange, routes, onLoad, onDeleted, onRouteUpdated }) {
  const handleDelete = async (id) => {
    try {
      await base44.entities.MapCourse.delete(id);
      onDeleted(id);
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const handleDeletePin = async (route, pinIdx) => {
    const updatedPins = route.pins.filter((_, i) => i !== pinIdx);
    try {
      if (updatedPins.length === 0) {
        await base44.entities.MapCourse.delete(route.id);
        onDeleted(route.id);
      } else {
        await base44.entities.MapCourse.update(route.id, { pins: updatedPins });
        if (onRouteUpdated) onRouteUpdated();
      }
    } catch (e) {
      console.error('Failed to delete pin:', e);
    }
  };

  const handleDeleteArea = async (route, areaIdx) => {
    const updatedAreas = (route.areas || []).filter((_, i) => i !== areaIdx);
    try {
      if (updatedAreas.length === 0) {
        await base44.entities.MapCourse.delete(route.id);
        onDeleted(route.id);
      } else {
        await base44.entities.MapCourse.update(route.id, { areas: updatedAreas });
        if (onRouteUpdated) onRouteUpdated();
      }
    } catch (e) {
      console.error('Failed to delete area:', e);
    }
  };

  const fmtDate = (date) =>
    date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name'
  const sortedRoutes = useMemo(() => {
    const list = [...routes];
    if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.updated_date || a.created_date || 0) - new Date(b.updated_date || b.created_date || 0));
    } else {
      list.sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));
    }
    return list;
  }, [routes, sortBy]);

  const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'name', label: 'Name A–Z' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Saved Routes & Pins</SheetTitle>
        </SheetHeader>
        {routes.length > 1 && (
          <div className="flex items-center gap-1.5 px-2 pb-2">
            <span className="text-xs text-muted-foreground shrink-0">Sort</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  sortBy === opt.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <div className="overflow-y-auto flex-1 mt-2 space-y-0.5">
          {sortedRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No saved routes or pins yet. Drop pins on the map and save them!</p>
          ) : (
            sortedRoutes.map((r) => {
              const hasTrack = (r.track?.length || 0) > 0;
              const pinCount = r.pins?.length || 0;
              const areaCount = r.areas?.length || 0;
              const measureCount = r.measurements?.length || 0;

              // Pins-only route: keep the original flat per-pin rows
              if (!hasTrack && pinCount > 0 && areaCount === 0 && measureCount === 0) {
                return r.pins.map((pin, pIdx) => (
                  <div key={`${r.id}-${pIdx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                    <button onClick={() => onLoad(r, [pin.lat, pin.lon])} className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pin.marker === 'fish' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                        {pin.marker === 'fish'
                          ? <FishIcon className="w-5 h-5 text-emerald-500" />
                          : <MapPin className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{pin.label || 'Unnamed'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {r.date && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {fmtDate(r.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <a
                      href={`https://maps.apple.com/?daddr=${pin.lat},${pin.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                      title="Navigate to this location"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeletePin(r, pIdx)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ));
              }

              // Area-only route: one flat row per saved area, just like pins
              if (!hasTrack && pinCount === 0 && measureCount === 0 && areaCount > 0) {
                return (r.areas || []).map((area, aIdx) => {
                  const c = centerOfPoints(area.points);
                  if (!c) return null;
                  return (
                    <div key={`${r.id}-area-${aIdx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                      <button onClick={() => onLoad(r, c)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10">
                          <Hexagon className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {area.area_m2 != null && <span>{formatArea(area.area_m2, isImperial())}</span>}
                            {r.date && (
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                {fmtDate(r.date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <a
                        href={`https://maps.apple.com/?daddr=${c[0]},${c[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                        title="Navigate to this location"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteArea(r, aIdx)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                });
              }

              // Any other route: a header row for the whole route, then a
              // navigable child row for each pin / area / measurement so every
              // saved feature is reachable directly — just like pins.
              const children = [];
              (r.pins || []).forEach((pin, idx) => {
                children.push({
                  key: `pin-${idx}`,
                  coords: [pin.lat, pin.lon],
                  icon: pin.marker === 'fish'
                    ? <FishIcon className="w-4 h-4 text-emerald-500" />
                    : <MapPin className="w-4 h-4 text-amber-500" />,
                  bg: pin.marker === 'fish' ? 'bg-emerald-500/10' : 'bg-amber-500/10',
                  label: pin.label || `Pin ${idx + 1}`,
                });
              });
              (r.areas || []).forEach((area, idx) => {
                const c = centerOfPoints(area.points);
                if (!c) return;
                children.push({
                  key: `area-${idx}`,
                  coords: c,
                  icon: <Hexagon className="w-4 h-4 text-primary" />,
                  bg: 'bg-primary/10',
                  label: area.label || `Area ${idx + 1}`,
                });
              });
              (r.measurements || []).forEach((m, idx) => {
                const c = centerOfPoints(m.points);
                if (!c) return;
                children.push({
                  key: `meas-${idx}`,
                  coords: c,
                  icon: <Ruler className="w-4 h-4 text-primary" />,
                  bg: 'bg-primary/10',
                  label: m.label || `Measurement ${idx + 1}`,
                });
              });

              // A saved record with no GPS track and only areas is an area
              // save — show the area icon, not the route icon.
              const isAreaOnly = !hasTrack && pinCount === 0 && measureCount === 0 && areaCount > 0;
              return (
                <div key={r.id} className="space-y-0.5">
                  {/* Route header — navigates to the whole route's bounding box */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                    <button
                      onClick={() => onLoad(r)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                      disabled={children.length === 0 && !hasTrack}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAreaOnly ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                        {isAreaOnly
                          ? <Hexagon className="w-5 h-5 text-emerald-500" />
                          : <Route className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {r.date && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {fmtDate(r.date)}
                            </span>
                          )}
                          {r.distance_km != null && r.distance_km > 0 && <span>{formatDistance(r.distance_km, isImperial())}</span>}
                          {pinCount > 0 && (
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{pinCount}</span>
                          )}
                          {measureCount > 0 && (
                            <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" />{measureCount}</span>
                          )}
                          {areaCount > 0 && (
                            <span className="flex items-center gap-0.5"><Hexagon className="w-3 h-3" />{areaCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* One navigable row per saved feature */}
                  {children.map((child) => (
                    <div key={`${r.id}-${child.key}`} className="flex items-center gap-3 pl-11 pr-2 py-1.5 rounded-lg hover:bg-accent/10 transition-colors">
                      <button
                        onClick={() => onLoad(r, child.coords)}
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                      >
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${child.bg}`}>
                          {child.icon}
                        </div>
                        <p className="text-sm truncate">{child.label}</p>
                      </button>
                      <a
                        href={`https://maps.apple.com/?daddr=${child.coords[0]},${child.coords[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                        title="Navigate to this location"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}