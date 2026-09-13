// Builds a self-contained HTML card for sharing a map view. All images are
// embedded as base64 data URLs (an Apple Maps image of the shared view with
// the active fishing layers drawn in, or an OpenStreetMap preview as backup),
// so the card renders everywhere — even in file previews that block remote
// images — and the recipient needs no app.
// Direct links open the same spot in Apple Maps / Google Maps.

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LAYER_LABELS = {
  access: 'Fishing access points',
  ara: 'Waterbody lines',
  bathy: 'Lake depth contours',
  seamap: 'Nautical chart markers',
  routes: 'Saved routes',
};

export async function buildMapShareCardHtml({
  lat,
  lon,
  layers = {},
  previewImage = null,
  isScreenshot = false,
  logoDataUrl = '',
}) {
  if (lat == null || lon == null) throw new Error('No map view to share');

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
  h1 { margin: 0; font-size: 19px; }
  .coords { margin-top: 2px; color: #64748b; font-size: 13px; }
  .preview { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #dbe4ec; overflow: hidden; }
  .shot { width: 100%; height: 100%; object-fit: cover; display: block; }
  .marker { position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; background: #f59e0b; border: 3px solid #fff; border-radius: 50% 50% 50% 0; transform: translate(-50%, -100%) rotate(-45deg); box-shadow: 0 2px 6px rgba(0,0,0,.4); }
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
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="badge">${logoDataUrl ? `<img src="${esc(logoDataUrl)}" alt="AnglerKit" />` : '&#9875;'}</div>
      <div>
        <h1>Fishing Map</h1>
        <div class="coords">${latStr}, ${lonStr}</div>
      </div>
    </div>
    <div class="preview">
      ${previewImage
        ? `<img class="shot" src="${esc(previewImage)}" alt="Map view" />`
        : `<div class="marker"></div><div class="badge-pin"></div>`}
    </div>
    ${activeLayers ? `<div class="layers"><div class="layers-title">Fishing layers in this view</div>${activeLayers}</div>` : ''}
    <div class="links">
      <a class="g" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
      <a class="a" href="${amapsUrl}" target="_blank" rel="noopener noreferrer">Open in Apple Maps</a>
    </div>
    <div class="attribution">${isScreenshot
      ? 'Apple Maps image of the shared view, with the active fishing layers drawn in.'
      : 'Map preview &copy; OpenStreetMap contributors — fishing overlays (depth contours, access points) are not shown in this preview.'}</div>
  </div>
  <footer>Shared from AnglerKit</footer>
</body>
</html>`;
}