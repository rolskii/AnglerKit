import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Fish, ArrowUp, ArrowDown, Camera } from "lucide-react";
import CatchCard from "@/components/catches/CatchCard";
import CatchDetailDialog from "@/components/catches/CatchDetailDialog";
import CatchForm from "@/components/catches/CatchForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";


export default function Catches() {
  const navigate = useNavigate();
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

  const handleSave = async (payload) => {
    setSaving(true);
    setFormOpen(false);
    const wasEditing = editing;
    setEditing(null);
    try {
      if (wasEditing) {
        setCatches(prev => prev.map(c => c.id === wasEditing.id ? { ...c, ...payload } : c));
        await base44.entities.Catch.update(wasEditing.id, payload);
        toast.success("Catch updated");
      } else {
        const tempId = `temp_${Date.now()}`;
        setCatches(prev => [{ ...payload, id: tempId }, ...prev]);
        const created = await base44.entities.Catch.create(payload);
        setCatches(prev => prev.map(c => c.id === tempId ? created : c));
        toast.success("Catch logged");
      }
    } catch (e) {
      toast.error(e.message || "Failed to save");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    setCatches(prev => prev.filter(c => c.id !== target.id));
    try {
      await base44.entities.Catch.delete(target.id);
      toast.success("Catch deleted");
    } catch (e) {
      toast.error("Failed to delete");
      setCatches(prev => [...prev, target]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
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
        <>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "catch" : "catches"}</p>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="date">Sort: Date</option>
              <option value="species">Sort: Species</option>
              <option value="weight">Sort: Weight</option>
              <option value="length">Sort: Length</option>
              <option value="location">Sort: Location</option>
            </select>
            <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
              {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CatchCard key={c.id} catchItem={c} onView={(item) => setViewTarget(item)} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={(item) => setDeleteTarget(item)} />
          ))}
        </div>
        </>
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