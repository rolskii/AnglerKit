import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { SignJWT } from 'npm:jose@5.9.6';

const WEATHERKIT_BASE = 'https://weatherkit.apple.com/api/v1/weather';

// Apple WeatherKit conditionCode → WMO weather code (used by frontend)
const conditionToWMO = {
  Clear: 0,
  MostlyClear: 1,
  PartlyCloudy: 2,
  MostlyCloudy: 2,
  Cloudy: 3,
  Foggy: 45,
  Haze: 45,
  Drizzle: 53,
  Rain: 63,
  HeavyRain: 65,
  Snow: 73,
  HeavySnow: 75,
  WintryMix: 73,
  Flurries: 71,
  Thunderstorms: 95,
  ThunderstormsWithHail: 96,
  ScatteredThunderstorms: 95,
  IsolatedThunderstorms: 95,
  Breezy: 3,
  Windy: 3,
  Frigid: 3,
  Hot: 3,
};

function mapCondition(condition) {
  return conditionToWMO[condition] ?? 3;
}

async function generateWeatherKitJWT() {
  const teamId = Deno.env.get('WEATHERKIT_TEAM_ID');
  const serviceId = Deno.env.get('WEATHERKIT_SERVICE_ID');
  const keyId = Deno.env.get('WEATHERKIT_KEY_ID');
  const privateKeyPem = Deno.env.get('WEATHERKIT_PRIVATE_KEY');

  if (!teamId || !serviceId || !keyId || !privateKeyPem) {
    throw new Error(
      'Missing WeatherKit credentials. Set WEATHERKIT_TEAM_ID, WEATHERKIT_SERVICE_ID, WEATHERKIT_KEY_ID, and WEATHERKIT_PRIVATE_KEY in environment variables.'
    );
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
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT', id: `${teamId}.${serviceId}` })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setSubject(serviceId)
    .sign(key);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { lat, lon, unit } = body;

    if (!lat || !lon) {
      return Response.json({ error: 'Missing lat/lon parameters' }, { status: 400 });
    }

    const token = await generateWeatherKitJWT();

    // Always request metric from WeatherKit; frontend handles imperial conversion
    const apiUrl = `${WEATHERKIT_BASE}/en/${lat}/${lon}?dataSets=currentWeather,forecastDaily,forecastHourly&unit=m`;

    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        { error: `WeatherKit API error: ${response.status} - ${text}` },
        { status: 502 }
      );
    }

    const wk = await response.json();

    const cw = wk.currentWeather || {};
    const fd = wk.forecastDaily || { days: [] };
    const fh = wk.forecastHourly || { hours: [] };

    const current = {
      temperature_2m: cw.temperature ?? 0,
      relative_humidity_2m: Math.round((cw.humidity ?? 0) * 100),
      apparent_temperature: cw.temperatureApparent ?? cw.temperature ?? 0,
      precipitation: cw.precipitationAmount ?? 0,
      weather_code: mapCondition(cw.conditionCode),
      wind_speed_10m: cw.windSpeed ?? 0,
      visibility: cw.visibility ?? 10000,
      pressure: cw.pressure ?? 0,
    };

    const daily = {
      time: [],
      weather_code: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
      precipitation_sum: [],
      sunrise: [],
      sunset: [],
    };

    for (const day of fd.days || []) {
      daily.time.push((day.forecastStart || '').split('T')[0]);
      daily.weather_code.push(mapCondition(day.conditionCode));
      daily.temperature_2m_max.push(day.temperatureMax ?? 0);
      daily.temperature_2m_min.push(day.temperatureMin ?? 0);
      daily.precipitation_sum.push(day.precipitationAmount ?? 0);
      daily.sunrise.push(day.sunrise || null);
      daily.sunset.push(day.sunset || null);
    }

    const hourly = {
      time: [],
      temperature_2m: [],
      weather_code: [],
      precipitation_probability: [],
      wind_speed_10m: [],
    };

    for (const hour of fh.hours || []) {
      hourly.time.push(hour.forecastStart);
      hourly.temperature_2m.push(hour.temperature ?? 0);
      hourly.weather_code.push(mapCondition(hour.conditionCode));
      hourly.precipitation_probability.push(
        Math.round((hour.precipitationChance ?? 0) * 100)
      );
      hourly.wind_speed_10m.push(hour.windSpeed ?? 0);
    }

    return Response.json({ current, daily, hourly });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});