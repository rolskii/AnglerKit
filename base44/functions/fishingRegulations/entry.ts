import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// Ontario LIO "Fisheries Management Zone" boundary layer (FMZ 1-20 polygons)
const FMZ_LAYER =
  'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer/14/query';

// Rough province bounding boxes — same boxes the map uses for auto layer selection
const detectProvince = (lat, lon) => {
  if (lat >= 41.6 && lat <= 56.9 && lon >= -95.3 && lon <= -74.0) return 'ontario';
  if (lat >= 48.9 && lat <= 60.0 && lon >= -102.0 && lon <= -88.3) return 'manitoba';
  if (lat >= 43.3 && lat <= 47.1 && lon >= -67.0 && lon <= -59.7) return 'nova_scotia';
  if (lat >= 44.9 && lat <= 62.6 && lon >= -80.0 && lon <= -57.0) return 'quebec';
  return null;
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

    const province = detectProvince(lat, lon);
    if (!province) {
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

    const prompt = [
      `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
      `An angler is viewing a map centred in ${province}, Canada${zone ? ` - Fisheries Management Zone ${zone}` : ''}.`,
      `Look up the current official recreational fishing regulations for this exact area. ${AREA_HINTS[province](zone)}`,
      'Summarize for a recreational angler:',
      '1. "seasons": open seasons and catch & possession limits for the main sport fish species in this area (e.g. walleye, bass, northern pike, lake trout, brook trout, Atlantic salmon, muskie, panfish - only the ones relevant to this area), with dates for the current season year.',
      '2. "generalRules": the key area-wide or province-wide rules an angler must know (licence requirements, bait restrictions, gear/line limits, sanctuaries, catch-and-release waters, protected species).',
      '3. "exceptionsNote": one or two sentences warning that waterbody-specific exceptions apply and the angler must check the official source before fishing.',
      '4. "links": links to the official sources used (regulations summary page, zone page, licence page).',
      'Only state dates, limits and rules that appear in the official sources - never guess or invent numbers.',
      '"areaLabel" should name the jurisdiction and zone (e.g. "Ontario - FMZ 17" or "Quebec (province-wide)").',
    ].join(' ');

    const llm = await base44.integrations.Core.InvokeLLM({
      prompt,
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

    return Response.json({
      supported: true,
      province,
      zone,
      regulations: llm,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}