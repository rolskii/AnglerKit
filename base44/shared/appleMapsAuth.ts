// Apple Maps Server API auth + reverse geocoding — shared by the applemaps
// and fishingRegulations backend functions.
import { SignJWT } from 'npm:jose@5.9.6';

export const MAPS_BASE = 'https://maps-api.apple.com/v1';

// Imports the Apple Maps private key (.p8) for ES256 signing.
export async function importMapsPrivateKey() {
  const privateKeyRaw = Deno.env.get('APPLE_MAPS_PRIVATE_KEY');

  if (!privateKeyRaw) {
    throw new Error('Missing Apple Maps credentials. Set APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID, and APPLE_MAPS_PRIVATE_KEY.');
  }

  let privateKeyPem = privateKeyRaw.trim();
  if (!privateKeyPem.includes('BEGIN PRIVATE KEY')) {
    privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;
  }

  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

export async function generateMapsJwt(scope, origin) {
  const teamId = Deno.env.get('APPLE_MAPS_TEAM_ID');
  const keyId = Deno.env.get('APPLE_MAPS_KEY_ID');

  if (!teamId || !keyId) {
    throw new Error('Missing Apple Maps credentials. Set APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID, and APPLE_MAPS_PRIVATE_KEY.');
  }

  const key = await importMapsPrivateKey();

  const now = Math.floor(Date.now() / 1000);
  const payload = { scope };
  if (origin) payload.origin = origin;

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

export async function getMapsAccessToken() {
  const jwt = await generateMapsJwt('server_api');
  const tokenRes = await fetch(`${MAPS_BASE}/token`, {
    headers: { Authorization: `Bearer ${jwt}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} - ${text}`);
  }
  const tokenData = await tokenRes.json();
  return tokenData.accessToken;
}

// Reverse geocode a coordinate into its country and province/state using the
// Apple Maps reverseGeocode endpoint. Returns null when the lookup fails.
export async function reverseGeocode(lat, lon) {
  try {
    const token = await getMapsAccessToken();
    const r = await fetch(`${MAPS_BASE}/reverseGeocode?loc=${encodeURIComponent(`${lat},${lon}`)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const res = data?.results?.[0];
    if (!res) return null;
    return {
      name: res.structuredAddress?.administrativeArea || null,
      code: res.structuredAddress?.administrativeAreaCode || null,
      country: res.country || null,
      countryCode: res.countryCode || null,
    };
  } catch {
    return null;
  }
}