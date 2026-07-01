import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import CatchCard from "@/components/catches/CatchCard";
import CatchForm from "@/components/catches/CatchForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function CatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [catchItem, setCatchItem] = useState(null);
  const [rods, setRods] = useState([]);
  const [reels, setReels] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [c, r, re, ln] = await Promise.all([
          base44.entities.Catch.get(id).catch(() => null),
          base44.entities.Rod.list("-updated_date", 200).catch(() => []),
          base44.entities.Reel.list("-updated_date", 200).catch(() => []),
          base44.entities.FlyLine.list("-updated_date", 200).catch(() => []),
        ]);
        setCatchItem(c);
        setRods(r);
        setReels(re);
        setLines(ln);
      } catch (e) {
        toast.error("Failed to load catch");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      await base44.entities.Catch.update(editing.id, payload);
      toast.success("Catch updated");
      setFormOpen(false);
      setEditing(null);
      const updated = await base44.entities.Catch.get(id);
      setCatchItem(updated);
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Catch.delete(deleteTarget.id);
      toast.success("Catch deleted");
      navigate("/catches");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!catchItem) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Catch not found.</p>
        <Button variant="outline" onClick={() => navigate("/catches")}>Back to Fish Log</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/catches")} className="flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <CatchCard
        catchItem={catchItem}
        onEdit={(c) => { setEditing(c); setFormOpen(true); }}
        onDelete={(c) => setDeleteTarget(c)}
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