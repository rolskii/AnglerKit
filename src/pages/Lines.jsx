import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2, Waves } from "lucide-react";
import LineCard from "@/components/lines/LineCard";
import LineForm from "@/components/lines/LineForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Lines() {
  const [lines, setLines] = useState([]);
  const [reels, setReels] = useState([]);
  const [rods, setRods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    return lines.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        [l.brand, l.model, l.type, l.colour, l.reel, l.rod, l.description].some(
          (v) => v && v.toLowerCase().includes(q)
        );
      const matchesSpecies = speciesFilter === "all" || l.species === speciesFilter;
      return matchesSearch && matchesSpecies;
    });
  }, [lines, search, speciesFilter]);

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
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Waves className="w-6 h-6 text-primary" /> Fly Lines
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
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="All species" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {["Trout", "Salmon", "Steelhead", "Bass", "Pike", "Saltwater", "Other"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No lines found. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((line) => (
            <LineCard key={line.id} line={line} onEdit={(l) => { setEditing(l); setFormOpen(true); }} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

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