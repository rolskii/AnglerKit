import React from "react";

// Filter chips for the gear list pages (Lines, Reels, Rods). Single-select per
// field: tap a chip to filter the list, tap it again to clear it. Values are
// derived from the loaded items.
export default function GearFilterChips({ items, fields, filters, onChange }) {
  // Only show a filter row when there's actually a choice to make
  const visible = fields.filter((f) => {
    const values = new Set(items.map((i) => i[f.key]).filter(Boolean));
    return values.size > 1 || (values.size === 1 && filters[f.key]);
  });
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {visible.map((f) => {
        const values = Array.from(new Set(items.map((i) => i[f.key]).filter(Boolean)))
          .sort((a, b) => String(a).localeCompare(String(b)));
        return (
          <div key={f.key} className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-14 shrink-0">{f.label}</span>
            {values.map((v) => (
              <button
                key={v}
                onClick={() => onChange(
                  filters[f.key] === v ? { ...filters, [f.key]: null } : { ...filters, [f.key]: v }
                )}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters[f.key] === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground shadow-sm hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}