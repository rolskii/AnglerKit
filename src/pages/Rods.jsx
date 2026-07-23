import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Waves, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import RodForm from "@/components/rods/RodForm";
import RodDetailDialog from "@/components/rods/RodDetailDialog";
import ViewToggle from "@/components/ViewToggle";
import GearThumbnail from "@/components/GearThumbnail";
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
  const [sortBy, setSortBy] = useState("species");
  const [sortDir, setSortDir] = useState("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewMode, setViewMode] = useState("list");

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

  const totalValue = useMemo(() =>
    rods.reduce((sum, r) => sum + (r.value || 0), 0), [rods]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = rods.filter((r) =>
      !q || [r.name, r.species, r.brand, r.length, r.line_weight, r.type, r.material].some((v) => v && v.toLowerCase().includes(q))
    );
    const dir = sortDir === "asc" ? 1 : -1;
    const toNumber = (v) => {
      if (v == null || v === "") return null;
      const parts = String(v).split("/").map((p) => parseFloat(p.replace(/[^\d.-]/g, ""))).filter((n) => !isNaN(n));
      if (parts.length === 0) return null;
      return parts.reduce((a, b) => a + b, 0) / parts.length;
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
    setFormOpen(false);
    const wasEditing = editing;
    setEditing(null);
    try {
      if (wasEditing) {
        setRods(prev => prev.map(r => r.id === wasEditing.id ? { ...r, ...payload } : r));
        await base44.entities.Rod.update(wasEditing.id, payload);
        toast.success("Rod updated");
      } else {
        const tempId = `temp_${Date.now()}`;
        setRods(prev => [{ ...payload, id: tempId }, ...prev]);
        const created = await base44.entities.Rod.create(payload);
        setRods(prev => prev.map(r => r.id === tempId ? created : r));
        toast.success("Rod added");
      }
    } catch (e) {
      toast.error(e.message || "Failed to save");
      await load();
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
    const target = deleteTarget;
    setDeleteTarget(null);
    setRods(prev => prev.filter(r => r.id !== target.id));
    try {
      await base44.entities.Rod.delete(target.id);
      toast.success("Rod deleted");
    } catch (e) {
      toast.error("Failed to delete");
      setRods(prev => [...prev, target]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            Rods
          </h1>
          <p className="text-muted-foreground text-sm">Catalog your rods and view their paired lines.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {rods.length} rods in your collection
            {totalValue > 0 && <span className="font-medium text-foreground"> · Total value of rods ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Rod
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rods..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No rods found. Add your first one!</p>
        </div>
      ) : viewMode === "thumbnail" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((rod) => (
            <GearThumbnail
              key={rod.id}
              item={rod}
              title={[rod.brand, rod.model].filter(Boolean).join(" ") || rod.name}
              subtitle={rod.type}
              details={[rod.length, rod.line_weight && `${rod.line_weight} wt`, rod.value != null && `$${rod.value}`]}
              onClick={() => setViewTarget(rod)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <SortHeader label="Species" field="species" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Brand" field="brand" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Length" field="length" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Line Wt" field="line_weight" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Material" field="material" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Lines</th>
                <SortHeader label="Condition" field="condition" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Value" field="value" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((rod) => (
                <tr key={rod.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setViewTarget(rod)}>
                  <td className="px-3 py-2.5">{rod.species}</td>
                  <td className="px-3 py-2.5 font-medium">{rod.name}</td>
                  <td className="px-3 py-2.5">{rod.brand}</td>
                  <td className="px-3 py-2.5">{rod.length}</td>
                  <td className="px-3 py-2.5">{rod.line_weight}</td>
                  <td className="px-3 py-2.5">{rod.type}</td>
                  <td className="px-3 py-2.5">{rod.material}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{linesByRod[rod.name] || 0}</td>
                  <td className="px-3 py-2.5">
                    {rod.condition && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${conditionColor[rod.condition] || ""}`}>
                        {rod.condition}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{rod.value != null ? `$${rod.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
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