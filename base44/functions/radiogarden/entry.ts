import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const RG_API = 'https://radio.garden/api';

const channelIdFromUrl = (url) => {
  if (!url) return '';
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

const normalizeChannel = (page) => {
  const id = channelIdFromUrl(page?.url);
  if (!id) return null;
  const place = page.place?.title;
  const country = page.country?.title;
  const location = page.subtitle || [place, country].filter(Boolean).join(', ');
  return {
    id,
    name: (page.title || 'Unknown').trim(),
    location,
    url: `${RG_API}/ara/content/listen/${id}/channel.mp3`,
    favicon: '',
    website: page.website || '',
    secure: page.secure !== false,
  };
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload = {};
    try { payload = await req.json(); } catch (e) { payload = {}; }

    // Geo lookup for local defaults.
    if (payload.geo) {
      const geoRes = await fetch(`${RG_API}/geo`);
      if (!geoRes.ok) return Response.json({ city: null });
      const geo = await geoRes.json();
      return Response.json({ city: geo?.city || null });
    }

    const term = (payload.query || '').trim();
    if (!term) return Response.json({ stations: [] });

    const searchRes = await fetch(`${RG_API}/search?q=${encodeURIComponent(term)}`);
    if (!searchRes.ok) return Response.json({ stations: [] });
    const data = await searchRes.json();
    const hits = data?.hits?.hits || [];
    const stations = [];
    const seen = new Set();
    hits.forEach((hit) => {
      const src = hit?._source;
      if (!src || src.type !== 'channel' || !src.page) return;
      const station = normalizeChannel(src.page);
      if (station && !seen.has(station.id)) {
        seen.add(station.id);
        stations.push(station);
      }
    });
    return Response.json({ stations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}