import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a3f4eea83dab3778fd36181';

const COLUMNS = {
  FlyLine: ["species", "brand", "model", "type", "description", "line_weight", "grain_weight", "head_length", "total_length", "colour", "condition", "reel", "rod", "notes"],
  Reel: ["name", "brand", "model", "size", "condition", "notes"],
  Rod: ["name", "brand", "length", "line_weight", "type", "material", "condition", "notes"],
};

function toCsv(records, columns) {
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const rows = [columns.join(",")];
  records.forEach((r) => {
    rows.push(columns.map((c) => escape(r[c])).join(","));
  });
  return rows.join("\n");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let mode = 'backup';
    try { const body = await req.json(); if (body && body.mode) mode = body.mode; } catch (_) {}

    // Verify the app user's OneDrive connection
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'OneDrive not connected', not_connected: true }, { status: 400 });
    }

    if (mode === 'check') {
      return Response.json({ connected: true });
    }

    const [lines, reels, rods] = await Promise.all([
      base44.entities.FlyLine.list('-updated_date', 500),
      base44.entities.Reel.list('-updated_date', 500),
      base44.entities.Rod.list('-updated_date', 500),
    ]);

    const date = new Date().toISOString().slice(0, 10);
    const files = [
      { name: `flyfish-lines-${date}.csv`, content: toCsv(lines, COLUMNS.FlyLine) },
      { name: `flyfish-reels-${date}.csv`, content: toCsv(reels, COLUMNS.Reel) },
      { name: `flyfish-rods-${date}.csv`, content: toCsv(rods, COLUMNS.Rod) },
    ];

    const uploaded = [];
    for (const f of files) {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/FlyFish/${f.name}:/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/csv',
        },
        body: f.content,
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `OneDrive upload failed: ${err}` }, { status: 502 });
      }
      uploaded.push(f.name);
    }

    return Response.json({ success: true, files: uploaded, backed_up_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});