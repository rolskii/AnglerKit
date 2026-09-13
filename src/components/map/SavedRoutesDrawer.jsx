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

  // Flatten every saved feature (routes, pins, areas, measurements) into one
  // sortable row — so the sort applies to what's actually visible in the list,
  // even when a single saved record holds several features.
  const rows = useMemo(() => {
    const list = [];
    routes.forEach((r) => {
      if ((r.track?.length || 0) > 0) {
        list.push({ kind: 'route', route: r, label: r.name || 'Unnamed', date: r.date, key: `${r.id}-route` });
      }
      (r.pins || []).forEach((pin, idx) => {
        list.push({
          kind: 'pin',
          route: r,
          pinIdx: idx,
          coords: [pin.lat, pin.lon],
          marker: pin.marker,
          label: pin.label || 'Unnamed',
          date: r.date,
          key: `${r.id}-pin-${idx}`,
        });
      });
      (r.areas || []).forEach((area, idx) => {
        const c = centerOfPoints(area.points);
        if (!c) return;
        list.push({
          kind: 'area',
          route: r,
          areaIdx: idx,
          coords: c,
          area_m2: area.area_m2,
          label: r.name || 'Unnamed',
          date: r.date,
          key: `${r.id}-area-${idx}`,
        });
      });
      (r.measurements || []).forEach((m, idx) => {
        const c = centerOfPoints(m.points);
        if (!c) return;
        list.push({
          kind: 'meas',
          route: r,
          coords: c,
          distance_km: m.distance_km,
          label: r.name || 'Unnamed',
          date: r.date,
          key: `${r.id}-meas-${idx}`,
        });
      });
    });
    return list;
  }, [routes]);

  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name' | 'type'
  // Sort by the trip date shown on each row (falls back to when it was saved)
  const recDate = (row) => {
    const t = row.date ? new Date(row.date + 'T00:00:00').getTime() : NaN;
    return isNaN(t)
      ? new Date(row.route.updated_date || row.route.created_date || 0).getTime()
      : t;
  };
  // Type groups: Routes, Fish spots, Pins, Areas, Measurements
  const typeRank = (row) => {
    if (row.kind === 'route') return 0;
    if (row.kind === 'pin' && row.marker === 'fish') return 1;
    if (row.kind === 'pin') return 2;
    if (row.kind === 'area') return 3;
    return 4;
  };

  const sortedRows = useMemo(() => {
    const list = [...rows];
    if (sortBy === 'name') {
      list.sort((a, b) => (a.label || '').localeCompare(b.label || '', undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => recDate(a) - recDate(b));
    } else if (sortBy === 'type') {
      list.sort((a, b) => typeRank(a) - typeRank(b) || recDate(b) - recDate(a));
    } else {
      list.sort((a, b) => recDate(b) - recDate(a));
    }
    return list;
  }, [rows, sortBy]);

  const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'name', label: 'Name A–Z' },
    { id: 'type', label: 'Type' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Saved Routes & Pins</SheetTitle>
        </SheetHeader>
        {rows.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2">
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
          {sortedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No saved routes or pins yet. Drop pins on the map and save them!</p>
          ) : (
            sortedRows.map((row) => {
              const r = row.route;

              // Route header row — navigates to the whole route's bounding box
              if (row.kind === 'route') {
                const pinCount = r.pins?.length || 0;
                const areaCount = r.areas?.length || 0;
                const measureCount = r.measurements?.length || 0;
                return (
                  <div key={row.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                    <button onClick={() => onLoad(r)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                        <Route className="w-5 h-5 text-primary" />
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
                );
              }

              // Pin row
              if (row.kind === 'pin') {
                return (
                  <div key={row.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                    <button onClick={() => onLoad(r, row.coords)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${row.marker === 'fish' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                        {row.marker === 'fish'
                          ? <FishIcon className="w-5 h-5 text-emerald-500" />
                          : <MapPin className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.label}</p>
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
                      href={`https://maps.apple.com/?daddr=${row.coords[0]},${row.coords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                      title="Navigate to this location"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeletePin(r, row.pinIdx)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              // Area row
              if (row.kind === 'area') {
                return (
                  <div key={row.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                    <button onClick={() => onLoad(r, row.coords)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10">
                        <Hexagon className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.label}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {row.area_m2 != null && <span>{formatArea(row.area_m2, isImperial())}</span>}
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
                      href={`https://maps.apple.com/?daddr=${row.coords[0]},${row.coords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                      title="Navigate to this location"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteArea(r, row.areaIdx)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              // Measurement row
              const isMeasOnly =
                (r.track?.length || 0) === 0 && (r.pins?.length || 0) === 0 && (r.areas?.length || 0) === 0;
              return (
                <div key={row.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors">
                  <button onClick={() => onLoad(r, row.coords)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                      <Ruler className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{row.label}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {row.distance_km != null && <span>{formatDistance(row.distance_km, isImperial())}</span>}
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
                    href={`https://maps.apple.com/?daddr=${row.coords[0]},${row.coords[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                    title="Navigate to this location"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                  {isMeasOnly && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}