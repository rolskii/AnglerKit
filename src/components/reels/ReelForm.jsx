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

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const TYPES = ["Baitcaster", "Fly", "Spinning", "Other"];
const empty = { name: "", brand: "", model: "", size: "", type: "", condition: "Good", value: "", notes: "", images: [] };

export default function ReelForm({ open, onOpenChange, onSubmit, initial, loading }) {
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
          <DialogTitle>{initial ? "Edit Reel" : "Add Reel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Henshaw 3 3/8 Perfect" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder='3 3/8"' />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <div className="space-y-1.5">
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
              {initial ? "Save changes" : "Add reel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}