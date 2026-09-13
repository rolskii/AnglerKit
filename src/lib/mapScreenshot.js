// Map preview images for share cards, returned as base64 data URLs so they can
// be embedded in a self-contained HTML file.
//
// MapKit JS renders Apple's map imagery in a GPU/WebGL layer that html2canvas
// cannot read (the background comes back blank), so a pixel-perfect in-browser
// screenshot isn't possible. Instead the share card rebuilds the same view
// server-side with Apple's Maps Web Snapshots service (same centre, span and
// map type — satellite / hybrid / standard) and draws the active fishing
// overlays on top of that image, in the same colors the live map uses.
import { base44 } from '@/api/base44Client';
import { fetchAsDataUrl } from './imageDataUrl';

// The snapshot image covers centre ± span/2 on both axes, so lat/lon map
// linearly onto its pixels.
const project = (p, view, w, h) => [
  ((p.lon - (view.lon - view.spanLon / 2)) / view.spanLon) * w,
  (((view.lat + view.spanLat / 2) - p.lat) / view.spanLat) * h,
];

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const computeSize = (aspectRatio) => {
  const h = 640;
  const w = Math.max(50, Math.min(640, Math.round(h * aspectRatio)));
  return { w, h };
};

// Fetches a static Apple Maps image of the given view through the applemaps
// backend function. Returns the PNG data URL, or null on any failure.
export async function fetchAppleMapSnapshot({ lat, lon, spanLat, spanLon, mapType, aspectRatio }) {
  const { w, h } = computeSize(aspectRatio);
  try {
    const res = await base44.functions.invoke('applemaps', {
      mode: 'snapshot',
      lat,
      lon,
      spanLat,
      spanLon,
      sizeW: w,
      sizeH: h,
      mapType,
    });
    const image = res?.data?.image;
    return typeof image === 'string' && image.startsWith('data:image') ? image : null;
  } catch {
    return null;
  }
}

// The share image: an Apple Maps snapshot of the current view with the active
// overlays drawn on top — a faithful reproduction of what the user sees.
// Returns null when the background snapshot can't be fetched.
export async function buildShareImage({
  lat,
  lon,
  spanLat,
  spanLon,
  mapType,
  aspectRatio = 0.75,
  lines = [],
  markers = [],
}) {
  const bg = await fetchAppleMapSnapshot({ lat, lon, spanLat, spanLon, mapType, aspectRatio });
  if (!bg) return null;
  const { w, h } = computeSize(aspectRatio);
  const view = { lat, lon, spanLat, spanLon };
  try {
    const img = await loadImage(bg);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    lines.forEach((line) => {
      if (!line.points || line.points.length < 2) return;
      ctx.beginPath();
      line.points.forEach((p, i) => {
        const [x, y] = project(p, view, w, h);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      if (line.fill) {
        ctx.fillStyle = line.fill;
        ctx.fill();
      }
      ctx.strokeStyle = line.color || '#dc2626';
      ctx.lineWidth = line.lineWidth || 2;
      ctx.setLineDash(line.dash || []);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Markers drawn last, on top of the lines.
    markers.forEach((m) => {
      const [x, y] = project(m, view, w, h);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      if (m.label) {
        ctx.font = '600 12px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(m.label, x, y - 14);
        ctx.fillStyle = '#1f2937';
        ctx.fillText(m.label, x, y - 14);
      }
    });

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// Composes an OpenStreetMap preview (2x2 tiles, ~512px) around the given
// centre into a single embedded image. Used when the Apple snapshot isn't
// available — still fully self-contained, no remote <img> tags.
const TILE = 256;

function lonToTileX(lon, z) {
  return ((lon + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z);
}

function zoomForSpan(spanLat, spanLon, lat) {
  for (let z = 17; z >= 3; z--) {
    const tilesY = spanLat / (360 / Math.pow(2, z));
    const tilesX = spanLon / (360 / Math.pow(2, z)) / Math.cos((lat * Math.PI) / 180);
    if (tilesY <= 2 && tilesX <= 2) return z;
  }
  return 3;
}

export async function buildOsmPreviewDataUrl({ lat, lon, spanLat, spanLon }) {
  try {
    const z = zoomForSpan(spanLat || 0.01, spanLon || 0.01, lat);
    const cx = lonToTileX(lon, z);
    const cy = latToTileY(lat, z);
    const n = 2;
    const canvas = document.createElement('canvas');
    canvas.width = n * TILE;
    canvas.height = n * TILE;
    const ctx = canvas.getContext('2d');
    const wrap = Math.pow(2, z);
    const x0 = Math.floor(cx - n / 2);
    const y0 = Math.floor(cy - n / 2);

    const tileResults = await Promise.all(
      Array.from({ length: n * n }, (_, i) => {
        const tx = i % n;
        const ty = Math.floor(i / n);
        const x = ((x0 + tx) % wrap + wrap) % wrap;
        const y = Math.max(0, Math.min(wrap - 1, y0 + ty));
        // Fetched via fetch() (CORS-clean) and re-encoded as a data URL so
        // drawing them keeps the canvas untainted and fully embeddable.
        return fetchAsDataUrl(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`).then((d) => d && [tx, ty, d]);
      })
    );
    const tiles = tileResults.filter(Boolean);
    if (!tiles.length) return null;

    await Promise.all(
      tiles.map(([tx, ty, dataUrl]) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, tx * TILE, ty * TILE);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        })
      )
    );
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}