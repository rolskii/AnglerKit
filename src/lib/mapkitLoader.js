/* global mapkit */
import { base44 } from '@/api/base44Client';

// Shared MapKit JS loader — fetches the script via the backend proxy (same origin)
// and injects it as a blob URL to bypass CSP / cross-origin script restrictions.

let mapkitLoadPromise = null;
let mapkitInitialized = false;

export function loadMapKit() {
  // If mapkit is already available (loaded via index.html or a previous call), resolve immediately
  if (typeof mapkit !== 'undefined') {
    return Promise.resolve();
  }
  if (mapkitLoadPromise) return mapkitLoadPromise;

  mapkitLoadPromise = (async () => {
    try {
      // Try 1: Fetch via SDK (same-origin, works in preview + production)
      try {
        const res = await base44.functions.invoke('mapkitjs', {});
        const scriptText = typeof res.data === 'string' ? res.data : res.data?.script || res.data;
        if (scriptText && typeof scriptText === 'string' && scriptText.length > 1000) {
          await injectScriptText(scriptText);
          if (typeof mapkit !== 'undefined') return;
        }
      } catch (e) {
        console.warn('SDK script fetch failed, trying CDN fallback:', e?.message);
      }

      // Try 2: Direct CDN fetch + blob (bypasses script-src CSP via same-origin blob)
      try {
        const fetchRes = await fetch('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js');
        if (fetchRes.ok) {
          const text = await fetchRes.text();
          await injectScriptText(text);
          if (typeof mapkit !== 'undefined') return;
        }
      } catch (e) {
        console.warn('CDN fetch failed:', e?.message);
      }

      // Try 3: Direct CDN script tag (last resort)
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load MapKit JS from all sources'));
        document.head.appendChild(s);
      });

      if (typeof mapkit === 'undefined') {
        throw new Error('MapKit JS loaded but mapkit global is not defined');
      }
    } catch (err) {
      mapkitLoadPromise = null; // allow retry
      throw err;
    }
  })();

  return mapkitLoadPromise;
}

function injectScriptText(text) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([text], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    script.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to execute MapKit JS blob'));
    };
    document.head.appendChild(script);
  });
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