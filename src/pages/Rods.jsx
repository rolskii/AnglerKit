import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Waves, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import RodForm from "@/components/rods/RodForm";
import RodDetailDialog from "@/components/rods/RodDetailDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const conditionColor = {
  "New": "bg-emerald-100 text-emerald-700",
  "Like New": "bg-emerald-100 text-emerald-700",
  "Good": "bg-blue-100 text-blue-700",
  "Fair": "bg-amber-100 text-amber-700",
  "Poor": "bg-rose-100 text-rose-700",
};

export default function Rods() {
  const [rods, setRods] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, l] = await Promise.all([
        base44.entities.Rod.list("-updated_date", 200),
        base44.entities.FlyLine.list("-updated_date", 200),
      ]);
      setRods(r);
      setLines(l);
    } catch (e) {
      toast.error("Failed to load rods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const linesByRod = useMemo(() => {
    const map = {};
    lines.forEach((l) => {
      if (l.rod) {
        map[l.rod] = (map[l.rod] || 0) + 1;
      }
    });
    return map;
  }, [lines]);

  const pairedLinesByRod = useMemo(() => {
    const map = {};
    lines.forEach((l) => {
      if (l.rod) {
        if (!map[l.rod]) map[l.rod] = [];
        map[l.rod].push(l);
      }
    });
    return map;
  }, [lines]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = rods.filter((r) =>
      !q || [r.name, r.brand, r.length, r.line_weight, r.type, r.material].some((v) => v && v.toLowerCase().includes(q))
    );
    const dir = sortDir === "asc" ? 1 : -1;
    const toNumber = (v) => {
      if (v == null || v === "") return null;
      const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
      return isNaN(n) ? null : n;
    };
    const lengthToInches = (v) => {
      if (!v) return null;
      const s = String(v).trim();
      const ft = s.match(/(\d+(?:\.\d+)?)\s*['′]/);
      const inch = s.match(/(\d+(?:\.\d+)?)\s*["″]/);
      let total = 0;
      let matched = false;
      if (ft) { total += parseFloat(ft[1]) * 12; matched = true; }
      if (inch) { total += parseFloat(inch[1]); matched = true; }
      if (!matched && !isNaN(parseFloat(s))) total = parseFloat(s) * 12;
      return matched ? total : null;
    };
    return result.sort((a, b) => {
      let av = a[sortBy];
      let bv = b[sortBy];
      if (sortBy === "length") {
        av = lengthToInches(av);
        bv = lengthToInches(bv);
      } else if (sortBy === "line_weight") {
        av = toNumber(av);
        bv = toNumber(bv);
      }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rods, search, sortBy, sortDir]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Rod.update(editing.id, payload);
        toast.success("Rod updated");
      } else {
        await base44.entities.Rod.create(payload);
        toast.success("Rod added");
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

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Rod.delete(deleteTarget.id);
      toast.success("Rod deleted");
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
            Fly Rods
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{rods.length} rods in your collection</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Rod
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search rods..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No rods found. Add your first one!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Brand" field="brand" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Length" field="length" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Line Wt" field="line_weight" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Material" field="material" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Condition" field="condition" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((rod) => (
                <tr key={rod.id} onClick={() => setViewTarget(rod)} className="border-t border-border cursor-pointer hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">{rod.name || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{rod.brand || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{rod.length || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{rod.line_weight || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{rod.type || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{rod.material || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {rod.condition ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[rod.condition] || "bg-muted text-muted-foreground"}`}>
                        {rod.condition}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RodDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        rod={viewTarget}
        lineCount={viewTarget ? linesByRod[viewTarget.name] || 0 : 0}
        pairedLines={viewTarget ? pairedLinesByRod[viewTarget.name] || [] : []}
        onEdit={(r) => { setViewTarget(null); setEditing(r); setFormOpen(true); }}
        onDelete={(r) => { setViewTarget(null); setDeleteTarget(r); }}
      />

      <RodForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSave} initial={editing} loading={saving} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rod?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.name}" from your collection.
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