// Separate location store for the River Conditions page.
// This is independent from the shared location used by Home, Moon, and
// Weather pages, so selecting a different station here doesn't affect
// those pages.

const DEFAULT_LOCATION = { name: 'Toronto, ON', lat: 43.6532, lon: -79.3832 };

export function getRiverLocation() {
  // Fall back to the shared location if no river-specific location has been
  // saved yet, so the first visit starts from wherever the user already is.
  const name =
    localStorage.getItem('riverLocationName') ||
    localStorage.getItem('sharedLocationName') ||
    DEFAULT_LOCATION.name;
  const coordsStr =
    localStorage.getItem('riverLocationCoords') ||
    localStorage.getItem('sharedLocationCoords');
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