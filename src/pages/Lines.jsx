import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Waves, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LineCard from "@/components/lines/LineCard";
import LineDetailDialog from "@/components/lines/LineDetailDialog";
import LineForm from "@/components/lines/LineForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { triggerAutosave } from "@/lib/cloudAutosave";

export default function Lines() {
  const [lines, setLines] = useState([]);
  const [reels, setReels] = useState([]);
  const [rods, setRods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("species");
  const [sortDir, setSortDir] = useState("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [l, r, rd] = await Promise.all([
        base44.entities.FlyLine.list("-updated_date", 200),
        base44.entities.Reel.list("-updated_date", 200),
        base44.entities.Rod.list("-updated_date", 200),
      ]);
      setLines(l);
      setReels(r);
      setRods(rd);
    } catch (e) {
      toast.error("Failed to load lines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const result = lines.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        [l.species, l.brand, l.model, l.type, l.colour, l.reel, l.rod, l.description].some(
          (v) => v && v.toLowerCase().includes(q)
        );
      return matchesSearch;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [lines, search, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.FlyLine.update(editing.id, payload);
        toast.success("Line updated");
      } else {
        await base44.entities.FlyLine.create(payload);
        toast.success("Line added");
      }
      setFormOpen(false);
      setEditing(null);
      await load();
      triggerAutosave();
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.FlyLine.delete(deleteTarget.id);
      toast.success("Line deleted");
      setDeleteTarget(null);
      await load();
      triggerAutosave();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            Fly Lines
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{lines.length} lines in your collection</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Line
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search brand, model, colour..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No lines found. Add your first one!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <SortHeader label="Species" field="species" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Brand" field="brand" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Model" field="model" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Line Wt" field="line_weight" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Grain Wt" field="grain_weight" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Colour</th>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Condition</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((line) => (
                <tr
                  key={line.id}
                  onClick={() => setViewTarget(line)}
                  className="border-t border-border cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.species || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">{line.brand || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.model || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.type || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.line_weight || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.grain_weight || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.colour || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.condition || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LineDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        line={viewTarget}
        onEdit={(l) => { setViewTarget(null); setEditing(l); setFormOpen(true); }}
        onDelete={(l) => { setViewTarget(null); setDeleteTarget(l); }}
      />

      <LineForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSave}
        initial={editing}
        reels={reels}
        rods={rods}
        loading={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this line?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.brand} {deleteTarget?.model}" from your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortHeader({ label, field, sortBy, sortDir, onSort }) {
  const active = sortBy === field;
  return (
    <th
      className="text-left font-medium px-3 py-2.5 whitespace-nowrap cursor-pointer select-none hover:text-foreground"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
        )}
      </span>
    </th>
  );
}