import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, RotateCw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LureForm from "@/components/lures/LureForm";
import LureDetailDialog from "@/components/lures/LureDetailDialog";
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
  const [lures, setLures] = useState([]);
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
      const l = await base44.entities.Lure.list("-updated_date", 200);
      setLures(l);
    } catch (e) {
      toast.error("Failed to load lures & flies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Lure / Fly
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search lures & flies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <RotateCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No lures or flies found. Add your first one!</p>
        </div>
      ) : (
        <>
        <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <SortHeader label="Type" field="type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
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
                <tr key={lure.id} onClick={() => setViewTarget(lure)} className="border-t border-border cursor-pointer hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap">{lure.type || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">{lure.name || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{lure.category || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{lure.brand || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{lure.size || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{lure.quantity != null ? lure.quantity : "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {lure.condition ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[lure.condition] || "bg-muted text-muted-foreground"}`}>
                        {lure.condition}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{lure.value != null ? `$${lure.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden grid grid-cols-1 gap-3">
          {filtered.map((lure) => (
            <div key={lure.id} onClick={() => setViewTarget(lure)} className="p-3 rounded-xl border border-border/60 bg-card cursor-pointer active:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{lure.name || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lure.type || "—"} · {lure.category || "—"}</p>
                </div>
                {lure.value != null && <p className="text-sm font-medium whitespace-nowrap">${lure.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                {lure.brand && <span className="px-2 py-0.5 rounded-full bg-muted">{lure.brand}</span>}
                {lure.size && <span className="px-2 py-0.5 rounded-full bg-muted">{lure.size}</span>}
                {lure.quantity != null && <span className="px-2 py-0.5 rounded-full bg-muted">Qty: {lure.quantity}</span>}
                {lure.condition && <span className={`px-2 py-0.5 rounded-full font-medium ${conditionColor[lure.condition] || "bg-muted text-muted-foreground"}`}>{lure.condition}</span>}
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <LureDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        lure={viewTarget}
        onEdit={(l) => { setViewTarget(null); setEditing(l); setFormOpen(true); }}
        onDelete={(l) => { setViewTarget(null); setDeleteTarget(l); }}
      />

      <LureForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSave} initial={editing} loading={saving} />

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