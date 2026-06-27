import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2, Fish, Pencil, Trash2 } from "lucide-react";
import RodForm from "@/components/rods/RodForm";
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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rods.filter((r) =>
      !q || [r.name, r.brand, r.length, r.line_weight, r.type, r.material].some((v) => v && v.toLowerCase().includes(q))
    );
  }, [rods, search]);

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
          <Fish className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No rods found. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rod) => (
            <Card key={rod.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-semibold">{rod.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[rod.brand, rod.length, rod.line_weight ? `${rod.line_weight}wt` : null].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {rod.condition && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[rod.condition] || "bg-muted text-muted-foreground"}`}>
                    {rod.condition}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {rod.type && <Badge variant="secondary" className="text-xs">{rod.type}</Badge>}
                {rod.material && <Badge variant="outline" className="text-xs">{rod.material}</Badge>}
                <Badge variant="secondary" className="text-xs">
                  {linesByRod[rod.name] || 0} line{(linesByRod[rod.name] || 0) !== 1 ? "s" : ""}
                </Badge>
              </div>
              {rod.notes && <p className="text-xs text-muted-foreground italic">{rod.notes}</p>}
              <div className="flex gap-2 mt-auto pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(rod); setFormOpen(true); }}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(rod)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

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