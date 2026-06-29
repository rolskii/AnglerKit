import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  girth: "",
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

  // Use unique entity ids as dropdown values (names can duplicate), but store
  // the display name on the catch so existing records and the card still work.
  const rodById = Object.fromEntries(rods.map((r) => [r.id, r.name]));
  const reelById = Object.fromEntries(reels.map((r) => [r.id, r.name]));
  const lineById = Object.fromEntries(lines.map((l) => [l.id, `${l.brand} ${l.model}`.trim()]));
  const rodIdByName = Object.fromEntries(rods.map((r) => [r.name, r.id]));
  const reelIdByName = Object.fromEntries(reels.map((r) => [r.name, r.id]));
  const lineIdByName = Object.fromEntries(lines.map((l) => [`${l.brand} ${l.model}`.trim(), l.id]));

  const sortedRods = [...rods].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const sortedReels = [...reels].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const sortedLines = [...lines].sort((a, b) => (`${a.brand} ${a.model}`.trim()).localeCompare(`${b.brand} ${b.model}`.trim()));

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      length: numOrNull(form.length),
      girth: numOrNull(form.girth),
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
              <Label>Girth (in)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.girth ?? ""}
                onChange={(e) => set("girth", e.target.value)}
                placeholder="12"
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
              <select
                value={form.rod ? (rodIdByName[form.rod] || "") : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set("rod", v === "" ? "" : (rodById[v] || ""));
                }}
                className="flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 py-1 pr-8 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center" }}
              >
                <option value="">—</option>
                {sortedRods.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Reel</Label>
              <select
                value={form.reel ? (reelIdByName[form.reel] || "") : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set("reel", v === "" ? "" : (reelById[v] || ""));
                }}
                className="flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 py-1 pr-8 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center" }}
              >
                <option value="">—</option>
                {sortedReels.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Line</Label>
              <select
                value={form.line ? (lineIdByName[form.line] || "") : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set("line", v === "" ? "" : (lineById[v] || ""));
                }}
                className="flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 py-1 pr-8 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center" }}
              >
                <option value="">—</option>
                {sortedLines.map((l) => (
                  <option key={l.id} value={l.id}>{l.brand} {l.model}</option>
                ))}
              </select>
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