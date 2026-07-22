import React from "react";

const conditionColor = {
  "New": "bg-emerald-100 text-emerald-700",
  "Brand New": "bg-emerald-100 text-emerald-700",
  "Like New": "bg-emerald-100 text-emerald-700",
  "Good": "bg-blue-100 text-blue-700",
  "Fair": "bg-amber-100 text-amber-700",
  "Poor": "bg-rose-100 text-rose-700",
};

export default function GearMobileCard({ fields, onClick, highlight = false }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors ${highlight ? "bg-primary/10 border-l-4 border-l-primary" : ""}`}
    >
      <div className="space-y-1">
        {fields.map((f, i) => (
          <div key={i} className="flex justify-between items-center text-sm gap-2">
            <span className="text-muted-foreground text-xs shrink-0">{f.label}</span>
            {f.isCondition && f.value ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[f.value] || "bg-muted text-muted-foreground"}`}>
                {f.value}
              </span>
            ) : (
              <span className="font-medium text-right truncate">{f.value || "—"}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}