import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, name, description, track, pins, drawings, measurements, distance_km, duration_sec, date } = body;

    const data = {
      name,
      description: description || '',
      track: track || [],
      pins: pins || [],
      drawings: drawings || [],
      measurements: measurements || [],
      distance_km: distance_km || 0,
      duration_sec: duration_sec || 0,
      date: date || null
    };

    let result;
    if (id) {
      result = await base44.asServiceRole.entities.MapCourse.update(id, data);
    } else {
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
      result = await base44.asServiceRole.entities.MapCourse.create(data);
    }

    return Response.json({ success: true, id: result.id, name: result.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});