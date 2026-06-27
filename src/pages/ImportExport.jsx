import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, FileJson, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ENTITIES = [
  { name: "FlyLine", label: "Lines" },
  { name: "Reel", label: "Reels" },
  { name: "Rod", label: "Rods" },
];

export default function ImportExport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importEntity, setImportEntity] = useState("FlyLine");
  const [importResult, setImportResult] = useState(null);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const [lines, reels, rods] = await Promise.all([
        base44.entities.FlyLine.list("-updated_date", 500),
        base44.entities.Reel.list("-updated_date", 500),
        base44.entities.Rod.list("-updated_date", 500),
      ]);
      const data = {
        exported_at: new Date().toISOString(),
        FlyLine: lines,
        Reel: reels,
        Rod: rods,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flyfish-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
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
      const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityName}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${entityName} exported`);
    } catch (e) {
      toast.error(`Export failed for ${entityName}`);
    }
  };

  const handleDownloadSample = () => {
    const content = `Fly Fish Inventory - Sample Import File
=========================================

This file shows the format to use when importing your fly fishing
inventory. Each section below lists the fields for one collection
(Lines, Reels, Rods) with an example value for each field.

To import, create a JSON file with one section per collection you
want to import. Each section is a list of records. Only the fields
you want to fill in are required; leave others empty ("").

------------------------------------------------------------
FLY LINES  (collection key: "FlyLine")
------------------------------------------------------------
species        Example: Trout
brand          Example: Scientific Anglers        (required)
model          Example: Mastery Trout             (required)
type           Example: WF
description    Example: Floating
line_weight    Example: 5
grain_weight   Example: 140          (number)
head_length    Example: 40           (number)
total_length   Example: 90           (number)
colour         Example: Olive
condition      Example: New
reel           Example: Lamson Liquid  (name of the reel it's spooled on)
rod            Example: Orvis Clearwater  (name of the rod it's paired with)
notes          Example: 

------------------------------------------------------------
REELS  (collection key: "Reel")
------------------------------------------------------------
name           Example: Lamson Liquid            (required)
brand          Example: Lamson
model          Example: Liquid 3
size           Example: 3+
condition      Example: New
notes          Example: 

------------------------------------------------------------
RODS  (collection key: "Rod")
------------------------------------------------------------
name           Example: Orvis Clearwater 9' 5wt   (required)
brand          Example: Orvis
length         Example: 9 ft
line_weight    Example: 5
type           Example: Single Hand
material       Example: Carbon
condition      Example: New
notes          Example: 

------------------------------------------------------------
EXAMPLE IMPORT FILE (copy this into a .json file to import)
------------------------------------------------------------
{
  "FlyLine": [
    {
      "species": "Trout",
      "brand": "Scientific Anglers",
      "model": "Mastery Trout",
      "type": "WF",
      "description": "Floating",
      "line_weight": "5",
      "grain_weight": 140,
      "head_length": 40,
      "total_length": 90,
      "colour": "Olive",
      "condition": "New",
      "reel": "",
      "rod": "",
      "notes": ""
    }
  ],
  "Reel": [
    {
      "name": "Lamson Liquid",
      "brand": "Lamson",
      "model": "Liquid 3",
      "size": "3+",
      "condition": "New",
      "notes": ""
    }
  ],
  "Rod": [
    {
      "name": "Orvis Clearwater 9' 5wt",
      "brand": "Orvis",
      "length": "9 ft",
      "line_weight": "5",
      "type": "Single Hand",
      "material": "Carbon",
      "condition": "New",
      "notes": ""
    }
  ]
}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flyfish-sample-import.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sample file downloaded");
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const records = Array.isArray(parsed) ? parsed : parsed[importEntity];
      if (!records || !Array.isArray(records)) {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Import / Export</h1>
        <p className="text-muted-foreground text-sm mt-1">Back up or restore your inventory data.</p>
      </div>

      {/* Export */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold">Export</h2>
        </div>
        <p className="text-sm text-muted-foreground">Download your data as a JSON file. Use "Export All" for a full backup, or grab a sample template to see the expected format.</p>
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
          <h2 className="text-lg font-heading font-semibold">Import</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a previously exported JSON file. Records will be added to the selected collection. Not sure of the format? Download a sample template below.
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
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Choose File
            </span>
          </label>
          <Button variant="outline" onClick={handleDownloadSample}>
            <FileJson className="w-4 h-4" />
            Download Sample
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
    </div>
  );
}