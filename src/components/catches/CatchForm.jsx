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
import CatchPhotoUpload from "@/components/catches/CatchPhotoUpload";
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
  time: "",
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
      // Migrate legacy name/string values to entity ids so gear stays
      // uniquely identifiable even if names duplicate or gear is renamed
      if (base.rod && !rods.some((r) => r.id === base.rod)) {
        const matched = rods.find((r) => r.name === base.rod);
        if (matched) base.rod = matched.id;
      }
      if (base.reel && !reels.some((r) => r.id === base.reel)) {
        const matched = reels.find((r) => r.name === base.reel);
        if (matched) base.reel = matched.id;
      }
      if (base.line && !lines.some((l) => l.id === base.line)) {
        const matched = lines.find((l) => `${l.brand} ${l.model}`.trim() === base.line);
        if (matched) base.line = matched.id;
      }
      setForm(base);
    }
  }, [open, initial, rods, reels, lines]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Merge photo-captured metadata into the form, filling only blank fields so
  // anything the user has already entered is preserved.
  const handleMeta = (meta) => {
    setForm((f) => {
      const next = { ...f };
      for (const [k, v] of Object.entries(meta)) {
        if (v == null || v === "") continue;
        if (!next[k]) next[k] = v;
      }
      return next;
    });
  };

  // Standard fish weight estimator: Weight (lb) = (Length × Girth²) / 800
  const estimatedWeight = (() => {
    const len = parseFloat(form.length);
    const girth = parseFloat(form.girth);
    if (len > 0 && girth > 0) {
      return Number(((len * girth * girth) / 800).toFixed(1));
    }
    return null;
  })();

  const sortedRods = [...rods].sort((a, b) => [a.brand, a.model].filter(Boolean).join(" ").localeCompare([b.brand, b.model].filter(Boolean).join(" ")));
  const sortedReels = [...reels].sort((a, b) => [a.brand, a.model].filter(Boolean).join(" ").localeCompare([b.brand, b.model].filter(Boolean).join(" ")));
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                className="bg-muted"
                type="date"
                value={form.date || ""}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                className="bg-muted"
                type="time"
                value={form.time || ""}
                onChange={(e) => set("time", e.target.value)}
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
                value={form.rod || ""}
                onChange={(e) => set("rod", e.target.value)}
              >
                <option value="">Select a rod (optional)</option>
                {sortedRods.map((r) => {
                  const label = [r.brand, r.model].filter(Boolean).join(" ");
                  const details = [r.length, r.line_weight && `${r.line_weight} wt`].filter(Boolean).join(" · ");
                  return (
                    <option key={r.id} value={r.id}>
                      {label}{details ? ` — ${details}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Reel</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.reel || ""}
                onChange={(e) => set("reel", e.target.value)}
              >
                <option value="">Select a reel (optional)</option>
                {sortedReels.map((r) => {
                  const label = [r.brand, r.model].filter(Boolean).join(" ");
                  const details = [r.size, r.type].filter(Boolean).join(" · ");
                  return (
                    <option key={r.id} value={r.id}>
                      {label}{details ? ` — ${details}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Line</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.line || ""}
              onChange={(e) => set("line", e.target.value)}
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
            <CatchPhotoUpload
              value={form.images || []}
              onChange={(imgs) => set("images", imgs)}
              onMeta={handleMeta}
              isMetric={isMetric}
            />
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