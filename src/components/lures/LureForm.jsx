import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BottomSheetSelect from "@/components/ui/bottom-sheet-select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const TYPES = ["Fly", "Lure"];
const CATEGORIES = [
  "Dry Fly", "Nymph", "Streamer", "Wet Fly", "Emerger", "Terrestrial", "Popper",
  "Spinner", "Spoon", "Plug", "Jig", "Crankbait", "Soft Plastic", "Other"
];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const empty = {
  name: "", type: "Fly", category: "", brand: "", model: "", size: "", colour: "",
  quantity: 1, condition: "Good", value: "", date_acquired: "", notes: "", images: []
};

export default function LureForm({ open, onOpenChange, onSubmit, initial, loading }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantity: form.quantity ? Number(form.quantity) : null,
      value: form.value ? Number(form.value) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Lure / Fly" : "Add Lure / Fly"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input className="bg-muted" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Elk Hair Caddis" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <BottomSheetSelect
                value={form.type}
                onChange={(v) => set("type", v)}
                options={TYPES.map((t) => ({ value: t, label: t }))}
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <BottomSheetSelect
                value={form.category}
                onChange={(v) => set("category", v)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="Select category"
                className="bg-muted"
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
              <Label>Size</Label>
              <Input className="bg-muted" value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="#14" />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <Input className="bg-muted" value={form.colour} onChange={(e) => set("colour", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input className="bg-muted" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <BottomSheetSelect
                value={form.condition}
                onChange={(v) => set("condition", v)}
                options={CONDITIONS.map((c) => ({ value: c, label: c }))}
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Value ($)</Label>
              <Input className="bg-muted" type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Date Acquired</Label>
              <Input className="bg-muted" type="date" value={form.date_acquired || ""} onChange={(e) => set("date_acquired", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Photos</Label>
            <ImageUpload value={form.images || []} onChange={(v) => set("images", v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Save changes" : "Add lure / fly"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}