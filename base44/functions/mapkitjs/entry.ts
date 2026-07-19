// Proxies the MapKit JS script through the app's own origin to bypass
// any Content Security Policy that blocks external script execution.
// Cached for 24 hours to avoid re-fetching the ~825KB script on every load.

let scriptCache = null;
let scriptCacheTime = 0;
const CACHE_TTL = 86400000; // 24 hours

Deno.serve(async (req) => {
  try {
    const now = Date.now();
    if (!scriptCache || (now - scriptCacheTime) > CACHE_TTL) {
      const res = await fetch('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js');
      if (!res.ok) {
        return Response.json({ error: 'Failed to fetch MapKit JS' }, { status: 502 });
      }
      scriptCache = await res.text();
      scriptCacheTime = now;
    }
    return new Response(scriptCache, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});