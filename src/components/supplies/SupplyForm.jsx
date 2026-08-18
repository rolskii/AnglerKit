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

const CATEGORIES = ["Leader/Tippet", "Weight", "Wire", "Hair", "Feathers", "Hooks", "Thread/Floss", "Beads/Eyes", "Dubbing", "Adhesive", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const empty = {
  name: "", category: "Other", brand: "", model: "", colour: "",
  quantity: 1, condition: "New", value: "", date_acquired: "", notes: "", images: []
};

export default function SupplyForm({ open, onOpenChange, onSubmit, initial, loading }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const autoName = [form.brand, form.model].filter(Boolean).join(" ").trim() || form.name;
    onSubmit({
      ...form,
      name: autoName,
      quantity: form.quantity ? Number(form.quantity) : null,
      value: form.value ? Number(form.value) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Supply" : "Add Supply"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <FormSelect
                value={form.category}
                onChange={(v) => set("category", v)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input className="bg-muted" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Model / Size</Label>
              <Input className="bg-muted" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. #14, 0.030, 70 Denier, Sz 2" />
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
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>Photos</Label>
            <ImageUpload value={form.images || []} onChange={(v) => set("images", v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}