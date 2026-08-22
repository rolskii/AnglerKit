import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Force the Test database by injecting X-Data-Env: dev into the client config.
    const devHeaders = new Headers(req.headers);
    devHeaders.set('X-Data-Env', 'dev');
    const devReq = new Request(req.url, { method: req.method, headers: devHeaders });
    const base44 = createClientFromRequest(devReq);

    const user = await base44.auth.me();
    const entities = ['Rod', 'Reel', 'FlyLine', 'Lure', 'MiscItem', 'Supply', 'Catch'];
    const out = { user: user ? { id: user.id, email: user.email, role: user.role } : null, counts: {}, reels: [], rods: [] };
    for (const e of entities) {
      const list = await base44.entities[e].list('-updated_date', 500);
      out.counts[e] = list.length;
      if (e === 'Reel') out.reels = list.map(r => ({ id: r.id, name: r.name, brand: r.brand, model: r.model, created_by_id: r.created_by_id, imgs: (r.images || []).length }));
      if (e === 'Rod') out.rods = list.map(r => ({ id: r.id, name: r.name, brand: r.brand, model: r.model, created_by_id: r.created_by_id, imgs: (r.images || []).length }));
    }
    return Response.json(out);
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});