import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

const conditionColor = {
  "New": "bg-emerald-100 text-emerald-700",
  "Like New": "bg-emerald-100 text-emerald-700",
  "Good": "bg-blue-100 text-blue-700",
  "Fair": "bg-amber-100 text-amber-700",
  "Poor": "bg-rose-100 text-rose-700",
};

export default function ReelCard({ reel, lineCount, onEdit, onDelete }) {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold">{reel.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[reel.brand, reel.model, reel.size].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {reel.condition && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[reel.condition] || "bg-muted text-muted-foreground"}`}>
            {reel.condition}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Brand" value={reel.brand} />
        <Detail label="Model" value={reel.model} />
        <Detail label="Size" value={reel.size} />
        <Detail label="Condition" value={reel.condition} />
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Badge variant="secondary" className="text-xs">
          {lineCount || 0} line{(lineCount || 0) !== 1 ? "s" : ""}
        </Badge>
      </div>

      {reel.notes && <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{reel.notes}</p>}

      <div className="flex gap-2 mt-auto pt-1">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(reel)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(reel)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value || "—"}</span>
    </div>
  );
}