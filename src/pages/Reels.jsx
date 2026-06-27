import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, RotateCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReelForm from "@/components/reels/ReelForm";
import ReelDetailDialog from "@/components/reels/ReelDetailDialog";
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
  const [reels, setReels] = useState([]);
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

  const parseSize = (s) => {
    if (!s) return null;
    const tokens = String(s).trim().split(/\s+/);
    let total = 0;
    let hasNum = false;
    for (const t of tokens) {
      const m = t.match(/^(\d+)\/(\d+)$/);
      if (m) {
        total += parseInt(m[1], 10) / parseInt(m[2], 10);
        hasNum = true;
      } else {
        const n = parseFloat(t);
        if (!isNaN(n)) {
          total += n;
          hasNum = true;
        }
      }
    }
    return hasNum ? total : null;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = reels.filter((r) =>
      !q || [r.name, r.brand, r.model, r.size].some((v) => v && v.toLowerCase().includes(q))
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (sortBy === "size") {
        const na = parseSize(av);
        const nb = parseSize(bv);
        if (na == null && nb == null) return 0;
        if (na == null) return 1;
        if (nb == null) return -1;
        return (na - nb) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [reels, search, sortBy, sortDir]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Reel.update(editing.id, payload);
        toast.success("Reel updated");
      } else {
        await base44.entities.Reel.create(payload);
        toast.success("Reel added");
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
      await base44.entities.Reel.delete(deleteTarget.id);
      toast.success("Reel deleted");
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
            <RotateCw className="w-6 h-6 text-primary" /> Reels
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{reels.length} reels in your collection</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Reel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search reels..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="model">Model</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="condition">Condition</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          title={sortDir === "asc" ? "Ascending" : "Descending"}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <RotateCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No reels found. Add your first one!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Name</th>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Brand</th>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Model</th>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Size</th>
                <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">Condition</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reel) => (
                <tr key={reel.id} onClick={() => setViewTarget(reel)} className="border-t border-border cursor-pointer hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium">{reel.name || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{reel.brand || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{reel.model || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{reel.size || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {reel.condition ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[reel.condition] || "bg-muted text-muted-foreground"}`}>
                        {reel.condition}
                      </span>
                    ) : "—"}
                  </td>
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
        onEdit={(r) => { setViewTarget(null); setEditing(r); setFormOpen(true); }}
        onDelete={(r) => { setViewTarget(null); setDeleteTarget(r); }}
      />

      <ReelForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSave} initial={editing} loading={saving} />

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