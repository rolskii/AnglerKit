import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const SPECIES_OPTIONS = [
  "Trout", "Salmon", "Steelhead", "Bass", "Pike", "Walleye",
  "Muskie", "Gar", "Carp", "Grayling", "Char", "Saltwater", "Other",
];

const emptyCatch = {
  species: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  length: "",
  weight: "",
  fly_used: "",
  rod: "",
  reel: "",
  line: "",
  conditions: "",
  water_temp: "",
  released: true,
  images: [],
  notes: "",
};

export default function CatchForm({ open, onOpenChange, onSubmit, initial, rods, reels, lines, loading }) {
  const [form, setForm] = useState(emptyCatch);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyCatch, ...initial } : emptyCatch);
    }
  }, [open, initial]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      length: numOrNull(form.length),
      weight: numOrNull(form.weight),
      water_temp: numOrNull(form.water_temp),
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Catch" : "Log a Catch"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Species *</Label>
              <Input
                list="catch-species"
                value={form.species}
                onChange={(e) => set("species", e.target.value)}
                required
                placeholder="Trout"
              />
              <datalist id="catch-species">
                {SPECIES_OPTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date || ""}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Body of Water</Label>
            <Input
              value={form.location || ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="River, lake, or spot name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Length (in)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.length ?? ""}
                onChange={(e) => set("length", e.target.value)}
                placeholder="22"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Weight (lb)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.weight ?? ""}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="4.5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fly Used</Label>
            <Input
              value={form.fly_used || ""}
              onChange={(e) => set("fly_used", e.target.value)}
              placeholder="e.g. Elk Hair Caddis"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Rod</Label>
              <Select value={form.rod || ""} onValueChange={(v) => set("rod", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select rod" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {rods.map((r) => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reel</Label>
              <Select value={form.reel || ""} onValueChange={(v) => set("reel", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select reel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {reels.map((r) => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Line</Label>
              <Select value={form.line || ""} onValueChange={(v) => set("line", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select line" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {lines.map((l) => (
                    <SelectItem key={l.id} value={`${l.brand} ${l.model}`}>{l.brand} {l.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Conditions</Label>
              <Input
                value={form.conditions || ""}
                onChange={(e) => set("conditions", e.target.value)}
                placeholder="Overcast, light wind"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Water Temp (°)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.water_temp ?? ""}
                onChange={(e) => set("water_temp", e.target.value)}
                placeholder="54"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="released"
              checked={form.released}
              onCheckedChange={(v) => set("released", v)}
            />
            <Label htmlFor="released" className="cursor-pointer">Released</Label>
          </div>

          <div className="space-y-1.5">
            <Label>Photos</Label>
            <ImageUpload value={form.images} onChange={(imgs) => set("images", imgs)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Details about the catch..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Save Changes" : "Log Catch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}