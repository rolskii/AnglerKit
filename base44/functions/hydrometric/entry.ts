// Environment and Climate Change Canada (ECCC) hydrometric data aggregator.
//
// Data sources (none of this is live-tested from this sandbox — outbound
// network to dd.weather.gc.ca / api.weather.gc.ca is blocked here — so the
// exact query-param behavior should get a smoke test once deployed):
//   - Station list CSV: https://dd.weather.gc.ca/hydrometric/doc/hydrometric_StationList.csv
//   - Modern OGC API (used below): https://api.weather.gc.ca/collections/hydrometric-realtime/items
//     and .../collections/hydrometric-daily-mean/items
//   - No official water temperature is provided by ECCC hydrometric — level
//     and discharge only.

const STATION_LIST_URL = 'https://dd.weather.gc.ca/hydrometric/doc/hydrometric_StationList.csv';
const STATION_LIST_MIRROR_URL = 'https://dd.meteo.gc.ca/today/hydrometric/doc/hydrometric_StationList.csv';
const OGC_BASE = 'https://api.weather.gc.ca/collections';

let stationListCache = null;
let stationListCacheTime = 0;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// CSV-quote-aware line splitter — station names occasionally contain commas
// inside quoted fields (e.g. "Grand River near Brantford, Ontario").
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim().replace(/^"|"$/g, ''));
}

async function fetchStationList() {
  const now = Date.now();
  if (stationListCache && (now - stationListCacheTime) < 86400000) {
    return stationListCache;
  }
  let csv = null;
  for (const url of [STATION_LIST_URL, STATION_LIST_MIRROR_URL]) {
    try {
      const res = await fetch(url);
      if (res.ok) { csv = await res.text(); break; }
    } catch (e) {
      // try next mirror
    }
  }
  if (!csv) {
    if (stationListCache) return stationListCache; // serve stale cache over a hard failure
    throw new Error('Could not fetch ECCC hydrometric station list');
  }

  const lines = csv.split('\n').filter(Boolean);
  const stations = [];
  // Header: ID,Name / Nom,Latitude,Longitude,Prov/Terr,Timezone / Fuseau horaire
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    if (parts.length < 4) continue;
    const [id, name, latStr, lonStr, prov] = parts;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!id || isNaN(lat) || isNaN(lon)) continue;
    stations.push({ id, name, lat, lon, prov: prov || null });
  }
  stationListCache = stations;
  stationListCacheTime = now;
  return stations;
}

function findNearestStations(stations, lat, lon, count = 5, maxKm = 150) {
  const withDist = stations
    .map(s => ({ ...s, distanceKm: haversine(lat, lon, s.lat, s.lon) }))
    .filter(s => s.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return withDist.slice(0, count);
}

async function ogcFetch(collection, params) {
  const url = `${OGC_BASE}/${collection}/items?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/geo+json' } });
  if (!res.ok) throw new Error(`OGC API request failed (${res.status}) for ${collection}`);
  return res.json();
}

async function fetchRealtimeReadings(stationId, hours = 50) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 3600000);
  const params = new URLSearchParams({
    f: 'json',
    STATION_NUMBER: stationId,
    datetime: `${start.toISOString()}/${end.toISOString()}`,
    limit: '2000',
  });
  const data = await ogcFetch('hydrometric-realtime', params);
  const readings = (data.features || [])
    .map(f => ({
      datetimeUtc: f.properties.DATETIME,
      datetimeLocal: f.properties.DATETIME_LST,
      level: f.properties.LEVEL ?? null,
      discharge: f.properties.DISCHARGE ?? null,
      levelSymbol: f.properties.LEVEL_SYMBOL_EN ?? null,
      dischargeSymbol: f.properties.DISCHARGE_SYMBOL_EN ?? null,
    }))
    .sort((a, b) => new Date(a.datetimeUtc) - new Date(b.datetimeUtc));
  return readings;
}

async function fetchNormalComparison(stationId, todayLevel, yearsBack = 10) {
  if (todayLevel == null) return null;
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const samples = [];
    for (let y = 1; y <= yearsBack; y++) {
      const year = now.getFullYear() - y;
      const center = new Date(Date.UTC(year, month - 1, day));
      const start = new Date(center.getTime() - 7 * 86400000);
      const end = new Date(center.getTime() + 7 * 86400000);
      const params = new URLSearchParams({
        f: 'json',
        STATION_NUMBER: stationId,
        datetime: `${start.toISOString().slice(0, 10)}/${end.toISOString().slice(0, 10)}`,
        limit: '100',
      });
      try {
        const data = await ogcFetch('hydrometric-daily-mean', params);
        for (const f of (data.features || [])) {
          const v = f.properties.LEVEL;
          if (v != null) samples.push(v);
        }
      } catch (e) {
        // this year's data unavailable — skip it
      }
    }
    if (samples.length < 10) return null; // showing no comparison is safer than a wrong one
    samples.sort((a, b) => a - b);
    const below = samples.filter(v => v <= todayLevel).length;
    const percentile = Math.round((below / samples.length) * 100);
    const median = samples[Math.floor(samples.length / 2)];
    let label = 'near normal';
    if (percentile >= 90) label = 'much higher than normal';
    else if (percentile >= 70) label = 'higher than normal';
    else if (percentile <= 10) label = 'much lower than normal';
    else if (percentile <= 30) label = 'lower than normal';
    return { percentile, label, median, sampleSize: samples.length, yearsConsidered: yearsBack };
  } catch (e) {
    return null;
  }
}

function computeTrend(readings, field, hoursBack = 6) {
  const valid = readings.filter(r => r[field] != null);
  if (valid.length < 2) return { direction: 'steady', change: 0, changePct: 0 };
  const latest = valid[valid.length - 1];
  const latestTime = new Date(latest.datetimeUtc).getTime();
  let past = valid[0];
  for (const r of valid) {
    if (latestTime - new Date(r.datetimeUtc).getTime() >= hoursBack * 3600000) {
      past = r;
    }
  }
  const change = latest[field] - past[field];
  const changePct = past[field] !== 0 ? (change / Math.abs(past[field])) * 100 : 0;
  let direction = 'steady';
  if (Math.abs(changePct) >= 2) direction = change > 0 ? 'rising' : 'falling';
  return { direction, change, changePct };
}

// --- Historical range support ---
const RANGE_DAYS = { '24h': 1, '2d': 2, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };

async function fetchHistoricalSeries(stationId, range, startDateStr, endDateStr) {
  let start, end;
  if (range === 'custom' && startDateStr && endDateStr) {
    start = new Date(startDateStr);
    end = new Date(endDateStr);
  } else {
    const days = RANGE_DAYS[range] || 7;
    end = new Date();
    start = new Date(end.getTime() - days * 86400000);
  }
  const spanDays = (end.getTime() - start.getTime()) / 86400000;

  if (spanDays <= 2.5) {
    // Short spans: use the realtime hourly feed directly.
    const params = new URLSearchParams({
      f: 'json',
      STATION_NUMBER: stationId,
      datetime: `${start.toISOString()}/${end.toISOString()}`,
      limit: '2000',
    });
    const data = await ogcFetch('hydrometric-realtime', params);
    const points = (data.features || [])
      .map(f => ({ time: f.properties.DATETIME, level: f.properties.LEVEL ?? null, discharge: f.properties.DISCHARGE ?? null }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));
    return { granularity: 'hourly', time: points.map(p => p.time), level: points.map(p => p.level), discharge: points.map(p => p.discharge) };
  }

  // Longer spans: page through the daily-mean collection in ~1-year chunks.
  const allPoints = [];
  let chunkStart = new Date(start);
  while (chunkStart < end) {
    const chunkEnd = new Date(Math.min(chunkStart.getTime() + 365 * 86400000, end.getTime()));
    const params = new URLSearchParams({
      f: 'json',
      STATION_NUMBER: stationId,
      datetime: `${chunkStart.toISOString().slice(0, 10)}/${chunkEnd.toISOString().slice(0, 10)}`,
      limit: '2000',
    });
    try {
      const data = await ogcFetch('hydrometric-daily-mean', params);
      for (const f of (data.features || [])) {
        allPoints.push({
          time: f.properties.DATE || f.properties.DATETIME,
          level: f.properties.LEVEL ?? null,
          discharge: f.properties.DISCHARGE ?? null,
        });
      }
    } catch (e) {
      // this chunk unavailable — continue with what we have
    }
    chunkStart = chunkEnd;
  }
  allPoints.sort((a, b) => new Date(a.time) - new Date(b.time));
  return {
    granularity: 'daily',
    time: allPoints.map(p => p.time),
    level: allPoints.map(p => p.level),
    discharge: allPoints.map(p => p.discharge),
  };
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { lat, lon, stationId, historicalRange, startDate, endDate, stationName } = body;

    // --- Historical range mode: skip nearest-station search, query directly ---
    if (historicalRange && stationId) {
      const historical = await fetchHistoricalSeries(stationId, historicalRange, startDate, endDate);
      return Response.json({ station: { id: stationId, name: stationName || null }, historical });
    }

    if (!lat || !lon) {
      return Response.json({ error: 'Missing lat/lon parameters' }, { status: 400 });
    }

    const stations = await fetchStationList();
    const candidates = findNearestStations(stations, lat, lon, 5, 150);
    if (candidates.length === 0) {
      return Response.json({ error: 'No hydrometric stations found within 150km of this location.' }, { status: 404 });
    }

    // Try candidates in distance order until one actually has live readings —
    // the nearest station on paper is sometimes offline/decommissioned.
    let chosen = null;
    let readings = [];
    for (const candidate of candidates) {
      try {
        const r = await fetchRealtimeReadings(candidate.id);
        if (r.length > 0) {
          chosen = candidate;
          readings = r;
          break;
        }
      } catch (e) {
        // try the next candidate
      }
    }

    if (!chosen) {
      return Response.json({ error: 'No nearby hydrometric station currently has live readings.' }, { status: 404 });
    }

    const latest = readings[readings.length - 1];
    const levelTrend = computeTrend(readings, 'level');
    const dischargeTrend = computeTrend(readings, 'discharge');
    const normal = await fetchNormalComparison(chosen.id, latest.level);

    return Response.json({
      station: { id: chosen.id, name: chosen.name, lat: chosen.lat, lon: chosen.lon, distanceKm: Math.round(chosen.distanceKm * 10) / 10 },
      current: {
        level: latest.level,
        discharge: latest.discharge,
        levelSymbol: latest.levelSymbol,
        dischargeSymbol: latest.dischargeSymbol,
        datetimeUtc: latest.datetimeUtc,
        datetimeLocal: latest.datetimeLocal,
      },
      trend: { level: levelTrend, discharge: dischargeTrend },
      normal,
      hourly: {
        time: readings.map(r => r.datetimeUtc),
        level: readings.map(r => r.level),
        discharge: readings.map(r => r.discharge),
      },
      nearbyStations: candidates
        .filter(c => c.id !== chosen.id)
        .map(c => ({ id: c.id, name: c.name, distanceKm: Math.round(c.distanceKm * 10) / 10 })),
    });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to fetch hydrometric data' }, { status: 500 });
  }
});
