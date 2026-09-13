// Collects the map's active overlays (depth contours, waterbody lines, access
// points, tracks, saved routes, drawings, measurements, areas and pins) in the
// plain shape the share image draws — coordinate lists with the same colors
// the live map uses.

const ROUTE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

// Depth → stroke color, matching the live map's contour palette.
const bathyColor = (depthFt) =>
  depthFt <= 10 ? '#38bdf8' : depthFt <= 20 ? '#0ea5e9' : depthFt <= 40 ? '#0284c7' : depthFt <= 65 ? '#1d4ed8' : '#1e3a8a';

const featurePaths = (geom) => (!geom ? [] : geom.type === 'MultiLineString' ? geom.coordinates : [geom.coordinates]);

const toPoints = (path) =>
  (path || []).filter((c) => Array.isArray(c) && c.length >= 2).map((c) => ({ lat: c[1], lon: c[0] }));

export function buildShareOverlays({
  showBathy,
  bathyLines,
  showAraLines,
  araLines,
  showAccessPoints,
  accessPoints,
  showAllRoutes,
  savedRoutes,
  trackPoints,
  pins,
  drawings,
  savedMeasurements,
  measurePoints,
  savedAreas,
  areaPoints,
}) {
  const lines = [];
  const markers = [];

  if (showBathy) {
    (bathyLines || []).forEach((feat) => {
      const depthFt = Math.abs(feat.properties?.DEPTH ?? 0) * 3.28084;
      const color = bathyColor(depthFt);
      featurePaths(feat.geometry).forEach((path) => {
        const points = toPoints(path);
        if (points.length >= 2) lines.push({ points, color, lineWidth: 2 });
      });
    });
  }

  if (showAraLines) {
    (araLines || []).forEach((feat) => {
      featurePaths(feat.geometry).forEach((path) => {
        const points = toPoints(path);
        if (points.length >= 2) lines.push({ points, color: '#0e8c73', lineWidth: 2 });
      });
    });
  }

  if (showAllRoutes) {
    (savedRoutes || []).forEach((route, idx) => {
      if (!route.track || route.track.length < 2) return;
      lines.push({ points: route.track, color: ROUTE_COLORS[idx % ROUTE_COLORS.length], lineWidth: 4 });
    });
  }

  if (trackPoints && trackPoints.length >= 2) {
    lines.push({ points: trackPoints, color: '#2563eb', lineWidth: 4 });
  }

  (drawings || []).forEach((stroke) => {
    if (stroke.points && stroke.points.length >= 2) {
      lines.push({ points: stroke.points, color: stroke.color || '#ef4444', lineWidth: 3 });
    }
  });

  (savedMeasurements || []).forEach((m) => {
    if (m.points && m.points.length >= 2) {
      lines.push({ points: m.points, color: '#3b82f6', lineWidth: 3, dash: [6, 6] });
    }
  });
  if (measurePoints && measurePoints.length >= 2) {
    lines.push({ points: measurePoints, color: '#3b82f6', lineWidth: 3, dash: [6, 6] });
  }

  (savedAreas || []).forEach((a) => {
    if (!a.points || a.points.length < 3) return;
    lines.push({ points: [...a.points, a.points[0]], color: '#10b981', lineWidth: 2, fill: 'rgba(16,185,129,0.15)' });
  });
  if (areaPoints && areaPoints.length >= 3) {
    lines.push({ points: [...areaPoints, areaPoints[0]], color: '#10b981', lineWidth: 3, fill: 'rgba(16,185,129,0.2)' });
  }

  (pins || []).forEach((pin) => {
    markers.push({ lat: pin.lat, lon: pin.lon, color: pin.marker === 'fish' ? '#1B754A' : '#f59e0b', label: pin.label });
  });
  if (showAccessPoints) {
    (accessPoints || []).forEach((feat) => {
      const c = feat.geometry?.coordinates;
      if (Array.isArray(c) && c.length >= 2) markers.push({ lat: c[1], lon: c[0], color: '#8b5cf6' });
    });
  }

  return { lines, markers };
}