import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { reverseGeocode } from '../../shared/appleMapsAuth.ts';

// Border-blind regional open-data adapter for (1) fishing access points and
// (2) lake depth contours. Given a map-centre coordinate and a viewport bbox,
// it resolves the region (Canadian province or US state) under the centre,
// picks that region's official open-data source, and returns normalized
// GeoJSON features. Known regions use hand-verified sources; everywhere else
// the official ArcGIS layer is discovered once per region (AI-assisted,
// verified against the live endpoint) and cached in the RegionLayer entity,
// so every later lookup — for every angler — is free.

const LIO_OPEN07 =
  'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer';
const LIO_OPEN01 =
  'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer';

const YESNO = (v) => (v && v.toUpperCase() === 'Y' ? 'Yes' : v && v.toUpperCase() === 'N' ? 'No' : v || '');

// Hand-verified sources — no discovery cost for these regions.
const KNOWN = {
  access: {
    Ontario: {
      type: 'arcgis',
      serviceUrl: LIO_OPEN07,
      layerIndex: 15,
      sourceLabel: 'Ontario GeoHub · Fishing Access Point',
      nameField: 'SITE_NAME',
      detailFields: [
        { field: 'FISHING_ACCESS_POINT_TYPE', label: 'Type' },
        { field: 'SITE_OWNERSHIP_TYPE', label: 'Ownership' },
        { field: 'PARKING_PRESENCE_FLG', label: 'Parking' },
        { field: 'ACCESSIBILITY_FLG', label: 'Accessible' },
        { field: 'USER_FEE_FLG', label: 'User Fee' },
      ],
      yesNoFields: ['PARKING_PRESENCE_FLG', 'ACCESSIBILITY_FLG', 'USER_FEE_FLG'],
      commentsField: 'GENERAL_COMMENTS',
      photoFields: ['SITE_PHOTO_URL'],
      infoUrlField: 'ADDITIONAL_INFORMATION_URL',
    },
    Manitoba: {
      type: 'arcgis',
      serviceUrl: 'https://services.arcgis.com/mMUesHYPkXjaFGfS/arcgis/rest/services/Manitoba_Waterbody_Entry_Points/FeatureServer',
      layerIndex: 0,
      sourceLabel: 'Manitoba Waterbody Entry Points',
      nameField: 'WATERBODY_NAME',
      detailFields: [{ field: 'ENTRY_TYPE', label: 'Entry Type' }],
      photoFields: ['PHOTO_1', 'PHOTO_2', 'PHOTO_3'],
    },
    'Nova Scotia': {
      type: 'arcgis',
      serviceUrl: 'https://services7.arcgis.com/GM2drW70KjAhts06/arcgis/rest/services/Nova_Scotia_Boat_Launches/FeatureServer',
      layerIndex: 3,
      sourceLabel: 'Nova Scotia Boat Launches',
      nameField: 'Name',
      detailFields: [
        { field: 'Launch_Typ', label: 'Launch Type' },
        { field: 'Launch_Sta', label: 'Status' },
        { field: 'Launch_Con', label: 'Condition' },
        { field: 'Boat_Type', label: 'Boat Type' },
      ],
      commentsField: 'Notes',
    },
    Quebec: { type: 'quebec', sourceLabel: 'Allons pêcher · FédéCP' },
  },
  bathy: {
    Ontario: {
      type: 'arcgis',
      serviceUrl: LIO_OPEN01,
      layerIndex: 30,
      sourceLabel: 'Ontario MNRF Bathymetry',
      depthField: 'DEPTH',
      depthUnits: 'm',
    },
    // Quebec has no machine-readable bathymetry layer — fail soft with no features.
    Quebec: { type: 'none' },
  },
};

// Quebec — "Allons pêcher" (FédéCP / MFFP). No ArcGIS service: the interactive
// map publishes every access point through a single large JSON asset endpoint.
// Fetched once per isolate, cached, then filtered by the requested bbox.
const QUEBEC_ASSETS_URL = 'http://carte.allonspecher.com/app/aphome/GetAssets?v=2';
let quebecSpotsCache = null;
async function getQuebecSpots() {
  if (quebecSpotsCache) return quebecSpotsCache;
  const r = await fetch(QUEBEC_ASSETS_URL);
  if (!r.ok) throw new Error(`Allons pêcher request failed (${r.status})`);
  const data = await r.json();
  const spots = JSON.parse(data.Spots || '[]');
  quebecSpotsCache = (spots.features || (Array.isArray(spots) ? spots : [])).filter(
    (f) => f && f.geometry && f.geometry.type === 'Point' && Array.isArray(f.geometry.coordinates)
  );
  return quebecSpotsCache;
}

const normQuebecAccess = (a) => ({
  region: 'Quebec',
  source: 'Allons pêcher · FédéCP',
  name: a.nom || 'Fishing Access Point',
  rows: [
    a.municipalite ? { label: 'Municipality', value: a.municipalite } : null,
    a.localisation ? { label: 'Location', value: a.localisation } : null,
    a.miseAleau ? { label: 'Boat Launch', value: 'Yes' } : null,
    a.rampe ? { label: 'Ramp', value: 'Yes' } : null,
    a.quaiPublic ? { label: 'Public Dock', value: 'Yes' } : null,
    a.pecheAgue ? { label: 'Wading Access', value: 'Yes' } : null,
    a.pecheDhiver ? { label: 'Winter Fishing', value: 'Yes' } : null,
    a.stationnement ? { label: 'Parking', value: 'Yes' } : null,
    a.lavageBateau ? { label: 'Boat Wash Station', value: 'Yes' } : null,
    a.payant ? { label: 'Paid Access', value: 'Yes' } : null,
    a.restrictionMoteur ? { label: 'Motor Restriction', value: 'Yes' } : null,
    a.residentSeulement ? { label: 'Residents Only', value: 'Yes' } : null,
    a.zoneNumber ? { label: 'Fishing Zone', value: a.zoneNumber } : null,
    Array.isArray(a.poissons) && a.poissons.length
      ? { label: 'Species', value: a.poissons.map((p) => p.nom).join(', ') }
      : null,
  ].filter(Boolean),
  comments: a.commentaires || '',
  photos: [],
  infoUrl: 'http://carte.allonspecher.com/',
});

// --- RegionLayer cache helpers (shared, same pattern as the regulations cache) ---
const getCache = async (base44, key) => {
  try {
    const hits = await base44.entities.RegionLayer.filter({ cache_key: key }, '-created_date', 1);
    return hits?.[0] || null;
  } catch (e) {
    return null;
  }
};
const putCache = async (base44, key, record) => {
  try {
    await base44.entities.RegionLayer.create({ cache_key: key, ...record });
  } catch (e) {
    // caching is best-effort — the live result still returns
  }
};

// --- AI discovery: find the region's official ArcGIS layer, then VERIFY it ---
// live before trusting it. The LLM only ever *picks* an official source — it
// never invents data. One call per region per layer type, cached afterwards.
const discoverConfig = async (base44, region, country, layerType) => {
  const isBathy = layerType === 'bathy';
  const countryName = country === 'US' ? 'United States' : 'Canada';
  const target = isBathy
    ? 'lake bathymetry depth contour LINES (a polyline layer of digitized lake depth contours)'
    : 'fishing access points, boat launches, or angling access sites (a point layer)';
  const fieldAsk = isBathy
    ? 'depthField: the exact attribute field holding the contour depth, and depthUnits: "m" or "ft" for that field\'s unit.'
    : 'nameField: the site-name field; detailFields: up to 6 descriptive fields as {field, label} (e.g. Launch Type, Parking, Fee); commentsField if present; photoFields (photo URL fields) if present; infoUrlField (more-info URL) if present.';
  const prompt = [
    `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
    `Find the official machine-readable ArcGIS REST layer published by the government of ${region}, ${countryName}, for ${target}.`,
    `Prefer the official state or provincial fish & wildlife / natural resources agency's ArcGIS portal (services*.arcgis.com or the agency's own ArcGIS server).`,
    `Return the full REST service URL (ending in /MapServer or /FeatureServer), the layerIndex of the matching layer, a short sourceLabel naming the agency dataset, and ${fieldAsk}`,
    'Only return an endpoint you can verify exists in official sources. If no machine-readable official layer exists, return found=false. Never invent or guess URLs.',
  ].join(' ');

  const llm = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        found: { type: 'boolean' },
        serviceUrl: { type: 'string' },
        layerIndex: { type: 'number' },
        sourceLabel: { type: 'string' },
        nameField: { type: 'string' },
        detailFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: { field: { type: 'string' }, label: { type: 'string' } },
            required: ['field', 'label'],
          },
        },
        commentsField: { type: 'string' },
        photoFields: { type: 'array', items: { type: 'string' } },
        infoUrlField: { type: 'string' },
        depthField: { type: 'string' },
        depthUnits: { type: 'string' },
      },
      required: ['found', 'serviceUrl', 'layerIndex', 'sourceLabel'],
    },
  });

  if (!llm?.found || !/^https?:\/\//.test(llm.serviceUrl || '')) return null;
  const cfg = {
    type: 'arcgis',
    serviceUrl: (llm.serviceUrl || '').replace(/\/+$/, ''),
    layerIndex: Number(llm.layerIndex),
    sourceLabel: llm.sourceLabel || `${region} open data`,
    nameField: llm.nameField || '',
    detailFields: Array.isArray(llm.detailFields)
      ? llm.detailFields.filter((d) => d && d.field)
      : [],
    commentsField: llm.commentsField || '',
    photoFields: Array.isArray(llm.photoFields) ? llm.photoFields.filter(Boolean) : [],
    infoUrlField: llm.infoUrlField || '',
    depthField: llm.depthField || '',
    depthUnits: llm.depthUnits === 'ft' ? 'ft' : 'm',
  };

  // Verify the endpoint is live and the key fields really exist on it.
  try {
    const metaRes = await fetch(`${cfg.serviceUrl}/${cfg.layerIndex}?f=json`);
    if (!metaRes.ok) return null;
    const meta = await metaRes.json();
    if (meta.error) return null;
    const testParams = new URLSearchParams({
      where: '1=1',
      resultRecordCount: '1',
      outFields: '*',
      returnGeometry: 'false',
      f: 'json',
    });
    const testRes = await fetch(`${cfg.serviceUrl}/${cfg.layerIndex}/query?${testParams.toString()}`);
    if (!testRes.ok) return null;
    const testData = await testRes.json();
    if (testData.error) return null;
    const attrs = testData?.features?.[0]?.attributes;
    if (!attrs) return null;
    const keyField = isBathy ? cfg.depthField : cfg.nameField;
    if (!keyField || !(keyField in attrs)) return null;
    // Keep only detail fields the layer actually has.
    if (!isBathy) cfg.detailFields = cfg.detailFields.filter((d) => d.field in attrs);
    return cfg;
  } catch (e) {
    return null;
  }
};

// --- ArcGIS query + normalization ---
const queryArcgis = async (cfg, bbox, limit) => {
  const fields = new Set(['OBJECTID']);
  if (cfg.nameField) fields.add(cfg.nameField);
  (cfg.detailFields || []).forEach((d) => fields.add(d.field));
  if (cfg.commentsField) fields.add(cfg.commentsField);
  (cfg.photoFields || []).forEach((f) => fields.add(f));
  if (cfg.infoUrlField) fields.add(cfg.infoUrlField);
  if (cfg.depthField) fields.add(cfg.depthField);
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: [...fields].join(','),
    returnGeometry: 'true',
    f: 'geojson',
    resultRecordCount: String(limit),
  });
  const r = await fetch(`${cfg.serviceUrl}/${cfg.layerIndex}/query?${params.toString()}`);
  if (!r.ok) throw new Error(`${cfg.sourceLabel} request failed (${r.status})`);
  const data = await r.json();
  if (!data.error && Array.isArray(data.features)) return data.features;

  // Some ArcGIS servers don't support the GeoJSON output format or reject
  // partial field lists — retry with native Esri JSON and all fields, then
  // convert point / polyline features over (normalization drops missing
  // fields gracefully).
  params.set('f', 'json');
  params.set('outFields', '*');
  const r2 = await fetch(`${cfg.serviceUrl}/${cfg.layerIndex}/query?${params.toString()}`);
  if (!r2.ok) throw new Error(`${cfg.sourceLabel} request failed (${r2.status})`);
  const data2 = await r2.json();
  if (data2.error) throw new Error(`${cfg.sourceLabel} query error: ${JSON.stringify(data2.error).slice(0, 300)}`);
  return (Array.isArray(data2.features) ? data2.features : [])
    .map((f) => {
      if (!f || !f.geometry) return null;
      if (typeof f.geometry.x === 'number') {
        return { type: 'Feature', geometry: { type: 'Point', coordinates: [f.geometry.x, f.geometry.y] }, properties: f.attributes || {} };
      }
      if (Array.isArray(f.geometry.paths)) {
        const paths = f.geometry.paths;
        return {
          type: 'Feature',
          geometry: { type: paths.length > 1 ? 'MultiLineString' : 'LineString', coordinates: paths.length > 1 ? paths : paths[0] },
          properties: f.attributes || {},
        };
      }
      return null;
    })
    .filter(Boolean);
};

const normAccess = (cfg, region) => (a) => ({
  region,
  source: cfg.sourceLabel,
  name: a[cfg.nameField] || 'Fishing Access Point',
  rows: (cfg.detailFields || [])
    .map((d) => {
      const v = a[d.field];
      if (v == null || v === '') return null;
      return { label: d.label, value: (cfg.yesNoFields || []).includes(d.field) ? YESNO(v) : v };
    })
    .filter(Boolean),
  comments: cfg.commentsField ? a[cfg.commentsField] || '' : '',
  photos: (cfg.photoFields || []).map((f) => a[f]).filter(Boolean),
  infoUrl: cfg.infoUrlField ? a[cfg.infoUrlField] || '' : '',
});

// Depth is normalized to metres server-side so every client renders feet the
// same way, whatever unit the source region publishes.
const toMetres = (v, units) => (units === 'ft' ? v * 0.3048 : v);
const normBathy = (cfg) => (a) => ({ DEPTH: toMetres(a[cfg.depthField], cfg.depthUnits) });

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const layerType = body.layer === 'bathy' ? 'bathy' : 'access';
    const bbox = body.bbox;
    const lat = parseFloat(body.lat);
    const lon = parseFloat(body.lon);
    if (
      !bbox ||
      [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax].some((v) => v == null || isNaN(v)) ||
      isNaN(lat) ||
      isNaN(lon)
    ) {
      return Response.json({ error: 'Invalid bbox or centre coordinates' }, { status: 400 });
    }
    const limit = Math.min(Math.max(parseInt(body.limit, 10) || 1000, 1), 2000);

    // --- Region resolution, cached per ~5 km map grid: panning around a lake
    // doesn't re-geocode, and the first lookup in a cell reverse-geodes once
    // for every later angler.
    const grid = (v) => Math.round(v * 20) / 20;
    const gridKey = `grid|${grid(lat)},${grid(lon)}`;
    let region = '';
    let country = '';
    const gridRec = await getCache(base44, gridKey);
    if (gridRec) {
      region = gridRec.region || '';
      country = gridRec.country || '';
    } else {
      const geo = await reverseGeocode(lat, lon);
      const supported = geo && (geo.countryCode === 'CA' || geo.countryCode === 'US');
      region = supported && geo.name ? geo.name : '';
      country = supported ? geo.countryCode : '';
      await putCache(base44, gridKey, {
        layer_type: 'grid',
        region,
        country,
        status: region ? 'resolved' : 'unsupported',
        config: '',
      });
    }
    if (!region) {
      return Response.json({ features: [], count: 0, region: null, unsupported: true });
    }

    // --- Adapter config: known regions are free; new regions are discovered
    // once, verified against the live endpoint, and cached for everyone.
    let cfg = null;
    const seed = KNOWN[layerType][region];
    if (seed && seed.type === 'none') {
      return Response.json({ features: [], count: 0, region, unsupported: true });
    }
    if (seed) {
      cfg = seed;
    } else {
      const cfgKey = `cfg:${layerType}|${region}`;
      const cfgRec = await getCache(base44, cfgKey);
      if (cfgRec && cfgRec.status === 'ok' && cfgRec.config) {
        try {
          cfg = JSON.parse(cfgRec.config);
        } catch (e) {
          cfg = null;
        }
      } else if (cfgRec && cfgRec.status === 'unsupported') {
        return Response.json({ features: [], count: 0, region, unsupported: true });
      } else {
        const discovered = await discoverConfig(base44, region, country, layerType);
        if (discovered) {
          cfg = discovered;
          await putCache(base44, cfgKey, {
            layer_type: layerType,
            region,
            country,
            status: 'ok',
            config: JSON.stringify(discovered),
          });
        } else {
          await putCache(base44, cfgKey, {
            layer_type: layerType,
            region,
            country,
            status: 'unsupported',
            config: '',
          });
          return Response.json({ features: [], count: 0, region, unsupported: true });
        }
      }
    }
    if (!cfg) {
      return Response.json({ features: [], count: 0, region, unsupported: true });
    }

    // --- Quebec's bespoke (non-ArcGIS) source
    if (cfg.type === 'quebec') {
      const spots = await getQuebecSpots();
      const features = spots
        .filter((f) => {
          const c = f.geometry.coordinates;
          return c[0] >= bbox.xmin && c[0] <= bbox.xmax && c[1] >= bbox.ymin && c[1] <= bbox.ymax;
        })
        .slice(0, limit)
        .map((f) => ({ type: 'Feature', geometry: f.geometry, properties: normQuebecAccess(f.properties || {}) }));
      return Response.json({ features, count: features.length, region, source: cfg.sourceLabel });
    }

    const raw = await queryArcgis(cfg, bbox, limit);
    if (layerType === 'bathy') {
      const features = raw
        .filter(
          (f) =>
            f &&
            f.geometry &&
            (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') &&
            Array.isArray(f.geometry.coordinates)
        )
        .map((f) => ({ type: 'Feature', geometry: f.geometry, properties: normBathy(cfg)(f.properties || {}) }));
      return Response.json({ features, count: features.length, region, source: cfg.sourceLabel });
    }
    const normalize = normAccess(cfg, region);
    const features = raw
      .filter((f) => f && f.geometry && f.geometry.type === 'Point' && Array.isArray(f.geometry.coordinates))
      .map((f) => ({ type: 'Feature', geometry: f.geometry, properties: normalize(f.properties || {}) }));
    return Response.json({ features, count: features.length, region, source: cfg.sourceLabel });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}