// fishingRegulations — v2 re-deploy. Builds the AI-path response payload from
// explicit plain fields (never spreads the raw LLM object) so JSON.stringify
// can never hit a cyclic reference.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { reverseGeocode } from '../../shared/appleMapsAuth.ts';

// Ontario LIO "Fisheries Management Zone" boundary layer (FMZ 1-20 polygons)
const FMZ_LAYER =
  'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer/14/query';

const ONTARIO_REG_SUMMARY = 'https://www.ontario.ca/document/ontario-fishing-regulations-summary';

// Ontario LIO Aquatic Resource Area layers — waterbody polygons (lakes) and
// line segments (rivers/streams). Both carry FISH_SPECIES_SUMMARY, the list of
// species recorded as present in that specific waterbody.
const ARA_SERVICE = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer';

// Rough province bounding boxes — same boxes the map uses for auto layer selection
const detectProvince = (lat, lon) => {
  if (lat >= 41.6 && lat <= 56.9 && lon >= -95.3 && lon <= -74.0) return 'ontario';
  if (lat >= 48.9 && lat <= 60.0 && lon >= -102.0 && lon <= -88.3) return 'manitoba';
  if (lat >= 43.3 && lat <= 47.1 && lon >= -67.0 && lon <= -59.7) return 'nova_scotia';
  if (lat >= 44.9 && lat <= 62.6 && lon >= -80.0 && lon <= -57.0) return 'quebec';
  return null;
};

// Official province names from the Apple reverse geocoder → our province keys.
const REGION_TO_PROVINCE = {
  Ontario: 'ontario',
  Quebec: 'quebec',
  Manitoba: 'manitoba',
  'Nova Scotia': 'nova_scotia',
};

const AREA_PROVINCE_NAMES = {
  ontario: 'Ontario',
  quebec: 'Quebec',
  manitoba: 'Manitoba',
  nova_scotia: 'Nova Scotia',
};

const AREA_HINTS = {
  ontario: (zone) =>
    `Ontario, Fisheries Management Zone (FMZ) ${zone}. Use the current-year Ontario Recreational Fishing Regulations Summary on ontario.ca (the FMZ ${zone} zone-specific pages plus the general regulations section) as the source of truth.`,
  quebec: () =>
    'Quebec. Use the official MFFP / Gouvernement du Quebec sportfishing regulations ("Peche sportive au Quebec - periodes, limites et exceptions") as the source of truth.',
  manitoba: () =>
    'Manitoba. Use the current Manitoba Angling Guide (gov.mb.ca) as the source of truth.',
  nova_scotia: () =>
    'Nova Scotia. Use the current Nova Scotia recreational fishing regulations (Nova Scotia Fisheries and Aquaculture / fisheries.ns.gov.ca) as the source of truth.',
};

const stripTags = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

// Parse the official ontario.ca zone page: the COMPLETE zone-wide seasons &
// limits table (every species group) plus the general information bullets.
const parseOntarioZonePage = (html) => {
  const zm = html.match(/Zone-wide seasons and limits<\/h2>([\s\S]*?)<h2/);
  if (!zm) return null;
  const entryRe = /<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
  const seasons = [];
  let match;
  while ((match = entryRe.exec(zm[1]))) {
    const seasonMatch = match[2].match(/<strong>Season<\/strong>:([\s\S]*?)(?:<br|<strong>|$)/i);
    const limitMatch = match[2].match(/<strong>Limits<\/strong>:([\s\S]*?)(?:<\/p>|$)/i);
    seasons.push({
      species: stripTags(match[1]),
      season: seasonMatch ? stripTags(seasonMatch[1]) : '—',
      limit: limitMatch ? stripTags(limitMatch[1]) : '—',
    });
  }
  if (seasons.length === 0) return null;
  const generalRules = [];
  const gm = html.match(/General information<\/h2>([\s\S]*?)<h2/);
  if (gm) {
    const liRe = /<li>([\s\S]*?)<\/li>/g;
    let lm;
    while ((lm = liRe.exec(gm[1]))) generalRules.push(stripTags(lm[1]));
  }
  return { seasons, generalRules };
};

// Look up the waterbody (ARA polygon first, then line segment) near the point
// and return its official name plus its recorded fish species summary.
const araQuery = async (layerId, outFields, geometry, geometryType) => {
  try {
    const params = new URLSearchParams({
      where: '1=1',
      geometry,
      geometryType,
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields,
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '20',
    });
    const r = await fetch(`${ARA_SERVICE}/${layerId}/query?${params.toString()}`);
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.features || []).map((f) => f?.attributes || {});
  } catch (e) {
    return [];
  }
};

const pickWaterbody = (features) => {
  if (features.length === 0) return null;
  // Prefer a feature that actually lists species
  const best = features.find((a) => (a.FISH_SPECIES_SUMMARY || '').trim()) || features[0];
  return {
    name: best.OFFICIAL_WATERBODY_NAME || best.CORPORATE_WATERBODY_NAME || best.OFFICIAL_NAME_LABEL || null,
    speciesSummary: (best.FISH_SPECIES_SUMMARY || '').trim() || null,
    layer: best._layer ?? null,
  };
};

// A single ARA segment often lists only part of a waterbody's species — the
// Moira River's muskellunge are recorded on just 2 of its 26 segments, for
// example. Merge the species lists of every same-named segment in this zone so
// the waterbody reflects its full species list.
const unionWaterbodySpecies = async (layerId, name, zone) => {
  if (!layerId || !name) return [];
  const q = name.replace(/'/g, "''");
  const where = [
    `(OFFICIAL_WATERBODY_NAME = '${q}' OR (OFFICIAL_WATERBODY_NAME IS NULL AND CORPORATE_WATERBODY_NAME = '${q}'))`,
    zone ? `FISHERIES_MANAGEMENT_ZONE_ID = ${zone}` : '',
  ]
    .filter(Boolean)
    .join(' AND ');
  try {
    const params = new URLSearchParams({
      where,
      outFields: 'FISH_SPECIES_SUMMARY',
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '200',
    });
    const r = await fetch(`${ARA_SERVICE}/${layerId}/query?${params.toString()}`);
    if (!r.ok) return [];
    const data = await r.json();
    const seen = new Set();
    const species = [];
    for (const f of data?.features || []) {
      for (const s of (f?.attributes?.FISH_SPECIES_SUMMARY || '').split(',')) {
        const t = s.trim();
        if (t && !seen.has(t)) {
          seen.add(t);
          species.push(t);
        }
      }
    }
    return species;
  } catch {
    return [];
  }
};

const withFullSpecies = async (waterbody, zone) => {
  if (!waterbody) return waterbody;
  const merged = await unionWaterbodySpecies(waterbody.layer, waterbody.name, zone);
  const origCount = (waterbody.speciesSummary || '').split(',').filter((s) => s.trim()).length;
  return merged.length > origCount ? { ...waterbody, speciesSummary: merged.join(', ') } : waterbody;
};

// Look up the waterbody under the map centre: the lake polygon that actually
// contains the point first (so a neighbouring lake in the area is never
// picked), then a small envelope fallback for rivers/streams and near-shore.
const lookupOntarioWaterbody = async (lat, lon, zone) => {
  // Layer 2 = ARA Water Poly Segment (lakes) — it has no OFFICIAL_NAME_LABEL field.
  // Layer 1 = ARA Water Line Segment (rivers/streams).
  const lakeFields = 'OFFICIAL_WATERBODY_NAME,CORPORATE_WATERBODY_NAME,FISH_SPECIES_SUMMARY';
  const lineFields = 'OFFICIAL_WATERBODY_NAME,CORPORATE_WATERBODY_NAME,OFFICIAL_NAME_LABEL,FISH_SPECIES_SUMMARY';

  // Exact containment — only the waterbody polygon under the point matches
  const lake = pickWaterbody(
    (await araQuery(2, lakeFields, JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }), 'esriGeometryPoint')).map(
      (a) => ({ ...a, _layer: 2 })
    )
  );
  if (lake) return withFullSpecies(lake, zone);

  // Fallback: ~400 m envelope around the map centre
  const pad = 0.004;
  const geom = `${lon - pad},${lat - pad},${lon + pad},${lat + pad}`;
  const results = await Promise.all([
    araQuery(2, lakeFields, geom, 'esriGeometryEnvelope').then((fs) => fs.map((a) => ({ ...a, _layer: 2 }))),
    araQuery(1, lineFields, geom, 'esriGeometryEnvelope').then((fs) => fs.map((a) => ({ ...a, _layer: 1 }))),
  ]);
  return withFullSpecies(pickWaterbody(results.flat()), zone);
};

// --- Species matching: keep only zone-table rows for species the waterbody has ---
// Zone-table entries use consistent naming across FMZs; map each entry to the
// phrases a waterbody species summary uses when that species is present. The
// first key whose text appears in the entry name wins. Generic words alone
// ("trout", "northern") never match, so summaries listing e.g. "Northern Hog
// Sucker" don't drag in northern pike rules.
const SPECIES_PHRASES = [
  ['aggregate', []], // combined-limit rule, not a species — always keep
  ['atlantic salmon', ['atlantic salmon']],
  ['pacific salmon', ['chinook', 'coho', 'pink salmon', 'sockeye', 'chum salmon', 'kokanee', 'pacific salmon']],
  ['chinook', ['chinook']],
  ['coho', ['coho']],
  ['kokanee', ['kokanee']],
  ['brook trout', ['brook trout', 'speckled trout']],
  ['brown trout', ['brown trout']],
  ['rainbow trout', ['rainbow trout', 'steelhead']],
  ['lake trout', ['lake trout', 'splake', 'togue']],
  ['splake', ['splake', 'lake trout']],
  ['walleye', ['walleye', 'sauger', 'yellow pickerel', 'pickerel']],
  ['sauger', ['sauger']],
  ['northern pike', ['northern pike', 'jackfish']],
  ['pike', ['pike']],
  ['muskellunge', ['muskellunge', 'muskie', 'musky', 'tiger muskie']],
  ['largemouth', ['largemouth', 'smallmouth']],
  ['smallmouth', ['smallmouth', 'largemouth']],
  ['sunfish', ['sunfish', 'rock bass', 'pumpkinseed', 'bluegill']],
  ['rock bass', ['rock bass', 'sunfish', 'pumpkinseed', 'bluegill']],
  ['yellow perch', ['yellow perch', 'perch']],
  ['white perch', ['white perch']],
  ['crappie', ['crappie']],
  ['channel catfish', ['channel catfish', 'catfish']],
  ['catfish', ['catfish']],
  ['bullhead', ['bullhead']],
  ['burbot', ['burbot', 'ling', 'eelpout']],
  ['lake whitefish', ['whitefish', 'cisco', 'lake herring']],
  ['whitefish', ['whitefish', 'cisco', 'lake herring']],
  ['cisco', ['cisco', 'lake herring', 'whitefish']],
  ['sturgeon', ['sturgeon']],
  ['sucker', ['sucker', 'redhorse']],
  ['redhorse', ['redhorse', 'sucker']],
  ['goldeye', ['goldeye', 'mooneye']],
  ['mooneye', ['mooneye', 'goldeye']],
  ['bowfin', ['bowfin']],
  ['carp', ['carp']],
  ['smelt', ['smelt']],
  ['gar', ['gar']],
];
const SPECIES_STOPWORDS = new Set([
  'other', 'others', 'type', 'group', 'species', 'including', 'general', 'water', 'fish', 'all',
]);
const GENERIC_WORDS = new Set([
  'trout', 'salmon', 'bass', 'pike', 'perch', 'northern', 'brook', 'brown', 'rainbow',
  'lake', 'white', 'black', 'yellow', 'combined', 'limits', 'splake', 'channel',
]);

const seasonMatches = (speciesName, summary) => {
  const entry = stripTags(speciesName).toLowerCase();
  for (const [key, phrases] of SPECIES_PHRASES) {
    if (entry.includes(key)) {
      return phrases.length === 0 || phrases.some((p) => summary.includes(p));
    }
  }
  // Unknown entry — match on its distinctive long words only (whole words:
  // 'north' must not match inside 'northern pike')
  const tokens = entry
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 5 && !SPECIES_STOPWORDS.has(w) && !GENERIC_WORDS.has(w));
  return tokens.some((t) => new RegExp(`\\b${t}\\b`).test(summary));
};

const filterSeasonsBySpecies = (seasons, speciesSummary) => {
  const summary = stripTags(speciesSummary).toLowerCase();
  if (!summary) return seasons;
  const filtered = seasons.filter((s) => seasonMatches(s.species, summary));
  return filtered.length > 0 ? filtered : seasons;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const lat = parseFloat(body.lat);
    const lon = parseFloat(body.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return Response.json({ error: 'lat and lon are required' }, { status: 400 });
    }

    // Resolve the jurisdiction under the map centre. The Apple Maps reverse
    // geocoder is authoritative (bounding boxes mislabel points near
    // provincial/state borders); the province boxes are only a fallback for
    // when the reverse geocode fails (e.g. mid-lake with no nearby address).
    const region = await reverseGeocode(lat, lon);
    if (region && region.countryCode !== 'CA' && region.countryCode !== 'US') {
      return Response.json({ supported: false, province: null, zone: null, regulations: null });
    }
    const province = region?.name
      ? REGION_TO_PROVINCE[region.name] || null
      : detectProvince(lat, lon);
    if (!region?.name && !province) {
      return Response.json({ supported: false, province: null, zone: null, regulations: null });
    }

    // Ontario: resolve the exact Fisheries Management Zone under the point
    let zone = null;
    if (province === 'ontario') {
      const params = new URLSearchParams({
        where: '1=1',
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'FISHERIES_MANAGEMENT_ZONE_ID',
        returnGeometry: 'false',
        f: 'json',
      });
      const r = await fetch(`${FMZ_LAYER}?${params.toString()}`);
      if (!r.ok) return Response.json({ error: `Zone lookup failed (${r.status})` }, { status: 502 });
      const zdata = await r.json();
      zone = zdata?.features?.[0]?.attributes?.FISHERIES_MANAGEMENT_ZONE_ID ?? null;
    }

    // Ontario: read the official zone page directly — complete and authoritative
    if (province === 'ontario' && zone) {
      const zoneUrl = `${ONTARIO_REG_SUMMARY}/fisheries-management-zone-${zone}`;
      try {
        const r = await fetch(zoneUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (r.ok) {
          const html = await r.text();
          const parsed = parseOntarioZonePage(html);
          if (parsed) {
            const waterbody = await lookupOntarioWaterbody(lat, lon, zone);
            const seasons = waterbody?.speciesSummary
              ? filterSeasonsBySpecies(parsed.seasons, waterbody.speciesSummary)
              : parsed.seasons;
            return Response.json({
              supported: true,
              province,
              zone,
              regulations: {
                source: 'official',
                areaLabel: waterbody?.name
                  ? `${waterbody.name} · Ontario FMZ ${zone}`
                  : `Ontario — FMZ ${zone}`,
                waterbody: waterbody || null,
                seasons,
                generalRules: parsed.generalRules,
                exceptionsNote:
                  'Zone-wide rules apply to all waters in this zone except where species exceptions, waterbody exceptions or fish sanctuaries apply. Check the official summary for the specific waterbody you plan to fish.',
                links: [
                  { label: `FMZ ${zone} — Ontario Fishing Regulations Summary`, url: zoneUrl },
                  {
                    label: 'Ontario fishing licences & fees',
                    url: `${ONTARIO_REG_SUMMARY}/recreational-fishing-licences-and-fees`,
                  },
                ],
              },
            });
          }
        }
      } catch (e) {
        // fall through to the LLM summary below
      }
    }

    // --- Shared regulations cache (LLM path only) ---
    // Lookups outside Ontario are AI-sourced and cost integration credits.
    // Cache one entry per ~5 km map area per regulations year: the first angler
    // to look a spot up pays once, every later lookup returns instantly with
    // no AI call. `refresh: true` re-fetches and overwrites the entry.
    const regsYear = new Date().getFullYear();
    const grid = (v) => Math.round(v * 20) / 20; // 0.05° grid ≈ 5.5 km cells
    const areaKey = province || region?.name || 'unknown';
    const cacheKey = `${areaKey}|${grid(lat)},${grid(lon)}|${regsYear}`;
    let cachedEntry = null;
    try {
      const hits = await base44.entities.RegulationsCache.filter({ cache_key: cacheKey }, '-created_date', 1);
      cachedEntry = hits?.[0] || null;
    } catch (e) {
      // cache unavailable — fall through to the live lookup
    }
    if (cachedEntry?.result && !body.refresh) {
      try {
        return Response.json({
          supported: true,
          province,
          zone,
          region: region || null,
          cached: true,
          regulations: JSON.parse(cachedEntry.result),
        });
      } catch (e) {
        cachedEntry = null; // corrupt entry — re-fetch below and overwrite
      }
    }

    // LLM path — other provinces/states, and Ontario fallback when the page fetch fails
    const placeLabel = province
      ? `${AREA_PROVINCE_NAMES[province]}, Canada`
      : `${region.name}, ${region.countryCode === 'US' ? 'United States' : 'Canada'}`;
    const areaHint = province
      ? AREA_HINTS[province](zone)
      : `${region.name} (${region.countryCode === 'US' ? 'United States' : 'Canada'}). Use the current official recreational fishing regulations for this jurisdiction as the source of truth: for a US state, the state fish and wildlife agency's current fishing guide; for a Canadian province or territory, the official provincial or territorial angling regulations.`;
    const prompt = [
      `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
      `An angler is viewing a map centred in ${placeLabel}${zone ? ` - Fisheries Management Zone ${zone}` : ''}.`,
      `The map centre coordinates are ${lat}, ${lon}.`,
      `Look up the current official recreational fishing regulations for this exact area. ${areaHint}`,
      'Summarize for a recreational angler:',
      '1. "seasons": the COMPLETE open-seasons and catch & possession limits table for this exact zone, with dates for the current season year. List EVERY species group the official zone table covers, not just the main ones: walleye/sauger, northern pike, largemouth & smallmouth bass, yellow perch, black crappie, sunfish & bluegill, rock bass, brown bullhead & other catfish, burbot, lake whitefish, lake trout & splake, brook trout, brown trout, rainbow trout & steelhead, Pacific salmon (chinook & coho), Atlantic salmon, muskellunge, sturgeon, goldeye & mooneye, white & shorthead redhorse suckers, and any other species group the zone table includes. Include an entry even when the season is closed or catch-and-release only, and state that in the season field.',
      '2. "generalRules": the key area-wide or province-wide rules an angler must know (licence requirements, bait restrictions, gear/line limits, sanctuaries, catch-and-release waters, protected species).',
      '3. "exceptionsNote": one or two sentences warning that waterbody-specific exceptions apply and the angler must check the official source before fishing.',
      '4. "links": links to the official sources used (regulations summary page, zone page, licence page).',
      'Only state dates, limits and rules that appear in the official sources - never guess or invent numbers.',
      '"areaLabel" should name the jurisdiction and zone (e.g. "Ontario - FMZ 17", "Quebec (province-wide)" or "Michigan").',
    ].join(' ');

    const llm = await base44.integrations.Core.InvokeLLM({
      prompt,
      // The default web-search model returns partial species tables; the pro
      // model reliably returns the complete state/province-wide table needed
      // for waterbody-level filtering.
      model: 'gemini_3_1_pro',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          areaLabel: { type: 'string' },
          seasons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                species: { type: 'string' },
                season: { type: 'string', description: 'Open season dates' },
                limit: { type: 'string', description: 'Catch / possession limits (S-licence and C-licence where applicable)' },
              },
              required: ['species', 'season', 'limit'],
            },
          },
          generalRules: { type: 'array', items: { type: 'string' } },
          exceptionsNote: { type: 'string' },
          links: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, url: { type: 'string' } },
              required: ['label', 'url'],
            },
          },
        },
        required: ['areaLabel', 'seasons', 'generalRules', 'exceptionsNote', 'links'],
      },
    });

    // Identify the waterbody at the map centre and the species documented in
    // it — a separate small lookup (the pro model reliably returns the full
    // regs table but often skips this part of a combined prompt).
    let waterbody = null;
    try {
      const wb = await base44.integrations.Core.InvokeLLM({
        prompt: [
          `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
          `An angler's map is centred at coordinates ${lat}, ${lon}. Identify the specific lake or river at or nearest these coordinates - the waterbody an angler there would be fishing. List the fish species documented as present in that waterbody, from official state or provincial fisheries sources (state fishing guide, lake surveys, agency fish pages).`,
          'Return "name": the waterbody name, and "species": an array of the species common names. If the coordinates are not on or near a distinct waterbody, return an empty "species" array.',
        ].join(' '),
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            species: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'species'],
        },
      });
      const wbSpecies = Array.isArray(wb.species) ? wb.species.filter((s) => s && s.trim()) : [];
      if (wbSpecies.length > 0) waterbody = { name: wb.name || null, speciesSummary: wbSpecies.join(', ') };
    } catch (e) {
      // waterbody identification is best-effort — fall back to the full table
    }

    // Filter the state/province-wide table down to the waterbody's species —
    // the same matcher the Ontario official path uses. Falls back to the full
    // table when no waterbody species could be identified.
    let seasons = llm.seasons || [];
    if (waterbody) {
      const filtered = filterSeasonsBySpecies(seasons, waterbody.speciesSummary);
      if (filtered.length > 0) seasons = filtered;
    }
    // Build the payload from explicit plain fields — spreading the raw LLM
    // response can carry non-serializable (cyclic) references that break
    // JSON.stringify when caching and returning the result.
    const regulations = {
      source: 'ai',
      areaLabel: llm.areaLabel || placeLabel,
      seasons,
      generalRules: Array.isArray(llm.generalRules) ? llm.generalRules : [],
      exceptionsNote: llm.exceptionsNote || '',
      links: Array.isArray(llm.links) ? llm.links : [],
      waterbody,
    };
    // Save to the shared cache — later lookups of this area this year are free
    try {
      if (cachedEntry) {
        await base44.entities.RegulationsCache.update(cachedEntry.id, {
          result: JSON.stringify(regulations),
          waterbody_name: waterbody?.name || '',
        });
      } else {
        await base44.entities.RegulationsCache.create({
          cache_key: cacheKey,
          area_label: areaKey,
          lat,
          lon,
          waterbody_name: waterbody?.name || '',
          regs_year: regsYear,
          result: JSON.stringify(regulations),
        });
      }
    } catch (e) {
      // caching is best-effort — the live result still returns
    }
    return Response.json({
      supported: true,
      province,
      zone,
      region: region || null,
      cached: false,
      regulations,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}