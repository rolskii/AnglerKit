import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { MAPS_BASE, generateMapsJwt, getMapsAccessToken, importMapsPrivateKey } from '../../shared/appleMapsAuth.ts';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { query, mode, origin } = body;

    // MapKit JS token — return signed JWT directly (no token exchange).
    // No user auth required: the token is origin-scoped and meant for the browser.
    // An explicit origin is required so the resulting token can't be minted
    // wildcard-scoped (and therefore replayed from any site) by an anonymous caller.
    if (mode === 'mapkit_token') {
      if (!origin) {
        return Response.json({ error: 'Missing origin parameter' }, { status: 400 });
      }
      const token = await generateMapsJwt('mapkit_js', origin);
      return Response.json({ token });
    }

    // All other modes (geocode, search) require an authenticated user
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Static map image (Apple Maps Web Snapshots) of a given view — same
    // centre, span and map type (satellite / hybrid / standard) as the live
    // map. Used by the share-card flow, since MapKit JS's WebGL canvas can't
    // be captured client-side. Returns the PNG as a data URL.
    if (mode === 'snapshot') {
      const { lat, lon } = body;
      if (typeof lat !== 'number' || typeof lon !== 'number') {
        return Response.json({ error: 'Missing coordinates' }, { status: 400 });
      }
      const teamId = Deno.env.get('APPLE_MAPS_TEAM_ID');
      const keyId = Deno.env.get('APPLE_MAPS_KEY_ID');
      if (!teamId || !keyId) {
        return Response.json({ error: 'Missing Apple Maps credentials' }, { status: 500 });
      }
      const validTypes = ['standard', 'satellite', 'hybrid', 'mutedStandard'];
      const mapType = validTypes.includes(body.mapType) ? body.mapType : 'hybrid';
      const w = Math.max(50, Math.min(640, Math.round(Number(body.sizeW) || 480)));
      const h = Math.max(50, Math.min(640, Math.round(Number(body.sizeH) || 640)));
      const spnLat = Math.max(0.001, Math.min(90, Number(body.spanLat) || 0.01));
      const spnLon = Math.max(0.001, Math.min(179, Number(body.spanLon) || 0.01));

      const key = await importMapsPrivateKey();
      // Snapshot URLs are signed with the same .p8 key, over the full path
      // including teamId and keyId (ES256 → base64url, no padding).
      const params = `center=${lat},${lon}&spn=${spnLat},${spnLon}&t=${mapType}&size=${w}x${h}&scale=1`;
      const completePath = `/api/v1/snapshot?${params}&teamId=${teamId}&keyId=${keyId}`;
      const sigRaw = new Uint8Array(
        await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          key,
          new TextEncoder().encode(completePath)
        )
      );
      let sigBin = '';
      for (let i = 0; i < sigRaw.length; i++) sigBin += String.fromCharCode(sigRaw[i]);
      const signature = btoa(sigBin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const url = `https://snapshot.apple-mapkit.com${completePath}&signature=${signature}`;

      const imgRes = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!imgRes.ok) {
        const text = await imgRes.text();
        return Response.json({ error: `Snapshot failed: ${imgRes.status} - ${text}` }, { status: 502 });
      }
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      return Response.json({ image: `data:image/png;base64,${btoa(bin)}` });
    }

    if (!query) {
      return Response.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const accessToken = await getMapsAccessToken();

    let endpoint;
    if (mode === 'geocode') {
      endpoint = `${MAPS_BASE}/geocode?q=${encodeURIComponent(query)}&limit=1`;
    } else {
      endpoint = `${MAPS_BASE}/search?q=${encodeURIComponent(query)}&limit=${body.limit || 5}`;
      if (body.searchLocation) {
        endpoint += `&searchLocation=${encodeURIComponent(body.searchLocation)}`;
      }
    }

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        { error: `Apple Maps API error: ${response.status} - ${text}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const results = (data.results || []).map((r) => ({
      name: r.name || r.formattedAddress || r.fullThoroughfare || 'Unknown',
      lat: r.coordinate?.latitude,
      lon: r.coordinate?.longitude,
    })).filter((r) => r.lat != null && r.lon != null);

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});