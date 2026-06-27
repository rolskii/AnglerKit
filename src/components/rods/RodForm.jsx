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

const TYPES = ["Single Hand", "Switch", "Spey", "Other"];
const MATERIALS = ["Carbon", "Cane", "Fiberglass", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const empty = { name: "", brand: "", length: "", line_weight: "", type: "Single Hand", material: "Carbon", condition: "Good", notes: "", images: [] };

export default function RodForm({ open, onOpenChange, onSubmit, initial, loading }) {
  const [form, setForm] = useState(empty);
  const [tourActive, setTourActive] = useState(false);

  const refs = {
    name: useRef(), brand: useRef(), length: useRef(), line_weight: useRef(),
    type: useRef(), material: useRef(), condition: useRef(), notes: useRef(), images: useRef(),
  };

  const tourSteps = [
    { ref: refs.name, title: "Name", description: "Give this rod a name or description." },
    { ref: refs.brand, title: "Brand", description: "Enter the rod manufacturer." },
    { ref: refs.length, title: "Length", description: "Enter the rod length (e.g. 9'4\")." },
    { ref: refs.line_weight, title: "Line Weight", description: "Enter the recommended line weight." },
    { ref: refs.type, title: "Type", description: "Choose Single Hand, Switch, Spey, or Other." },
    { ref: refs.material, title: "Material", description: "Choose the rod material." },
    { ref: refs.condition, title: "Condition", description: "Select the current condition of the rod." },
    { ref: refs.notes, title: "Notes", description: "Any extra notes about this rod." },
    { ref: refs.images, title: "Photos", description: "Upload one or more photos of the rod." },
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
    <Dialog open={open} onOpenChange={(v) => { if (!v && tourActive) return; onOpenChange(v); }}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={tourActive ? (e) => e.preventDefault() : undefined}
        onInteractOutside={tourActive ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Rod" : "Add Rod"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5" ref={refs.name}>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder={`e.g. Milwards 9'4" Troutmaster Cane`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5" ref={refs.brand}>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
            <div className="space-y-1.5" ref={refs.length}>
              <Label>Length</Label>
              <Input value={form.length} onChange={(e) => set("length", e.target.value)} placeholder={`9'4"`} />
            </div>
            <div className="space-y-1.5" ref={refs.line_weight}>
              <Label>Line Weight</Label>
              <Input value={form.line_weight} onChange={(e) => set("line_weight", e.target.value)} placeholder="6" />
            </div>
            <div className="space-y-1.5" ref={refs.type}>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5" ref={refs.material}>
              <Label>Material</Label>
              <Select value={form.material} onValueChange={(v) => set("material", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
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
              {initial ? "Save changes" : "Add rod"}
            </Button>
          </DialogFooter>
        </form>
        <GuidedFieldTour steps={tourSteps} active={tourActive} onClose={() => setTourActive(false)} />
      </DialogContent>
    </Dialog>
  );
}