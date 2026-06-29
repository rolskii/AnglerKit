import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTORS = {
  onedrive: '6a3f4eea83dab3778fd36181',
  gdrive: '6a3f50032d295a9447877a15',
  dropbox: '6a3f50054d07d36c92f3b0aa',
};

const COLUMNS = {
  FlyLine: ["species", "brand", "model", "type", "description", "line_weight", "grain_weight", "head_length", "total_length", "colour", "condition", "reel", "rod", "notes"],
  Reel: ["name", "brand", "model", "size", "condition", "notes"],
  Rod: ["name", "brand", "length", "line_weight", "type", "material", "condition", "notes"],
  Catch: ["species", "date", "location", "length", "girth", "weight", "fly_used", "rod", "reel", "line", "conditions", "water_temp", "released", "notes"],
  Lure: ["name", "type", "category", "brand", "size", "colour", "quantity", "condition", "notes"],
  MiscItem: ["name", "category", "brand", "model", "colour", "quantity", "condition", "value", "notes"],
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

function normalizeFolder(folder) {
  let f = (folder || 'AnglersLog').trim();
  if (!f) f = 'AnglersLog';
  return f;
}

async function uploadToOneDrive(accessToken, name, content, folder) {
  const f = normalizeFolder(folder);
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${f}/${name}:/content`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'text/csv' },
    body: content,
  });
  if (!res.ok) throw new Error(`OneDrive upload failed: ${await res.text()}`);
}

async function ensureGDriveFolder(accessToken, path) {
  const parts = path.split('/').map((p) => p.trim()).filter(Boolean);
  let parentId = '';
  for (const part of parts) {
    const q = encodeURIComponent(`name = '${part.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentId ? ` and '${parentId}' in parents` : ''}`);
    const sres = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const sdata = await sres.json();
    if (sdata.files && sdata.files.length > 0) {
      parentId = sdata.files[0].id;
    } else {
      const cres = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: part, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined }),
      });
      const cdata = await cres.json();
      parentId = cdata.id;
    }
  }
  return parentId;
}

async function uploadToGDrive(accessToken, name, content, folder) {
  const f = normalizeFolder(folder);
  const parentId = await ensureGDriveFolder(accessToken, f);
  const boundary = 'flyfish_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name, parents: parentId ? [parentId] : undefined });
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/csv\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Google Drive upload failed: ${await res.text()}`);
}

async function ensureDropboxFolder(accessToken, path) {
  const parts = path.split('/').map((p) => p.trim()).filter(Boolean);
  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : `/${part}`;
    await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: current }),
    }).catch(() => {});
  }
}

async function uploadToDropbox(accessToken, name, content, folder) {
  const f = normalizeFolder(folder);
  await ensureDropboxFolder(accessToken, f);
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: `/${f}/${name}`, mode: 'overwrite' }),
      'Content-Type': 'application/octet-stream',
    },
    body: content,
  });
  if (!res.ok) throw new Error(`Dropbox upload failed: ${await res.text()}`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let mode = 'backup';
    let service = 'onedrive';
    let folder = 'AnglersLog';
    try {
      const body = await req.json();
      if (body) {
        if (body.mode) mode = body.mode;
        if (body.service) service = body.service;
        if (body.folder) folder = body.folder;
      }
    } catch (_) {}

    const connectorId = CONNECTORS[service];
    if (!connectorId) return Response.json({ error: 'Unknown service' }, { status: 400 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Cloud service not connected', not_connected: true }, { status: 400 });
    }

    if (mode === 'check') {
      return Response.json({ connected: true });
    }

    const [lines, reels, rods, catches, lures, misc] = await Promise.all([
      base44.entities.FlyLine.list('-updated_date', 500),
      base44.entities.Reel.list('-updated_date', 500),
      base44.entities.Rod.list('-updated_date', 500),
      base44.entities.Catch.list('-updated_date', 500),
      base44.entities.Lure.list('-updated_date', 500),
      base44.entities.MiscItem.list('-updated_date', 500),
    ]);

    const date = new Date().toISOString().slice(0, 10);
    const files = [
      { name: `anglerslog-lines-${date}.csv`, content: toCsv(lines, COLUMNS.FlyLine) },
      { name: `anglerslog-reels-${date}.csv`, content: toCsv(reels, COLUMNS.Reel) },
      { name: `anglerslog-rods-${date}.csv`, content: toCsv(rods, COLUMNS.Rod) },
      { name: `anglerslog-catches-${date}.csv`, content: toCsv(catches, COLUMNS.Catch) },
      { name: `anglerslog-lures-${date}.csv`, content: toCsv(lures, COLUMNS.Lure) },
      { name: `anglerslog-misc-${date}.csv`, content: toCsv(misc, COLUMNS.MiscItem) },
    ];

    const uploaded = [];
    for (const f of files) {
      if (service === 'onedrive') {
        await uploadToOneDrive(accessToken, f.name, f.content, folder);
      } else if (service === 'gdrive') {
        await uploadToGDrive(accessToken, f.name, f.content, folder);
      } else if (service === 'dropbox') {
        await uploadToDropbox(accessToken, f.name, f.content, folder);
      }
      uploaded.push(f.name);
    }

    return Response.json({ success: true, files: uploaded, backed_up_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});