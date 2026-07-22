import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, RotateCw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import MiscForm from "@/components/misc/MiscForm";
import MiscDetailDialog from "@/components/misc/MiscDetailDialog";
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

export default function Misc() {
  const [items, setItems] = useState([]);
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
      const l = await base44.entities.MiscItem.list("-updated_date", 200);
      setItems(l);
    } catch (e) {
      toast.error("Failed to load misc. items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalValue = useMemo(() =>
    items.reduce((sum, i) => sum + (i.value || 0), 0), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = items.filter((i) =>
      !q || [i.name, i.category, i.brand, i.model, i.colour].some((v) => v && v.toLowerCase().includes(q))
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
  }, [items, search, sortBy, sortDir]);

  const handleSave = async (payload) => {
    setSaving(true);
    setFormOpen(false);
    const wasEditing = editing;
    setEditing(null);
    try {
      if (wasEditing) {
        setItems(prev => prev.map(i => i.id === wasEditing.id ? { ...i, ...payload } : i));
        await base44.entities.MiscItem.update(wasEditing.id, payload);
        toast.success("Misc. item updated");
      } else {
        const tempId = `temp_${Date.now()}`;
        setItems(prev => [{ ...payload, id: tempId }, ...prev]);
        const created = await base44.entities.MiscItem.create(payload);
        setItems(prev => prev.map(i => i.id === tempId ? created : i));
        toast.success("Misc. item added");
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
    setItems(prev => prev.filter(i => i.id !== target.id));
    try {
      await base44.entities.MiscItem.delete(target.id);
      toast.success("Misc. item deleted");
    } catch (e) {
      toast.error("Failed to delete");
      setItems(prev => [...prev, target]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            Other Fishing Related Gear
          </h1>
          <p className="text-muted-foreground text-sm">Track other fishing gear - apparel, tools and accessories.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} misc. items in your collection
            <span className="font-medium text-foreground"> · Total value of your miscellaneous gear ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Misc. Item
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search misc. items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <RotateCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No misc. items found. Add your first one!</p>
        </div>
      ) : (
        <>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Category" field="category" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Brand" field="brand" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Model" field="model" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Colour" field="colour" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Qty" field="quantity" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Condition" field="condition" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Value" field="value" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setViewTarget(item)}>
                  <td className="px-3 py-2.5 font-medium">{item.name}</td>
                  <td className="px-3 py-2.5">{item.category}</td>
                  <td className="px-3 py-2.5">{item.brand}</td>
                  <td className="px-3 py-2.5">{item.model}</td>
                  <td className="px-3 py-2.5">{item.colour}</td>
                  <td className="px-3 py-2.5">{item.quantity}</td>
                  <td className="px-3 py-2.5">
                    {item.condition && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${conditionColor[item.condition] || ""}`}>
                        {item.condition}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{item.value != null ? `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <MiscDetailDialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
        item={viewTarget}
        onEdit={(i) => { setViewTarget(null); setEditing(i); setFormOpen(true); }}
        onDelete={(i) => { setViewTarget(null); setDeleteTarget(i); }}
      />

      <MiscForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSave} initial={editing} loading={saving} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this misc. item?</AlertDialogTitle>
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