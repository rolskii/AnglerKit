import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// Ontario GeoHub (LIO open data) proxy. Returns GeoJSON features for a given
// layer within a bounding box. Public, key-less data, but we still require an
// authenticated app user so the endpoint isn't openly abused.
const SERVICE =
  'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer';

const LAYERS = {
  'fishing-access-point': {
    id: 15,
    outFields:
      'OGF_ID,SITE_NAME,FISHING_ACCESS_POINT_TYPE,PARKING_PRESENCE_FLG,SITE_OWNERSHIP_TYPE,ACCESSIBILITY_FLG,USER_FEE_FLG,GENERAL_COMMENTS,SITE_PHOTO_URL,ADDITIONAL_INFORMATION_URL',
  },
  'ara-line-segment': {
    id: 1,
    outFields:
      'OGF_ID,ARA_IDENT,OFFICIAL_WATERBODY_NAME,CORPORATE_WATERBODY_NAME,WATERBODY_TYPE,THERMAL_REGIME,FISHERIES_MANAGEMENT_ZONE_ID,FISH_SPECIES_SUMMARY,MAXIMUM_DEPTH,MEAN_DEPTH,SURFACE_AREA,OFFICIAL_NAME_LABEL',
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const layer = body.layer;
    const bbox = body.bbox;
    const cfg = LAYERS[layer];
    if (!cfg || !bbox || [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax].some((v) => v == null || isNaN(v))) {
      return Response.json({ error: 'Invalid layer or bbox' }, { status: 400 });
    }

    const limit = Math.min(Math.max(parseInt(body.limit, 10) || 1000, 1), 2000);
    const geom = `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`;
    const params = new URLSearchParams({
      where: '1=1',
      geometry: geom,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      outSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: cfg.outFields,
      returnGeometry: 'true',
      f: 'geojson',
      resultRecordCount: String(limit),
    });

    const r = await fetch(`${SERVICE}/${cfg.id}/query?${params.toString()}`);
    if (!r.ok) return Response.json({ error: `GeoHub request failed (${r.status})` }, { status: 502 });
    const data = await r.json();
    const features = Array.isArray(data.features) ? data.features : [];
    return Response.json({ features, count: features.length });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}