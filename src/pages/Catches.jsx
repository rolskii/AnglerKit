import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Fish, ArrowUp, ArrowDown, ArrowUpDown, NotebookPen } from "lucide-react";
import CatchDetailDialog from "@/components/catches/CatchDetailDialog";
import CatchForm from "@/components/catches/CatchForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Catches() {
  const [catches, setCatches] = useState([]);
  const [rods, setRods] = useState([]);
  const [reels, setReels] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, r, re, ln] = await Promise.all([
        base44.entities.Catch.list("-updated_date", 200).catch(() => []),
        base44.entities.Rod.list("-updated_date", 200).catch(() => []),
        base44.entities.Reel.list("-updated_date", 200).catch(() => []),
        base44.entities.FlyLine.list("-updated_date", 200).catch(() => []),
      ]);
      setCatches(c);
      setRods(r);
      setReels(re);
      setLines(ln);
    } catch (e) {
      toast.error("Failed to load catches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const result = catches.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        [c.species, c.location, c.fly_used, c.rod, c.reel, c.line, c.conditions, c.notes].some(
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
  }, [catches, search, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Catch.update(editing.id, payload);
        toast.success("Catch updated");
      } else {
        await base44.entities.Catch.create(payload);
        toast.success("Catch logged");
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Catch.delete(deleteTarget.id);
      toast.success("Catch deleted");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <NotebookPen className="w-6 h-6 text-primary" />
            Fish Log
          </h1>
          <p className="text-muted-foreground text-sm">Log in your catches with measurements, photos and gear used.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {catches.length} {catches.length === 1 ? "catch" : "catches"} logged
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Log a Catch
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search species, location, fly..."
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
          <Fish className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No catches logged yet. Log your first one!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <SortHeader label="Species" field="species" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Date" field="date" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Body of Water</th>
                <SortHeader label="Length" field="length" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Girth" field="girth" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Weight" field="weight" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Fly</th>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Released</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setViewTarget(c)}
                  className="border-t border-border cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">{c.species || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.date ? new Date(c.date + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c.location || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c.length != null ? `${c.length} in` : "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c.girth != null ? `${c.girth} in` : "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c.weight != null ? `${c.weight} lb` : "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c.fly_used || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c.released ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CatchDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        catchItem={viewTarget}
        onEdit={(c) => { setViewTarget(null); setEditing(c); setFormOpen(true); }}
        onDelete={(c) => { setViewTarget(null); setDeleteTarget(c); }}
      />

      <CatchForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSave}
        initial={editing}
        rods={rods}
        reels={reels}
        lines={lines}
        loading={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this catch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {deleteTarget?.species || ""} catch from your log.
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