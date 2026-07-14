// Spherical polygon area calculation (Chamberlain & Duquette algorithm).
// Returns area in square metres for an array of { lat, lon } points.

export function computeSphericalArea(points) {
  const R = 6378137; // WGS84 Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const n = points.length;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    total += toRad(p2.lon - p1.lon) * (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }
  return Math.abs((total * R * R) / 2);
}

export function isImperial() {
  try {
    return localStorage.getItem('weatherTempUnit') === 'fahrenheit';
  } catch {
    return false;
  }
}

export function formatDistance(km, imperial = false) {
  if (imperial) {
    const miles = km * 0.621371;
    if (miles < 1) return `${Math.round(miles * 5280).toLocaleString()} ft`;
    return `${miles.toFixed(2)} mi`;
  }
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

export function formatArea(m2, imperial = false) {
  if (imperial) {
    const sqft = m2 * 10.7639;
    if (sqft < 43560) return `${Math.round(sqft).toLocaleString()} ft²`;
    const acres = sqft / 43560;
    if (acres < 100) return `${acres.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ac`;
    return `${(sqft / 27878400).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mi²`;
  }
  if (m2 < 10000) return `${Math.round(m2).toLocaleString()} m²`;
  const ha = m2 / 10000;
  if (ha < 100) return `${ha.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
  return `${(m2 / 1000000).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} km²`;
}