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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import GuidedFieldTour from "@/components/GuidedFieldTour";

const SPECIES = ["Trout", "Salmon", "Steelhead", "Bass", "Pike", "Saltwater", "Gar", "Muskie", "Anything", "Other"].sort((a, b) => a.localeCompare(b));
const TYPES = ["Tip", "Body", "Head", "Integrated", "Shooting", "WF", "Running", "Sinking", "System", "Other"].sort((a, b) => a.localeCompare(b));
const CONDITIONS = ["New", "Brand New", "Like New", "Good", "Fair", "Poor"].sort((a, b) => a.localeCompare(b));
const DEFAULT_BRANDS = ["Rio", "Cortland", "Scientific Anglers", "Sage", "3M", "Airflo", "Wulff"].sort((a, b) => a.localeCompare(b));
const DEFAULT_DESCRIPTIONS = ["Floating", "Sink Tip", "Full Sinking", "Intermediate", "Hover", "Float/Sink"].sort((a, b) => a.localeCompare(b));

const empty = {
  species: "Trout", brand: "", model: "", type: "Head", description: "",
  line_weight: "", grain_weight: "", head_length: "", total_length: "",
  colour: "", condition: "Good", reel: "", rod: "", spooled: false, notes: "", images: [],
};

export default function LineForm({ open, onOpenChange, onSubmit, initial, reels, rods, loading, existingBrands = [], existingDescriptions = [] }) {
  const [form, setForm] = useState(empty);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showDescDropdown, setShowDescDropdown] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  const refs = {
    species: useRef(), brand: useRef(), model: useRef(), type: useRef(),
    description: useRef(), line_weight: useRef(), grain_weight: useRef(),
    head_length: useRef(), total_length: useRef(), colour: useRef(),
    condition: useRef(), reel: useRef(), spooled: useRef(), rod: useRef(),
    notes: useRef(), images: useRef(),
  };

  const tourSteps = [
    { ref: refs.species, title: "Species", description: "Select the target species this line is designed for." },
    { ref: refs.brand, title: "Brand", description: "Type the manufacturer. Matching brands from your collection will appear as suggestions." },
    { ref: refs.model, title: "Model", description: "Enter the model name of the line." },
    { ref: refs.type, title: "Type", description: "Choose the line type (e.g. Head, Shooting, WF)." },
    { ref: refs.description, title: "Description", description: "Add a short description like Floating or Sink." },
    { ref: refs.line_weight, title: "Line Weight", description: "Enter the line weight (e.g. 6, 4/5, n/a)." },
    { ref: refs.grain_weight, title: "Grain Weight", description: "Optional: the grain weight as a number." },
    { ref: refs.head_length, title: "Head Length", description: "Optional: head length in feet." },
    { ref: refs.total_length, title: "Total Length", description: "Optional: total line length in feet." },
    { ref: refs.colour, title: "Colour", description: "Enter the line colour." },
    { ref: refs.condition, title: "Condition", description: "Select the current condition of the line." },
    { ref: refs.reel, title: "Reel", description: "Choose the reel this line is spooled on, or None." },
    { ref: refs.spooled, title: "Spooled", description: "Check this if the line is on a spare spool rather than a reel." },
    { ref: refs.rod, title: "Rod", description: "Choose the rod this line is paired with, or None." },
    { ref: refs.notes, title: "Notes", description: "Any extra notes about this line." },
    { ref: refs.images, title: "Photos", description: "Upload one or more photos of the line." },
  ];

  useEffect(() => {
    if (open && !initial) setTourActive(true);
    else setTourActive(false);
  }, [open, initial]);
  
  const filteredBrands = form.brand
    ? (existingBrands.length > 0 ? existingBrands : DEFAULT_BRANDS).filter(b =>
        b.toLowerCase().includes(form.brand.toLowerCase())
      ).sort((a, b) => a.localeCompare(b))
    : [];

  const filteredDescriptions = form.description
    ? (existingDescriptions.length > 0 ? existingDescriptions : DEFAULT_DESCRIPTIONS).filter(d =>
        d.toLowerCase().includes(form.description.toLowerCase())
      ).sort((a, b) => a.localeCompare(b))
    : (existingDescriptions.length > 0 ? existingDescriptions : DEFAULT_DESCRIPTIONS).slice().sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const speciesOptions = (form.species && !SPECIES.includes(form.species)
    ? [...SPECIES, form.species]
    : SPECIES).sort((a, b) => a.localeCompare(b));
  const typeOptions = (form.type && !TYPES.includes(form.type)
    ? [...TYPES, form.type]
    : TYPES).sort((a, b) => a.localeCompare(b));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      grain_weight: form.grain_weight ? Number(form.grain_weight) : null,
      head_length: form.head_length ? Number(form.head_length) : null,
      total_length: form.total_length ? Number(form.total_length) : null,
    };
    onSubmit(payload);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v && tourActive) return; onOpenChange(v); }}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={tourActive ? (e) => e.preventDefault() : undefined}
          onInteractOutside={tourActive ? (e) => e.preventDefault() : undefined}
        >
          <DialogHeader>
            <DialogTitle>{initial ? "Edit Fly Line" : "Add Fly Line"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5" ref={refs.species}>
                <Label>Species</Label>
                <Select value={form.species} onValueChange={(v) => set("species", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 relative" ref={refs.brand}>
                <Label>Brand</Label>
                <input 
                  type="text"
                  value={form.brand} 
                  onChange={(e) => { set("brand", e.target.value); setShowBrandDropdown(true); }}
                  onFocus={() => setShowBrandDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required 
                />
                {showBrandDropdown && filteredBrands.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-input rounded-md shadow-md z-10 max-h-48 overflow-y-auto">
                    {filteredBrands.map((brand, idx) => (
                      <div
                        key={idx}
                        onClick={() => { set("brand", brand); setShowBrandDropdown(false); }}
                        className="px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                      >
                        {brand}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5" ref={refs.model}>
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} required />
            </div>
            <div className="space-y-1.5" ref={refs.type}>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2 relative" ref={refs.description}>
              <Label>Description</Label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => { set("description", e.target.value); setShowDescDropdown(true); }}
                onFocus={() => setShowDescDropdown(true)}
                onBlur={() => setTimeout(() => setShowDescDropdown(false), 200)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Floating, Sink, etc."
              />
              {showDescDropdown && filteredDescriptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-input rounded-md shadow-md z-10 max-h-48 overflow-y-auto">
                  {filteredDescriptions.map((desc, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => { e.preventDefault(); set("description", desc); setShowDescDropdown(false); }}
                      className="px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                    >
                      {desc}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5" ref={refs.line_weight}>
              <Label>Line Weight</Label>
              <Input value={form.line_weight} onChange={(e) => set("line_weight", e.target.value)} placeholder="6, 4/5, n/a" />
            </div>
            <div className="space-y-1.5" ref={refs.grain_weight}>
              <Label>Grain Weight</Label>
              <Input type="number" value={form.grain_weight} onChange={(e) => set("grain_weight", e.target.value)} />
            </div>
            <div className="space-y-1.5" ref={refs.head_length}>
              <Label>Head Length (ft)</Label>
              <Input type="number" value={form.head_length} onChange={(e) => set("head_length", e.target.value)} />
            </div>
            <div className="space-y-1.5" ref={refs.total_length}>
              <Label>Total Length (ft)</Label>
              <Input type="number" value={form.total_length} onChange={(e) => set("total_length", e.target.value)} />
            </div>
            <div className="space-y-1.5" ref={refs.colour}>
              <Label>Colour</Label>
              <Input value={form.colour} onChange={(e) => set("colour", e.target.value)} />
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
            <div className="space-y-1.5" ref={refs.reel}>
              <Label>Reel</Label>
              <Select value={form.reel || "_none"} onValueChange={(v) => set("reel", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {[...reels].sort((a, b) => a.name.localeCompare(b.name)).map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5" ref={refs.spooled}>
              <Label>Spooled</Label>
              <div className="flex items-center gap-2 h-9">
                <Checkbox
                  checked={!!form.spooled}
                  onCheckedChange={(v) => set("spooled", !!v)}
                />
                <span className="text-sm text-muted-foreground">On a spare spool (not on a reel)</span>
              </div>
            </div>
            <div className="space-y-1.5" ref={refs.rod}>
              <Label>Rod</Label>
              <Select value={form.rod || "_none"} onValueChange={(v) => set("rod", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {[...rods].sort((a, b) => a.name.localeCompare(b.name)).map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2" ref={refs.notes}>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5 col-span-2" ref={refs.images}>
              <Label>Photos</Label>
              <ImageUpload value={form.images || []} onChange={(v) => set("images", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Save changes" : "Add line"}
            </Button>
          </DialogFooter>
          </form>
          <GuidedFieldTour steps={tourSteps} active={tourActive} onClose={() => setTourActive(false)} />
          </DialogContent>
          </Dialog>
          </>
          );
          }