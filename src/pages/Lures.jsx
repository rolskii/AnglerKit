import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, RotateCw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LureForm from "@/components/lures/LureForm";
import LureDetailDialog from "@/components/lures/LureDetailDialog";
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

export default function Lures() {
  const location = useLocation();
  const navigate = useNavigate();
  const [lures, setLures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
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
      const l = await base44.entities.Lure.list("-updated_date", 200);
      setLures(l);
    } catch (e) {
      toast.error("Failed to load lures & flies");
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

  const totalValue = useMemo(() =>
    lures.reduce((sum, l) => sum + (l.value || 0), 0), [lures]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = lures.filter((l) =>
      !q || [l.name, l.type, l.category, l.brand, l.size, l.colour].some((v) => v && v.toLowerCase().includes(q))
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
  }, [lures, search, sortBy, sortDir]);

  const handleSave = async (payload) => {
    setSaving(true);
    setFormOpen(false);
    const wasEditing = editing;
    setEditing(null);
    try {
      if (wasEditing) {
        setLures(prev => prev.map(l => l.id === wasEditing.id ? { ...l, ...payload } : l));
        await base44.entities.Lure.update(wasEditing.id, payload);
        toast.success("Lure / fly updated");
      } else {
        const tempId = `temp_${Date.now()}`;
        setLures(prev => [{ ...payload, id: tempId }, ...prev]);
        const created = await base44.entities.Lure.create(payload);
        setLures(prev => prev.map(l => l.id === tempId ? created : l));
        toast.success("Lure / fly added");
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
    setLures(prev => prev.filter(l => l.id !== target.id));
    try {
      await base44.entities.Lure.delete(target.id);
      toast.success("Lure / fly deleted");
    } catch (e) {
      toast.error("Failed to delete");
      setLures(prev => [...prev, target]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            Lures & Flies
          </h1>
          <p className="text-muted-foreground text-sm">Catalog your lures, tackle and flies with photos, sizes and quantities.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {lures.length} lures & flies in your collection
            <span className="font-medium text-foreground"> · Total value ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setPrefill(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Lure / Fly
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search lures & flies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <RotateCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No lures or flies found. Add your first one!</p>
        </div>
      ) : viewMode === "thumbnail" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((lure) => (
            <GearThumbnail
              key={lure.id}
              item={lure}
              title={[lure.brand, lure.model].filter(Boolean).join(" ") || lure.name}
              subtitle={lure.category}
              details={[lure.size, lure.quantity > 1 && `×${lure.quantity}`, lure.value != null && `$${lure.value}`]}
              onClick={() => setViewTarget(lure)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Category" field="category" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Brand" field="brand" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Size" field="size" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Qty" field="quantity" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Condition" field="condition" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Value" field="value" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lure) => (
                <tr key={lure.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setViewTarget(lure)}>
                  <td className="px-3 py-2.5 font-medium">{lure.name}</td>
                  <td className="px-3 py-2.5">{lure.type}</td>
                  <td className="px-3 py-2.5">{lure.category}</td>
                  <td className="px-3 py-2.5">{lure.brand}</td>
                  <td className="px-3 py-2.5">{lure.size}</td>
                  <td className="px-3 py-2.5">{lure.quantity}</td>
                  <td className="px-3 py-2.5">
                    {lure.condition && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${conditionColor[lure.condition] || ""}`}>
                        {lure.condition}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{lure.value != null ? `$${lure.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LureDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        lure={viewTarget}
        onEdit={(l) => { setViewTarget(null); setEditing(l); setPrefill(null); setFormOpen(true); }}
        onDelete={(l) => { setViewTarget(null); setDeleteTarget(l); }}
      />

      <LureForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSave} initial={editing || prefill} loading={saving} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lure / fly?</AlertDialogTitle>
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