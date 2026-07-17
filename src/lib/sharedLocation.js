// Unified location store shared across Home, Moon, Weather, and Map pages.
// All pages read from and write to the same keys so a location change on
// any page is reflected everywhere.

const DEFAULT_LOCATION = { name: 'Toronto, ON', lat: 43.6532, lon: -79.3832 };

export function getSharedLocation() {
  const name =
    localStorage.getItem('sharedLocationName') ||
    localStorage.getItem('moonLocation') ||
    localStorage.getItem('weatherLocation') ||
    DEFAULT_LOCATION.name;
  const coordsStr =
    localStorage.getItem('sharedLocationCoords') ||
    localStorage.getItem('moonCoords') ||
    localStorage.getItem('weatherCoords');
  let coords = DEFAULT_LOCATION;
  try {
    if (coordsStr) coords = JSON.parse(coordsStr);
  } catch (e) {
    coords = DEFAULT_LOCATION;
  }
  return { name, coords: { lat: coords.lat, lon: coords.lon, name } };
}

export function setSharedLocation(name, lat, lon) {
  const coords = { lat, lon, name };
  // Write to the unified keys AND the legacy per-page keys so any page
  // that hasn't been updated yet still finds the location.
  localStorage.setItem('sharedLocationName', name);
  localStorage.setItem('sharedLocationCoords', JSON.stringify(coords));
  localStorage.setItem('moonLocation', name);
  localStorage.setItem('moonCoords', JSON.stringify(coords));
  localStorage.setItem('weatherLocation', name);
  localStorage.setItem('weatherCoords', JSON.stringify(coords));
  // Notify any currently-mounted listeners (same-tab, non-storage event).
  window.dispatchEvent(new CustomEvent('sharedLocationChanged', { detail: { name, lat, lon } }));
}