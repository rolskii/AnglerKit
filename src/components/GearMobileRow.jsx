import React from "react";
import { ChevronRight } from "lucide-react";

const conditionColor = {
  "New": "bg-emerald-100 text-emerald-700",
  "Brand New": "bg-emerald-100 text-emerald-700",
  "Like New": "bg-emerald-100 text-emerald-700",
  "Good": "bg-blue-100 text-blue-700",
  "Fair": "bg-amber-100 text-amber-700",
  "Poor": "bg-rose-100 text-rose-700",
};

export default function GearMobileRow({ title, subtitle, right, condition, onClick, highlight = false }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors ${highlight ? "bg-primary/10 border-l-4 border-l-primary" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {condition && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${conditionColor[condition] || "bg-muted text-muted-foreground"}`}>
          {condition}
        </span>
      )}
      {right && !condition && (
        <span className="text-xs text-muted-foreground font-medium shrink-0">{right}</span>
      )}
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </div>
  );
}