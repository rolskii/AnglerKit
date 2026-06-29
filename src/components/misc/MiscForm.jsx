import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const CATEGORIES = ["Accessory", "Apparel", "Tool", "Storage", "Safety", "Electronics", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const empty = {
  name: "", category: "Accessory", brand: "", model: "", colour: "",
  quantity: 1, condition: "Good", value: "", notes: "", images: []
};

export default function MiscForm({ open, onOpenChange, onSubmit, initial, loading }) {
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
          <DialogTitle>{initial ? "Edit Misc. Item" : "Add Misc. Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Wading Staff" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Model / Size</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Simms G3, Medium" />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <Input value={form.colour} onChange={(e) => set("colour", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Value ($)</Label>
              <Input type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0.00" />
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
              {initial ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}