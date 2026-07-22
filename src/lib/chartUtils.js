// Builds a smooth SVG path through a series of {x, y} points using
// Catmull-Rom-derived tangents (each point's tangent is based on the slope
// between its neighbors). This avoids the "wavy"/overshooting look that a
// naive per-segment cubic-Bezier flattening technique produces on largely
// monotonic data (e.g. a water-level or temperature curve).
//
// tension controls how tightly the curve hugs straight lines between
// points — higher tension = straighter segments, lower = more curve.
export function buildSmoothPath(points, tension = 6) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const c1x = p1.x + (p2.x - p0.x) / tension;
    const c1y = p1.y + (p2.y - p0.y) / tension;
    const c2x = p2.x - (p3.x - p1.x) / tension;
    const c2y = p2.y - (p3.y - p1.y) / tension;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

// Smooth SVG path through points using midpoint-quadratic beziers.
// Unlike Catmull-Rom, the curve never overshoots because it passes through
// *midpoints* between consecutive points (using the actual points as
// quadratic control points). This makes it ideal for sparse data (e.g.
// daily-mean overlays with only 7 points) where Catmull-Rom creates wavy
// artifacts.
export function buildMidpointSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  let d = `M ${points[0].x} ${points[0].y}`;
  // Line to first midpoint, then quadratic beziers through each control point
  const firstMid = mid(points[0], points[1]);
  d += ` L ${firstMid.x} ${firstMid.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const m = mid(points[i], points[i + 1]);
    d += ` Q ${points[i].x} ${points[i].y}, ${m.x} ${m.y}`;
  }
  // Line to last point
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

// Generates Y-axis ticks at a fixed value interval (e.g. every 0.05 m for
// water level). Ticks are positioned within the [min, max] range mapped to
// [usableTop, usableBottom]. Returns [{ y, label }] where label is the
// value formatted to 2 decimal places.
export function generateFixedIntervalTicks(min, max, interval, usableTop, usableBottom) {
  const range = max - min || 1;
  const usableHeight = usableBottom - usableTop;
  const start = Math.ceil(min / interval) * interval;
  const end = Math.floor(max / interval) * interval;
  const ticks = [];
  for (let v = start; v <= end + interval * 0.001; v += interval) {
    const y = usableBottom - ((v - min) / range) * usableHeight;
    ticks.push({ y, label: v.toFixed(2) });
  }
  return ticks;
}