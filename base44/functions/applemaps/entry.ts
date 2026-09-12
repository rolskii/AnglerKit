import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { MAPS_BASE, generateMapsJwt, getMapsAccessToken } from '../../shared/appleMapsAuth.ts';

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