// Shared map links: encode the exact view (centre + zoom) and which fishing
// layers were on, so the recipient's map opens the same way.

// All shareable layer toggles — order defines the URL order.
const LAYER_KEYS = ['access', 'ara', 'bathy', 'seamap', 'routes'];

// Builds a /map URL carrying the current region and enabled layers.
// `region` is MapKit's CoordinateRegion shape: center + span (degrees).
export function buildMapShareUrl(region, layers = {}) {
  const params = new URLSearchParams({
    c: `${region.latitude.toFixed(5)},${region.longitude.toFixed(5)}`,
    z: `${(region.latitudeDelta || 0.02).toFixed(5)},${(region.longitudeDelta || 0.02).toFixed(5)}`,
  });
  const on = LAYER_KEYS.filter((k) => layers[k]);
  if (on.length) params.set('l', on.join(','));
  return `${window.location.origin}/map?${params.toString()}`;
}

// Parses the query params of a shared map link. Returns null when the current
// URL isn't a shared link.
export function parseMapShareParams(search = window.location.search) {
  const p = new URLSearchParams(search);
  const rawC = p.get('c');
  if (!rawC) return null;
  const [lat, lon] = rawC.split(',').map(Number);
  if (!isFinite(lat) || !isFinite(lon)) return null;

  const [spanLat, spanLon] = (p.get('z') || '0.02,0.02').split(',').map(Number);
  const layerList = (p.get('l') || '').split(',').filter(Boolean);
  const layers = {};
  LAYER_KEYS.forEach((k) => {
    layers[k] = layerList.includes(k);
  });

  return {
    lat,
    lon,
    spanLat: isFinite(spanLat) && spanLat > 0 ? spanLat : 0.02,
    spanLon: isFinite(spanLon) && spanLon > 0 ? spanLon : 0.02,
    layers,
  };
}