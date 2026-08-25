import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// Multi-province fishing access proxy. Each province publishes its own
// ArcGIS FeatureServer for boating/angling access points. Given a `province`
// and a viewport bounding box (4326), this queries the matching service and
// returns normalized GeoJSON point features so the map can render them
// identically regardless of source. Public, key-less data — we still require
// an authenticated app user so the endpoint isn't openly abused.

const SOURCES = {
  manitoba: {
    label: 'Manitoba Waterbody Entry Points',
    url: 'https://services.arcgis.com/mMUesHYPkXjaFGfS/arcgis/rest/services/Manitoba_Waterbody_Entry_Points/FeatureServer/0/query',
    outFields: 'OBJECTID,WATERBODY_NAME,ENTRY_TYPE,PHOTO_1,PHOTO_2,PHOTO_3',
    normalize: (a) => ({
      province: 'manitoba',
      source: 'Manitoba Waterbody Entry Points',
      name: a.WATERBODY_NAME || 'Waterbody Entry Point',
      rows: [
        a.ENTRY_TYPE ? { label: 'Entry Type', value: a.ENTRY_TYPE } : null,
      ].filter(Boolean),
      comments: '',
      photos: [a.PHOTO_1, a.PHOTO_2, a.PHOTO_3].filter(Boolean),
      infoUrl: '',
    }),
  },
  nova_scotia: {
    label: 'Nova Scotia Boat Launches',
    url: 'https://services7.arcgis.com/GM2drW70KjAhts06/arcgis/rest/services/Nova_Scotia_Boat_Launches/FeatureServer/3/query',
    outFields: 'OBJECTID,Name,Launch_Sta,Launch_Con,Launch_Typ,Boat_Type,Notes',
    normalize: (a) => ({
      province: 'nova_scotia',
      source: 'Nova Scotia Boat Launches',
      name: a.Name || 'Boat Launch',
      rows: [
        a.Launch_Typ ? { label: 'Launch Type', value: a.Launch_Typ } : null,
        a.Launch_Sta ? { label: 'Status', value: a.Launch_Sta } : null,
        a.Launch_Con ? { label: 'Condition', value: a.Launch_Con } : null,
        a.Boat_Type ? { label: 'Boat Type', value: a.Boat_Type } : null,
      ].filter(Boolean),
      comments: a.Notes || '',
      photos: [],
      infoUrl: '',
    }),
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const province = body.province;
    const bbox = body.bbox;
    const src = SOURCES[province];
    if (!src || !bbox || [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax].some((v) => v == null || isNaN(v))) {
      return Response.json({ error: 'Invalid province or bbox' }, { status: 400 });
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
      outFields: src.outFields,
      returnGeometry: 'true',
      f: 'geojson',
      resultRecordCount: String(limit),
    });

    const r = await fetch(`${src.url}?${params.toString()}`);
    if (!r.ok) return Response.json({ error: `${src.label} request failed (${r.status})` }, { status: 502 });
    const data = await r.json();
    const raw = Array.isArray(data.features) ? data.features : [];
    const features = raw
      .filter((f) => f && f.geometry && Array.isArray(f.geometry.coordinates))
      .map((f) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: src.normalize(f.properties || {}),
      }));
    return Response.json({ features, count: features.length, province });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}