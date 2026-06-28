import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";

const conditionColor = {
  "New": "bg-emerald-100 text-emerald-700",
  "Like New": "bg-emerald-100 text-emerald-700",
  "Good": "bg-blue-100 text-blue-700",
  "Fair": "bg-amber-100 text-amber-700",
  "Poor": "bg-rose-100 text-rose-700",
};

export default function LineCard({ line, onEdit, onDelete }) {
  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <ImageGallery images={getItemImages(line)} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold">{line.brand} {line.model}</h3>
            <Badge variant="secondary" className="text-xs">{line.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {line.species} · {line.description || "—"}
          </p>
        </div>
        {line.condition && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[line.condition] || "bg-muted text-muted-foreground"}`}>
            {line.condition}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Line Wt" value={line.line_weight} />
        <Detail label="Grain Wt" value={line.grain_weight} />
        <Detail label="Head Len" value={line.head_length ? `${line.head_length} ft` : null} />
        <Detail label="Total Len" value={line.total_length ? `${line.total_length} ft` : null} />
        <Detail label="Colour" value={line.colour} />
        <Detail label="Value" value={line.value != null ? `$${line.value}` : null} />
      </div>

      <div className="flex flex-col gap-1.5 text-sm border-t border-border pt-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-medium shrink-0">Reel:</span>
          <span className="truncate">{line.reel || "No reel"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-medium shrink-0">Rod:</span>
          <span className="truncate">{line.rod || "No rod"}</span>
        </div>
      </div>

      {line.notes && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{line.notes}</p>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(line)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(line)}>
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