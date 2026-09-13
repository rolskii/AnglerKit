import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Compact dropdown filters for the gear list pages (Lines, Reels, Rods).
// One dropdown per field (e.g. Species, Brand); "All" clears the filter.
// Fields are derived from the loaded items, and a field with only one value
// is left out to keep the bar clean.
export default function GearFilterSelects({ items, fields, filters, onChange }) {
  const visible = fields.filter((f) => {
    const values = new Set(items.map((i) => i[f.key]).filter(Boolean));
    return values.size > 1 || (values.size === 1 && filters[f.key]);
  });
  if (visible.length === 0) return null;

  return (
    <div className="flex gap-3">
      {visible.map((f) => {
        const values = Array.from(new Set(items.map((i) => i[f.key]).filter(Boolean)))
          .sort((a, b) => String(a).localeCompare(String(b)));
        return (
          <Select
            key={f.key}
            value={filters[f.key] || "all"}
            onValueChange={(v) => onChange({ ...filters, [f.key]: v === "all" ? null : v })}
          >
            <SelectTrigger className="flex-1 bg-card border-0 shadow-sm h-9">
              <SelectValue placeholder={`All ${f.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label}</SelectItem>
              {values.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}