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
