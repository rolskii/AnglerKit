import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, name, description, track, pins, drawings, measurements, distance_km, duration_sec, date } = body;

    // For updates (e.g. rename), only patch the provided fields
    if (id) {
      const patch = {};
      if (name !== undefined) patch.name = name;
      if (description !== undefined) patch.description = description;
      if (track !== undefined) patch.track = track;
      if (pins !== undefined) patch.pins = pins;
      if (drawings !== undefined) patch.drawings = drawings;
      if (measurements !== undefined) patch.measurements = measurements;
      if (distance_km !== undefined) patch.distance_km = distance_km;
      if (duration_sec !== undefined) patch.duration_sec = duration_sec;
      if (date !== undefined) patch.date = date;
      const result = await base44.entities.MapCourse.update(id, patch);
      return Response.json({ success: true, id: result.id, name: result.name });
    }

    // For new records, require name and build full payload
    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
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
    const result = await base44.entities.MapCourse.create(data);
    return Response.json({ success: true, id: result.id, name: result.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});