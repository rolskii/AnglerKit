// Builds a self-contained HTML card for sharing a map view — an embedded
// OpenStreetMap preview assembled from tiles, plus direct links to open the
// same spot in Apple Maps / Google Maps. The recipient doesn't need the app.

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Longitude/latitude → tile x/y at a given zoom (Web Mercator)
function lonToTileX(lon, z) {
  return ((lon + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z);
}

// Pick a zoom level whose vertical tile coverage is closest to the shared span
function zoomForSpan(spanLat, spanLon, lat) {
  for (let z = 17; z >= 3; z--) {
    const tilesY = spanLat / (360 / Math.pow(2, z));
    const tilesX = spanLon / (360 / Math.pow(2, z)) / Math.cos((lat * Math.PI) / 180);
    if (tilesY <= 2 && tilesX <= 2) return z;
  }
  return 3;
}

const LAYER_LABELS = {
  access: 'Fishing access points',
  ara: 'Waterbody lines',
  bathy: 'Lake depth contours',
  seamap: 'Nautical chart markers',
  routes: 'Saved routes',
};

export async function buildMapShareCardHtml({ lat, lon, spanLat, spanLon, layers = {}, screenshot = null, logoUrl = '' }) {
  if (lat == null || lon == null) throw new Error('No map view to share');

  const z = zoomForSpan(spanLat || 0.01, spanLon || 0.01, lat);
  const cx = lonToTileX(lon, z);
  const cy = latToTileY(lat, z);
  const n = 2; // tiles per side (2x2 grid ≈ 512px preview)

  const tileImgs = [];
  const x0 = Math.floor(cx - n / 2);
  const y0 = Math.floor(cy - n / 2);
  const wrap = Math.pow(2, z);
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const x = ((x0 + tx) % wrap + wrap) % wrap;
      const y = Math.max(0, Math.min(wrap - 1, y0 + ty));
      tileImgs.push(
        `<img src="https://tile.openstreetmap.org/${z}/${x}/${y}.png" alt="" loading="lazy" />`
      );
    }
  }

  const activeLayers = Object.entries(LAYER_LABELS)
    .filter(([k]) => layers[k])
    .map(([, label]) => `<span>${esc(label)}</span>`)
    .join('');

  const latStr = lat.toFixed(5);
  const lonStr = lon.toFixed(5);
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  const amapsUrl = `https://maps.apple.com/?ll=${lat},${lon}&q=Fishing%20Spot`;

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
  .head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 14px; border-bottom: 1px solid #e2e8f0; }
  .badge { width: 36px; height: 36px; border-radius: 10px; background: #1e5aa8; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; overflow: hidden; }
  .badge img { width: 100%; height: 100%; border-radius: 8px; object-fit: cover; display: block; }
  .shot { width: 100%; height: 100%; object-fit: cover; display: block; }
  h1 { margin: 0; font-size: 19px; }
  .coords { margin-top: 2px; color: #64748b; font-size: 13px; }
  .preview { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #dbe4ec; overflow: hidden; }
  .tiles { display: grid; grid-template-columns: 1fr 1fr; width: 100%; height: 100%; }
  .tiles img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .marker { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -100%); width: 26px; height: 26px; background: #f59e0b; border: 3px solid #fff; border-radius: 50% 50% 50% 0; transform: translate(-50%, -100%) rotate(-45deg); box-shadow: 0 2px 6px rgba(0,0,0,.4); }
  .badge-pin { position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; background: #fff; border-radius: 50%; transform: translate(-50%, -50%) rotate(45deg); }
  .layers { padding: 12px 20px 0; }
  .layers-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; margin-bottom: 6px; }
  .layers span { display: inline-block; margin: 0 6px 6px 0; padding: 4px 10px; border-radius: 999px; background: #f0fdfa; border: 1px solid #99f6e4; color: #0f766e; font-size: 12px; font-weight: 600; }
  .links { display: flex; gap: 10px; padding: 14px 20px 18px; }
  .links a { flex: 1; text-align: center; padding: 11px 12px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .g { background: #1e5aa8; color: #fff; }
  .a { background: #fff; color: #1e5aa8; border: 1px solid #cbd8e6; }
  footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 14px 0 4px; }
  .attribution { padding: 10px 20px 14px; color: #94a3b8; font-size: 11px; }
  .attribution a { color: #64748b; }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="badge"><img src="${esc(logoUrl)}" alt="AnglerKit" /></div>
      <div>
        <h1>Fishing Map</h1>
        <div class="coords">${latStr}, ${lonStr}</div>
      </div>
    </div>
    <div class="preview">
      ${screenshot
        ? `<img class="shot" src="${esc(screenshot)}" alt="Map view" />`
        : `<div class="tiles">${tileImgs.join('')}</div>`}
      <div class="marker"></div>
      <div class="badge-pin"></div>
    </div>
    ${activeLayers ? `<div class="layers"><div class="layers-title">Fishing layers in this view</div>${activeLayers}</div>` : ''}
    <div class="links">
      <a class="g" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
      <a class="a" href="${amapsUrl}" target="_blank" rel="noopener noreferrer">Open in Apple Maps</a>
    </div>
    <div class="attribution">${screenshot
      ? 'Live screenshot of the shared map view, including any active fishing layers.'
      : 'Map preview &copy; OpenStreetMap contributors — note: fishing overlays (depth contours, access points) are not shown in this preview.'}</div>
  </div>
  <footer>Shared from AnglerKit</footer>
</body>
</html>`;
}