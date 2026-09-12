// Builds a self-contained HTML "map card" for sharing a map view — a static
// OpenStreetMap image (tiles embedded as a data URL) with a pin at the exact
// spot and the shared region outlined, plus direct links to open it in Apple
// or Google Maps. Recipients don't need the app installed.

const LAYER_LABELS = {
  access: 'Fishing Access Points',
  ara: 'Aquatic Resource Lines',
  bathy: 'Lake Depth Contours',
  seamap: 'Nautical Chart',
  routes: 'Saved Routes',
};

const TILE = 256;
const GRID = 3; // 3x3 tile grid

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const lonToTileX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const latToTileY = (lat, z) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
};

const loadTileImage = (z, x, y) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('tile failed'));
    img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  });

// Compose a static map around the shared centre from a small OSM tile grid,
// draw the region outline + centre pin, and return a PNG data URL. Throws if
// the canvas can't be exported (failed tiles) — caller falls back to no image.
async function buildStaticMapDataUrl(lat, lon, spanLat, spanLon) {
  // Zoom where the shared region roughly fills the image with a margin.
  const z = Math.max(3, Math.min(17, Math.round(Math.log2(648 / Math.max(spanLon, 0.0005)))));
  const n = 2 ** z;
  const cx = lonToTileX(lon, z);
  const cy = latToTileY(lat, z);
  const x0 = Math.floor(cx) - 1;
  const y0 = Math.floor(cy) - 1;

  const canvas = document.createElement('canvas');
  canvas.width = TILE * GRID;
  canvas.height = TILE * GRID;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await Promise.all(
    Array.from({ length: GRID * GRID }, async (_, i) => {
      const tx = x0 + (i % GRID);
      const ty = y0 + Math.floor(i / GRID);
      try {
        const img = await loadTileImage(z, ((tx % n) + n) % n, Math.max(0, Math.min(n - 1, ty)));
        ctx.drawImage(img, (tx - x0) * TILE, (ty - y0) * TILE);
      } catch (e) {
        // leave the placeholder fill for this tile
      }
    })
  );

  const px = (cx - x0) * TILE;
  const py = (cy - y0) * TILE;

  // Shared region outline (the area the sender was viewing)
  const rectW = ((spanLon * n) / 360) * TILE;
  const yTop = latToTileY(lat + spanLat / 2, z);
  const yBot = latToTileY(lat - spanLat / 2, z);
  const rectH = (yBot - yTop) * TILE;
  ctx.setLineDash([7, 5]);
  ctx.strokeStyle = 'rgba(30, 90, 168, 0.95)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(px - rectW / 2, py - rectH / 2, rectW, rectH);

  // Centre pin
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(px, py, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  // Attribution
  const attr = '© OpenStreetMap contributors';
  ctx.font = '11px -apple-system, sans-serif';
  const tw = ctx.measureText(attr).width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(canvas.width - tw - 14, canvas.height - 20, tw + 10, 16);
  ctx.fillStyle = '#475569';
  ctx.fillText(attr, canvas.width - tw - 9, canvas.height - 8);

  return canvas.toDataURL('image/png');
}

// Builds the full shareable HTML page. `layers` is the map's enabled-layer
// state ({ access, ara, bathy, seamap, routes }).
export async function buildMapShareCardHtml({ lat, lon, spanLat = 0.02, spanLon = 0.02, layers = {} }) {
  let mapImg = null;
  try {
    mapImg = await buildStaticMapDataUrl(lat, lon, spanLat, spanLon);
  } catch (e) {
    mapImg = null;
  }

  const latStr = lat.toFixed(5);
  const lonStr = lon.toFixed(5);
  const chips = Object.entries(LAYER_LABELS)
    .filter(([key]) => layers[key])
    .map(([, label]) => `<span class="chip">${esc(label)}</span>`)
    .join('');
  const appleUrl = `https://maps.apple.com/?ll=${latStr},${lonStr}&q=${encodeURIComponent('Fishing spot')}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${latStr},${lonStr}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Fishing Map — ${latStr}, ${lonStr}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #eef2f6; color: #0f172a; padding: 20px; }
  .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15,23,42,.08); overflow: hidden; }
  .head { padding: 18px 20px 14px; border-bottom: 1px solid #e2e8f0; }
  h1 { margin: 0; font-size: 20px; }
  .coords { margin-top: 2px; color: #64748b; font-size: 14px; }
  .map img { width: 100%; display: block; }
  .body { padding: 16px 20px 18px; }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; margin: 14px 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eef6ff; color: #1e5aa8; font-size: 12px; font-weight: 600; }
  .links a { display: block; margin-top: 8px; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: #1e5aa8; font-weight: 600; font-size: 14px; }
  .links a span { display: block; font-weight: 400; color: #94a3b8; font-size: 12px; margin-top: 1px; }
  footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 14px 0 4px; }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <h1>Fishing Map</h1>
      <div class="coords">${latStr}, ${lonStr}</div>
    </div>
    ${mapImg ? `<div class="map"><img src="${mapImg}" alt="Map of the shared fishing spot" /></div>` : ''}
    <div class="body">
      ${chips ? `<div><div class="label">Layers shown</div><div class="chips">${chips}</div></div>` : ''}
      <div class="label">Open this spot</div>
      <div class="links">
        <a href="${appleUrl}">Open in Apple Maps<span>Exact location — ${latStr}, ${lonStr}</span></a>
        <a href="${googleUrl}">Open in Google Maps<span>Exact location — ${latStr}, ${lonStr}</span></a>
      </div>
    </div>
  </div>
  <footer>Shared from AnglerKit · Map data © OpenStreetMap contributors</footer>
</body>
</html>`;
}