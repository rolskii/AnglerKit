/* global mapkit */
import { base44 } from '@/api/base44Client';

// Shared MapKit JS loader — ensures the script and mapkit.init() run only once
// across the entire app (MapView + LocationMapPicker).

let mapkitLoaded = false;
let mapkitLoadPromise = null;
let mapkitInitialized = false;

export function loadMapKit() {
  if (mapkitLoaded) return Promise.resolve();
  if (mapkitLoadPromise) return mapkitLoadPromise;

  mapkitLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.onload = () => {
      mapkitLoaded = true;
      resolve();
    };
    script.onerror = () => {
      mapkitLoadPromise = null; // allow retry
      reject(new Error('Failed to load MapKit JS script'));
    };
    document.head.appendChild(script);
  });
  return mapkitLoadPromise;
}

export function ensureMapKitInit() {
  if (mapkitInitialized) return;
  mapkit.init({
    authorizationCallback: (done) => {
      const origin = window.location.hostname || '*';
      base44.functions.invoke('applemaps', { mode: 'mapkit_token', origin })
        .then((res) => done(res.data.token))
        .catch((err) => console.error('MapKit token fetch failed:', err));
    },
  });
  mapkitInitialized = true;
}

export async function prepareMapKit() {
  await loadMapKit();
  ensureMapKitInit();
  // Wait a frame for the container to be laid out
  await new Promise((r) => requestAnimationFrame(r));
}