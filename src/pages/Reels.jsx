import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, RotateCw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import ReelForm from "@/components/reels/ReelForm";
import ReelDetailDialog from "@/components/reels/ReelDetailDialog";
import ViewToggle from "@/components/ViewToggle";
import GearThumbnail from "@/components/GearThumbnail";
import { useViewMode } from "@/hooks/useViewMode";
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

export default function Reels() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("species");
  const [sortDir, setSortDir] = useState("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewMode, setViewMode] = useViewMode();

  const load = async () => {
    setLoading(true);
    try {
      const [r, l] = await Promise.all([
        base44.entities.Reel.list("-updated_date", 200),
        base44.entities.FlyLine.list("-updated_date", 200),
      ]);
      setReels(r);
      setLines(l);
    } catch (e) {
      toast.error("Failed to load reels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Prefill from the "Scan Gear" AI camera flow.
  useEffect(() => {
    if (location.state?.prefill) {
      setEditing(null);
      setPrefill(location.state.prefill);
      setFormOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const linesByReel = useMemo(() => {
    const map = {};
    lines.forEach((l) => {
      if (l.reel) {
        map[l.reel] = (map[l.reel] || 0) + 1;
      }
    });
    return map;
  }, [lines]);

  const spooledLinesByReel = useMemo(() => {
    const map = {};
    lines.forEach((l) => {
      if (l.reel) {
        if (!map[l.reel]) map[l.reel] = [];
        map[l.reel].push(l);
      }
    });
    return map;
  }, [lines]);

  const totalValue = useMemo(() =>
    reels.reduce((sum, r) => sum + (r.value || 0), 0), [reels]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = reels.filter((r) =>
      !q || [r.name, r.species, r.brand, r.model, r.size].some((v) => v && v.toLowerCase().includes(q))
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [reels, search, sortBy, sortDir]);

  const handleSave = async (payload) => {
    setSaving(true);
    setFormOpen(false);
    const wasEditing = editing;
    setEditing(null);
    try {
      if (wasEditing) {
        setReels(prev => prev.map(r => r.id === wasEditing.id ? { ...r, ...payload } : r));
        await base44.entities.Reel.update(wasEditing.id, payload);
        toast.success("Reel updated");
      } else {
        const tempId = `temp_${Date.now()}`;
        setReels(prev => [{ ...payload, id: tempId }, ...prev]);
        const created = await base44.entities.Reel.create(payload);
        setReels(prev => prev.map(r => r.id === tempId ? created : r));
        toast.success("Reel added");
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
    setReels(prev => prev.filter(r => r.id !== target.id));
    try {
      await base44.entities.Reel.delete(target.id);
      toast.success("Reel deleted");
    } catch (e) {
      toast.error("Failed to delete");
      setReels(prev => [...prev, target]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            Reels
          </h1>
          <p className="text-muted-foreground text-sm">Track your reels and see which ones are in use along with the lines spooled on each.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {reels.length} reels in your collection
            {totalValue > 0 && <span className="font-medium text-foreground"> · Total value of reels ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setPrefill(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Reel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search reels..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-0 shadow-sm" />
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <RotateCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No reels found. Add your first one!</p>
        </div>
      ) : viewMode === "thumbnail" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((reel) => (
            <GearThumbnail
              key={reel.id}
              item={reel}
              title={[reel.brand, reel.model].filter(Boolean).join(" ") || reel.name}
              subtitle={reel.type}
              details={[reel.size, reel.value != null && `$${reel.value}`]}
              onClick={() => setViewTarget(reel)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b">
                <SortHeader label="Species" field="species" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Brand" field="brand" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Model" field="model" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Size" field="size" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground px-3 py-3 whitespace-nowrap">Lines</th>
                <SortHeader label="Condition" field="condition" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Value" field="value" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((reel) => (
                <tr key={reel.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setViewTarget(reel)}>
                  <td className="px-3 py-2.5">{reel.species}</td>
                  <td className="px-3 py-2.5 font-medium">{reel.name}</td>
                  <td className="px-3 py-2.5">{reel.brand}</td>
                  <td className="px-3 py-2.5">{reel.model}</td>
                  <td className="px-3 py-2.5">{reel.size}</td>
                  <td className="px-3 py-2.5">{reel.type}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{linesByReel[reel.name] || 0}</td>
                  <td className="px-3 py-2.5">
                    {reel.condition && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${conditionColor[reel.condition] || ""}`}>
                        {reel.condition}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{reel.value != null ? `$${reel.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReelDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        reel={viewTarget}
        lineCount={viewTarget ? linesByReel[viewTarget.name] || 0 : 0}
        spooledLines={viewTarget ? spooledLinesByReel[viewTarget.name] || [] : []}
        onEdit={(r) => { setViewTarget(null); setEditing(r); setPrefill(null); setFormOpen(true); }}
        onDelete={(r) => { setViewTarget(null); setDeleteTarget(r); }}
      />

      <ReelForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSave} initial={editing || prefill} loading={saving} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reel?</AlertDialogTitle>
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
      className="text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground px-3 py-3 whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
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