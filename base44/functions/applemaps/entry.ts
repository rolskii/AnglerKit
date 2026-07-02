import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { SignJWT } from 'npm:jose@5.9.6';

const MAPS_BASE = 'https://maps-api.apple.com/v1';

async function generateMapsJWT() {
  const teamId = Deno.env.get('WEATHERKIT_TEAM_ID');
  const keyId = Deno.env.get('APPLE_MAPS_KEY_ID');
  const privateKeyRaw = Deno.env.get('APPLE_MAPS_PRIVATE_KEY');

  if (!teamId || !keyId || !privateKeyRaw) {
    throw new Error('Missing Apple Maps credentials. Set APPLE_MAPS_KEY_ID and APPLE_MAPS_PRIVATE_KEY.');
  }

  // Ensure the key has PEM headers (user may have pasted raw base64)
  let privateKeyPem = privateKeyRaw.trim();
  if (!privateKeyPem.includes('BEGIN PRIVATE KEY')) {
    privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;
  }

  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { query, mode } = body; // mode: 'search' | 'geocode'

    if (!query) {
      return Response.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const token = await generateMapsJWT();

    const endpoint = mode === 'geocode'
      ? `${MAPS_BASE}/geocode?address=${encodeURIComponent(query)}&limit=1`
      : `${MAPS_BASE}/search?q=${encodeURIComponent(query)}&limit=${body.limit || 5}`;

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
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