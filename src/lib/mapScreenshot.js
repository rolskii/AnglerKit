// Map image capture for share cards. Both functions return base64 data URLs
// so the result can be embedded in a self-contained HTML file.
import html2canvas from 'html2canvas';
import { fetchAsDataUrl } from './imageDataUrl';

// Captures the live map container (including depth contours and other
// overlays drawn on top). Returns null when the capture fails or comes back
// (near-)blank — html2canvas can't read every WebGL map canvas.
export async function captureMapScreenshot(container) {
  if (!container) return null;
  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      logging: false,
      backgroundColor: null,
      scale: 1,
    });
    // Blank check: sample pixels; a map canvas that couldn't be read renders
    // (almost) entirely transparent.
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let visible = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 64) {
      total++;
      if (data[i] > 10) visible++;
    }
    if (total === 0 || visible / total < 0.02) return null;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

// Composes an OpenStreetMap preview (2x2 tiles, ~512px) around the given
// centre into a single embedded image. Used when the live capture isn't
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