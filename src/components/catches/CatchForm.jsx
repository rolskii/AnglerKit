import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calculator } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import VideoUpload from "@/components/catches/VideoUpload";
import AudioRecorder from "@/components/catches/AudioRecorder";
import { useUnits } from "@/lib/unitsContext";


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
  video_url: "",
  audio_url: "",
  notes: "",
};

export default function CatchForm({ open, onOpenChange, onSubmit, initial, rods, reels, lines, loading }) {
  const [form, setForm] = useState(emptyCatch);
  const { isMetric, tempLabel } = useUnits();

  useEffect(() => {
    if (open) {
      const base = initial ? { ...emptyCatch, ...initial } : emptyCatch;
      setForm(base);
    }
  }, [open, initial]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Standard fish weight estimator: Weight (lb) = (Length × Girth²) / 800
  const estimatedWeight = (() => {
    const len = parseFloat(form.length);
    const girth = parseFloat(form.girth);
    if (len > 0 && girth > 0) {
      return Number(((len * girth * girth) / 800).toFixed(1));
    }
    return null;
  })();

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
    let length = numOrNull(form.length);
    let girth = numOrNull(form.girth);
    let weight = numOrNull(form.weight);
    const payload = {
      ...form,
      length, girth, weight,
      water_temp: numOrNull(form.water_temp),
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Catch" : "Log a Catch"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Species *</Label>
              <Input
                className="bg-muted"
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
                className="bg-muted"
                type="date"
                value={form.date || ""}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Body of Water</Label>
            <Input
              className="bg-muted"
              value={form.location || ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="River, lake, or spot name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Length (in)</Label>
              <Input
                className="bg-muted"
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
                className="bg-muted"
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
                className="bg-muted"
                type="number"
                step="0.1"
                value={form.weight ?? ""}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="4.5"
              />
              {estimatedWeight != null && (
                <button
                  type="button"
                  onClick={() => set("weight", estimatedWeight)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Estimated: {estimatedWeight} lb — tap to fill
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fly or Lure Used</Label>
            <Input
              className="bg-muted"
              value={form.fly_used || ""}
              onChange={(e) => set("fly_used", e.target.value)}
              placeholder="e.g. Elk Hair Caddis"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rod</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.rod ? (rodIdByName[form.rod] || "") : ""}
                onChange={(e) => set("rod", e.target.value === "" ? "" : (rodById[e.target.value] || ""))}
              >
                <option value="">Select a rod (optional)</option>
                {sortedRods.map((r) => {
                  const details = [r.length, r.line_weight].filter(Boolean).join(" · ");
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name}{details ? ` — ${details}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Reel</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.reel ? (reelIdByName[form.reel] || "") : ""}
                onChange={(e) => set("reel", e.target.value === "" ? "" : (reelById[e.target.value] || ""))}
              >
                <option value="">Select a reel (optional)</option>
                {sortedReels.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Line</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.line ? (sortedLines.find((l) => `${l.brand} ${l.model}`.trim() === form.line)?.id || "") : ""}
              onChange={(e) => set("line", e.target.value === "" ? "" : (lineById[e.target.value] || ""))}
            >
              <option value="">Select a line (optional)</option>
              {sortedLines.map((l) => {
                const label = `${l.brand} ${l.model}`.trim();
                return (
                  <option key={l.id} value={l.id}>
                    {label}{l.grain_weight ? ` — ${l.grain_weight}gr` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Conditions</Label>
              <Input
                className="bg-muted"
                value={form.conditions || ""}
                onChange={(e) => set("conditions", e.target.value)}
                placeholder="Overcast, light wind"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Water Temp ({tempLabel})</Label>
              <Input
                className="bg-muted"
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
            <ImageUpload value={form.images} onChange={(imgs) => set("images", imgs)} compress={false} />
          </div>

          <div className="space-y-1.5">
            <Label>Video</Label>
            <VideoUpload value={form.video_url || ""} onChange={(url) => set("video_url", url)} />
          </div>

          <div className="space-y-1.5">
            <Label>Audio</Label>
            <AudioRecorder value={form.audio_url || ""} onChange={(url) => set("audio_url", url)} />
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