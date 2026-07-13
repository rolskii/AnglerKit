Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const z = url.searchParams.get('z');
    const x = url.searchParams.get('x');
    const y = url.searchParams.get('y');

    if (z === null || x === null || y === null) {
      return new Response('Missing z, x, or y parameter', { status: 400 });
    }

    const tileUrl = `https://nonna-geoserver.data.chs-shc.ca/geoserver/gwc/service/wmts/rest/nonna:NONNA%2010/raster/EPSG3857/EPSG3857:${z}/${y}/${x}?format=image/png`;

    const tileRes = await fetch(tileUrl);

    if (!tileRes.ok) {
      return new Response('Tile not found', { status: 404 });
    }

    const tileBytes = await tileRes.arrayBuffer();
    return new Response(tileBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});