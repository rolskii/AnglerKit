// Separate location store for the River Conditions page.
// This is independent from the shared location used by Home, Moon, and
// Weather pages, so selecting a different station here doesn't affect
// those pages.

const DEFAULT_LOCATION = { name: 'Toronto, ON', lat: 43.6532, lon: -79.3832 };

export function getRiverLocation() {
  // River location is fully independent from the shared (Home/Moon/Weather)
  // location. On first visit (no river station saved yet), seed from the
  // shared location once so the user starts nearby — but never write back
  // to the shared store.
  let name = localStorage.getItem('riverLocationName');
  let coordsStr = localStorage.getItem('riverLocationCoords');

  if (!name || !coordsStr) {
    // Seed from shared location on very first visit only
    const sharedName = localStorage.getItem('sharedLocationName');
    const sharedCoordsStr = localStorage.getItem('sharedLocationCoords');
    if (sharedName && sharedCoordsStr) {
      name = sharedName;
      coordsStr = sharedCoordsStr;
    }
  }

  if (!name) name = DEFAULT_LOCATION.name;

  let coords = DEFAULT_LOCATION;
  try {
    if (coordsStr) coords = JSON.parse(coordsStr);
  } catch (e) {
    coords = DEFAULT_LOCATION;
  }
  return { name, coords: { lat: coords.lat, lon: coords.lon, name } };
}

export function setRiverLocation(name, lat, lon) {
  const coords = { lat, lon, name };
  localStorage.setItem('riverLocationName', name);
  localStorage.setItem('riverLocationCoords', JSON.stringify(coords));
  window.dispatchEvent(new CustomEvent('riverLocationChanged', { detail: { name, lat, lon } }));
}