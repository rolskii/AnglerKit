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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const SPECIES = ["Trout", "Salmon", "Steelhead", "Bass", "Pike", "Saltwater", "Gar", "Muskie", "Anything", "Other"];
const TYPES = ["Tip", "Body", "Head", "Integrated", "Shooting", "WF", "Running", "Sinking", "System", "Other"];
const CONDITIONS = ["New", "Brand New", "Like New", "Good", "Fair", "Poor"];
const DEFAULT_BRANDS = ["Rio", "Cortland", "Scientific Anglers", "Sage", "3M", "Airflo", "Wulff"];

const empty = {
  species: "Trout", brand: "", model: "", type: "Head", description: "",
  line_weight: "", grain_weight: "", head_length: "", total_length: "",
  colour: "", condition: "Good", reel: "", rod: "", spooled: false, notes: "",
};

export default function LineForm({ open, onOpenChange, onSubmit, initial, reels, rods, loading, existingBrands = [] }) {
  const [form, setForm] = useState(empty);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  
  const filteredBrands = form.brand
    ? (existingBrands.length > 0 ? existingBrands : DEFAULT_BRANDS).filter(b =>
        b.toLowerCase().includes(form.brand.toLowerCase())
      )
    : [];

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const speciesOptions = form.species && !SPECIES.includes(form.species)
    ? [...SPECIES, form.species]
    : SPECIES;
  const typeOptions = form.type && !TYPES.includes(form.type)
    ? [...TYPES, form.type]
    : TYPES;

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{initial ? "Edit Fly Line" : "Add Fly Line"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Species</Label>
                <Select value={form.species} onValueChange={(v) => set("species", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 relative">
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
              <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Floating, Sink, etc." />
            </div>
            <div className="space-y-1.5">
              <Label>Line Weight</Label>
              <Input value={form.line_weight} onChange={(e) => set("line_weight", e.target.value)} placeholder="6, 4/5, n/a" />
            </div>
            <div className="space-y-1.5">
              <Label>Grain Weight</Label>
              <Input type="number" value={form.grain_weight} onChange={(e) => set("grain_weight", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Head Length (ft)</Label>
              <Input type="number" value={form.head_length} onChange={(e) => set("head_length", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Length (ft)</Label>
              <Input type="number" value={form.total_length} onChange={(e) => set("total_length", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <Input value={form.colour} onChange={(e) => set("colour", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reel</Label>
              <Select value={form.reel || "_none"} onValueChange={(v) => set("reel", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {reels.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Spooled</Label>
              <div className="flex items-center gap-2 h-9">
                <Checkbox
                  checked={!!form.spooled}
                  onCheckedChange={(v) => set("spooled", !!v)}
                />
                <span className="text-sm text-muted-foreground">On a spare spool (not on a reel)</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rod</Label>
              <Select value={form.rod || "_none"} onValueChange={(v) => set("rod", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {rods.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
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
          </DialogContent>
          </Dialog>
          </>
          );
          }