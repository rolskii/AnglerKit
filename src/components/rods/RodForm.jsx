import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormSelect from "@/components/ui/form-select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import RescanPhotosButton from "@/components/gear/RescanPhotosButton";
import { mergePrefill } from "@/lib/gearScan";

const SPECIES = ["Trout", "Salmon", "Steelhead", "Bass", "Pike", "Saltwater", "Gar", "Muskie", "Anything", "Other"].sort((a, b) => a.localeCompare(b));
const TYPES = ["Casting", "Fly", "Spinning", "Other"];
const MATERIALS = ["Carbon", "Cane", "Fiberglass", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const empty = { name: "", species: "Trout", brand: "", model: "", length: "", line_weight: "", type: "Fly", material: "Carbon", condition: "Good", value: "", date_acquired: "", serial_number: "", notes: "", images: [] };

export default function RodForm({ open, onOpenChange, onSubmit, initial, loading }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, value: form.value ? Number(form.value) : null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Rod" : "Add Rod"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              className="bg-muted"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder={`e.g. Milwards 9'4" Troutmaster Cane`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Species</Label>
              <FormSelect
                value={form.species}
                onChange={(v) => set("species", v)}
                options={SPECIES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input className="bg-muted" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input className="bg-muted" value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Length</Label>
              <Input className="bg-muted" value={form.length} onChange={(e) => set("length", e.target.value)} placeholder={`9'4"`} />
            </div>
            <div className="space-y-1.5">
              <Label>Line Weight</Label>
              <Input className="bg-muted" value={form.line_weight} onChange={(e) => set("line_weight", e.target.value)} placeholder="6" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <FormSelect
                value={form.type}
                onChange={(v) => set("type", v)}
                options={TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Material</Label>
              <FormSelect
                value={form.material}
                onChange={(v) => set("material", v)}
                options={MATERIALS.map((m) => ({ value: m, label: m }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <FormSelect
                value={form.condition}
                onChange={(v) => set("condition", v)}
                options={CONDITIONS.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Value ($)</Label>
              <Input className="bg-muted" type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Date Acquired</Label>
              <Input className="bg-muted text-left" type="date" value={form.date_acquired || ""} onChange={(e) => set("date_acquired", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Serial #</Label>
            <Input className="bg-muted" value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} placeholder="e.g. 1234567" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Photos</Label>
            {initial && (
              <RescanPhotosButton
                images={form.images || []}
                category="rod"
                onApply={(p) => setForm((f) => mergePrefill(f, p))}
              />
            )}
            <ImageUpload value={form.images || []} onChange={(v) => set("images", v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Save changes" : "Add rod"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}