import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, FileJson, CheckCircle2, AlertCircle, Database, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const ENTITIES = [
  { name: "FlyLine", label: "Lines" },
  { name: "Reel", label: "Reels" },
  { name: "Rod", label: "Rods" },
];

const ALL_ENTITIES = [
  { name: "FlyLine", label: "Lines" },
  { name: "Reel", label: "Reels" },
  { name: "Rod", label: "Rods" },
  { name: "Catch", label: "Catches" },
  { name: "Lure", label: "Lures & Flies" },
  { name: "MiscItem", label: "Misc. Gear" },
];

const COLUMNS = {
  FlyLine: ["species", "brand", "model", "type", "description", "line_weight", "grain_weight", "head_length", "total_length", "colour", "condition", "reel", "rod", "notes"],
  Reel: ["name", "brand", "model", "size", "condition", "notes"],
  Rod: ["name", "brand", "length", "line_weight", "type", "material", "condition", "notes"],
};

const SAMPLES = {
  FlyLine: {
    file: "flyfish-sample-lines.csv",
    content: `species,brand,model,type,description,line_weight,grain_weight,head_length,total_length,colour,condition,reel,rod,notes
Trout,Scientific Anglers,Mastery Trout,WF,Floating,5,140,40,90,Olive,New,,,Floating
Steelhead,RIO,Outbound Short,Sinking,Sink tip,8,300,30,100,Blue,Good,Lamson Liquid,,Sink tip
`,
  },
  Reel: {
    file: "flyfish-sample-reels.csv",
    content: `name,brand,model,size,condition,notes
Lamson Liquid,Lamson,Liquid 3,3+,New,
Hatch Finatic,Hatch,Finatic 5,5+,Like New,Backup reel
`,
  },
  Rod: {
    file: "flyfish-sample-rods.csv",
    content: `name,brand,length,line_weight,type,material,condition,notes
Orvis Clearwater 9' 5wt,Orvis,9 ft,5,Single Hand,Carbon,New,
Sage X 10' 7wt,Sage,10 ft,7,Single Hand,Carbon,Good,Great dry fly rod
`,
  },
};

const parseCsv = (text) => {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ""; i++; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    if (ch === '\r') { i++; continue; }
    field += ch; i++;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c !== "")).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? r[idx] : ""; });
    return obj;
  });
};

const toCsv = (records, columns) => {
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
};

const downloadFile = (filename, content, mime = "text/csv") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const fetchAsDataUri = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const dataUriToFile = (dataUri, filename) => {
  const [meta, base64] = dataUri.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], `${filename}.${ext}`, { type: mime });
};

const reuploadImage = async (img, name) => {
  if (!img || !img.startsWith("data:")) return img;
  try {
    const file = dataUriToFile(img, name);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  } catch {
    return null;
  }
};

export default function ImportExportSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importEntity, setImportEntity] = useState("FlyLine");
  const [importResult, setImportResult] = useState(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [backupProgress, setBackupProgress] = useState(null);
  const [restoreProgress, setRestoreProgress] = useState(null);

  const handleBackup = async () => {
    setBacking(true);
    setBackupProgress({ done: 0, total: 0 });
    try {
      const data = {};
      for (const ent of ALL_ENTITIES) {
        const records = await base44.entities[ent.name].list("-updated_date", 2000);
        data[ent.name] = records.map(({ id, created_date, updated_date, created_by_id, ...rest }) => rest);
      }
      const tasks = [];
      for (const ent of ALL_ENTITIES) {
        for (const rec of data[ent.name]) {
          if (Array.isArray(rec.images)) {
            rec.images.forEach((url, idx) => {
              if (url) tasks.push({ url, set: (v) => { rec.images[idx] = v; } });
            });
          }
          if (rec.image_url) {
            const url = rec.image_url;
            tasks.push({ url, set: (v) => { rec.image_url = v; } });
          }
        }
      }
      setBackupProgress({ done: 0, total: tasks.length });
      let done = 0;
      const POOL = 6;
      for (let i = 0; i < tasks.length; i += POOL) {
        const batch = tasks.slice(i, i + POOL);
        await Promise.all(batch.map(async (t) => {
          const dataUri = await fetchAsDataUri(t.url);
          t.set(dataUri || t.url);
          done++;
          setBackupProgress({ done, total: tasks.length });
        }));
      }
      const date = new Date().toISOString().slice(0, 10);
      const payload = { app: "AnglersLog", version: 2, exported_at: new Date().toISOString(), data };
      downloadFile(`anglerslog-backup-${date}.json`, JSON.stringify(payload, null, 2), "application/json");
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error("Backup failed");
    } finally {
      setBacking(false);
      setBackupProgress(null);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    setRestoreResult(null);
    setRestoreProgress({ entity: "", done: 0, total: 0 });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data || parsed;
      if (!data || typeof data !== "object") throw new Error("Invalid backup file");
      const summary = [];
      for (const ent of ALL_ENTITIES) {
        const records = data[ent.name];
        if (!records || !Array.isArray(records) || records.length === 0) continue;
        const cleaned = records.map(({ id, created_date, updated_date, created_by_id, ...rest }) => rest);
        let imgCount = 0;
        for (const rec of cleaned) {
          if (Array.isArray(rec.images)) imgCount += rec.images.filter((i) => i && i.startsWith("data:")).length;
          if (rec.image_url && rec.image_url.startsWith("data:")) imgCount += 1;
        }
        setRestoreProgress({ entity: ent.label, done: 0, total: imgCount });
        let done = 0;
        for (const rec of cleaned) {
          if (Array.isArray(rec.images)) {
            rec.images = await Promise.all(rec.images.map((img, idx) => reuploadImage(img, `${ent.name}-${idx}`)));
            done += rec.images.filter((i) => i && i.startsWith("data:")).length;
          }
          if (rec.image_url) {
            rec.image_url = await reuploadImage(rec.image_url, `${ent.name}-img`);
            if (rec.image_url && rec.image_url.startsWith("data:")) done++;
          }
          setRestoreProgress({ entity: ent.label, done, total: imgCount });
        }
        const created = await base44.entities[ent.name].bulkCreate(cleaned);
        summary.push(`${ent.label}: ${created.length}`);
      }
      setRestoreResult({ summary });
      toast.success("Restore complete");
    } catch (e) {
      setRestoreResult({ error: e.message || "Invalid backup file" });
      toast.error("Restore failed");
    } finally {
      setRestoring(false);
      setRestoreProgress(null);
      e.target.value = "";
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const [lines, reels, rods] = await Promise.all([
        base44.entities.FlyLine.list("-updated_date", 500),
        base44.entities.Reel.list("-updated_date", 500),
        base44.entities.Rod.list("-updated_date", 500),
      ]);
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(`flyfish-lines-${date}.csv`, toCsv(lines, COLUMNS.FlyLine));
      downloadFile(`flyfish-reels-${date}.csv`, toCsv(reels, COLUMNS.Reel));
      downloadFile(`flyfish-rods-${date}.csv`, toCsv(rods, COLUMNS.Rod));
      toast.success("Export complete");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingle = async (entityName) => {
    try {
      const records = await base44.entities[entityName].list("-updated_date", 500);
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(`flyfish-${entityName.toLowerCase()}-${date}.csv`, toCsv(records, COLUMNS[entityName]));
      toast.success(`${entityName} exported`);
    } catch (e) {
      toast.error(`Export failed for ${entityName}`);
    }
  };

  const handleDownloadSample = (entityName) => {
    const { file, content } = SAMPLES[entityName];
    downloadFile(file, content);
    toast.success(`${entityName} sample downloaded`);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const records = parseCsv(text);
      if (!records || !Array.isArray(records) || records.length === 0) {
        throw new Error("No valid records found in file");
      }
      const cleaned = records.map(({ id, created_date, updated_date, created_by_id, created_by, is_sample, ...rest }) => rest);
      const created = await base44.entities[importEntity].bulkCreate(cleaned);
      setImportResult({ success: created.length, total: cleaned.length });
      toast.success(`Imported ${created.length} records`);
    } catch (e) {
      setImportResult({ error: e.message });
      toast.error("Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold">Export (CSV)</h2>
        </div>
        <p className="text-sm text-muted-foreground">Download individual collections as CSV files. Use "Export All" for lines, reels, and rods together, or grab a sample template to see the expected format.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExportAll} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export All
          </Button>
          {ENTITIES.map((ent) => (
            <Button key={ent.name} variant="outline" onClick={() => handleExportSingle(ent.name)}>
              <FileJson className="w-4 h-4" />
              {ent.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Import */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold">Import (CSV)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a previously exported CSV file. Records will be added to the selected collection. Not sure of the format? Download a sample template below.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={importEntity}
            onChange={(e) => setImportEntity(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ENTITIES.map((ent) => (
              <option key={ent.name} value={ent.name}>{ent.label}</option>
            ))}
          </select>
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Choose File
            </span>
          </label>
          <Button variant="outline" onClick={() => handleDownloadSample("FlyLine")}>
            <FileJson className="w-4 h-4" />
            Sample Lines
          </Button>
          <Button variant="outline" onClick={() => handleDownloadSample("Reel")}>
            <FileJson className="w-4 h-4" />
            Sample Reels
          </Button>
          <Button variant="outline" onClick={() => handleDownloadSample("Rod")}>
            <FileJson className="w-4 h-4" />
            Sample Rods
          </Button>
        </div>
        {importResult?.success != null && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Imported {importResult.success} of {importResult.total} records.
          </div>
        )}
        {importResult?.error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {importResult.error}
          </div>
        )}
      </div>

      {/* Full Backup / Restore */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold">Full Backup</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your data is always safe: Everything is stored securely in the cloud database tied to your account, not just on your device. If you lose your phone, simply sign in on any new device and all your gear, catches, and photos reappear automatically.
        </p>
        <p className="text-sm text-muted-foreground">
          But if you want complete control, you can also download a single backup file containing all your data — lines, reels, rods, catches, lures, and misc gear — with all photos embedded. Use 'Restore from Backup' to bring everything back, photos included putting you in complete control.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleBackup} disabled={backing}>
            {backing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Create Backup
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} disabled={restoring} />
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
              {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Restore from Backup
            </span>
          </label>
        </div>
        {backing && backupProgress && backupProgress.total > 0 && (
          <p className="text-sm text-muted-foreground">
            Embedding photos… {backupProgress.done} / {backupProgress.total}
          </p>
        )}
        {restoring && restoreProgress && (
          <p className="text-sm text-muted-foreground">
            Restoring {restoreProgress.entity}{restoreProgress.total > 0 ? ` — re-uploading photos ${restoreProgress.done} / ${restoreProgress.total}` : ""}…
          </p>
        )}
        {restoreResult?.summary && (
          <div className="space-y-1 text-sm text-green-600">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Restore complete
            </div>
            <ul className="ml-6 list-disc">
              {restoreResult.summary.map((s, i) => <li key={i}>{s} records imported</li>)}
            </ul>
          </div>
        )}
        {restoreResult?.error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {restoreResult.error}
          </div>
        )}
      </div>
    </div>
  );
}