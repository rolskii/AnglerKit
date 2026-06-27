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

Each row is one item in your inventory. Use the "Type" column to
say whether the row is a Line, Reel, or Rod. Fill in the columns
that apply to that item; leave the rest blank. Save as a .csv file
(or .txt with comma-separated values) and import it.

Type,Name,Brand,Model,Species,Line Wt,Grain Wt,Head Length,Total Length,Length,Type/Style,Material,Size,Colour,Condition,Reel,Rod,Description,Notes
Line,,Scientific Anglers,Mastery Trout,Trout,5,140,40,90,,WF,,,,Olive,New,,,Floating,
Line,,RIO,Outbound Short,Steelhead,8,300,30,100,,Sinking,,,,Blue,Good,Lamson Liquid,,Sink tip,
Reel,Lamson Liquid,Lamson,Liquid 3,,,,,,,,,,,,3+,,New,,,,,
Reel,Hatch Finatic,Hatch,Finatic 5,,,,,,,,,,,,5+,,Like New,,,,,Backup reel
Rod,Orvis Clearwater 9' 5wt,Orvis,,,,,,,9 ft,5,Single Hand,Carbon,,,,New,,,,
Rod,Sage X 10' 7wt,Sage,,,,,,,10 ft,7,Single Hand,Carbon,,,,Good,,,,Great dry fly rod
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flyfish-sample-import.csv";
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