import React, { useEffect, useRef, useState } from "react";
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
import GuidedFieldTour from "@/components/GuidedFieldTour";

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const empty = { name: "", brand: "", model: "", size: "", condition: "Good", notes: "", images: [] };

export default function ReelForm({ open, onOpenChange, onSubmit, initial, loading }) {
  const [form, setForm] = useState(empty);
  const [tourActive, setTourActive] = useState(false);

  const refs = {
    name: useRef(), brand: useRef(), model: useRef(), size: useRef(),
    condition: useRef(), notes: useRef(), images: useRef(),
  };

  const tourSteps = [
    { ref: refs.name, title: "Name", description: "Give this reel a name or description." },
    { ref: refs.brand, title: "Brand", description: "Enter the reel manufacturer." },
    { ref: refs.model, title: "Model", description: "Enter the reel model." },
    { ref: refs.size, title: "Size", description: "Enter the reel size (e.g. 3 3/8\")." },
    { ref: refs.condition, title: "Condition", description: "Select the current condition of the reel." },
    { ref: refs.notes, title: "Notes", description: "Any extra notes about this reel." },
    { ref: refs.images, title: "Photos", description: "Upload one or more photos of the reel." },
  ];

  useEffect(() => {
    if (open && !initial) setTourActive(true);
    else setTourActive(false);
  }, [open, initial]);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Reel" : "Add Reel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5" ref={refs.name}>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Henshaw 3 3/8 Perfect" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5" ref={refs.brand}>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="space-y-1.5" ref={refs.model}>
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="space-y-1.5" ref={refs.size}>
              <Label>Size</Label>
              <Input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder='3 3/8"' />
            </div>
            <div className="space-y-1.5" ref={refs.condition}>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5" ref={refs.notes}>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5" ref={refs.images}>
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
        <GuidedFieldTour steps={tourSteps} active={tourActive} onClose={() => setTourActive(false)} />
      </DialogContent>
    </Dialog>
  );
}