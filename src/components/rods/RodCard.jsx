import React, { useRef } from "react";
import ShareButton from "@/components/ShareButton";
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

export default function RodCard({ rod, lineCount, pairedLines, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const card = {
    title: rod.name,
    subtitle: [rod.brand, rod.model, rod.length, rod.line_weight ? `${rod.line_weight}wt` : null].filter(Boolean).join(" · ") || "—",
    badge: rod.condition,
    details: [
      { label: "Species", value: rod.species },
      { label: "Brand", value: rod.brand },
      { label: "Model", value: rod.model },
      { label: "Length", value: rod.length },
      { label: "Line Weight", value: rod.line_weight },
      { label: "Type", value: rod.type },
      { label: "Material", value: rod.material },
      { label: "Condition", value: rod.condition },
      { label: "Value", value: rod.value != null ? `$${rod.value}` : null },
      { label: "Acquired", value: rod.date_acquired },
    ],
    sections: pairedLines && pairedLines.length > 0 ? [{
      title: "Paired Lines",
      items: pairedLines.map((l) => ({
        name: [l.brand, l.model, l.type, l.line_weight, l.species ? `- ${l.species}` : null].filter(Boolean).join(" "),
        sub: [
          { label: "Grain Wt", value: l.grain_weight },
          { label: "Head Length", value: l.head_length },
          { label: "Total Length", value: l.total_length },
          { label: "Colour", value: l.colour },
          { label: "Condition", value: l.condition },
          { label: "Spooled Reel", value: l.reel },
        ],
        description: l.description,
        notes: l.notes,
      })),
    }] : [],
    notes: rod.notes,
  };
  return (
    <Card ref={cardRef} className="p-4 flex flex-col gap-3">
      <ImageGallery images={getItemImages(rod)} featuredLabel={rod.name} featuredSubtitle="Rod" featuredLink="/gear/rods" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold">{rod.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[rod.brand, rod.model, rod.length, rod.line_weight ? `${rod.line_weight}wt` : null].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Species" value={rod.species} />
        <Detail label="Brand" value={rod.brand} />
        <Detail label="Model" value={rod.model} />
        <Detail label="Length" value={rod.length} />
        <Detail label="Line Weight" value={rod.line_weight} />
        <Detail label="Type" value={rod.type} />
        <Detail label="Material" value={rod.material} />
        <Detail label="Condition" value={rod.condition} />
        <Detail label="Value" value={rod.value != null ? `$${rod.value}` : null} />
        <Detail label="Acquired" value={rod.date_acquired} />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Paired Lines:</span>
          <Badge variant="secondary" className="text-xs">
            {lineCount} line{lineCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        {pairedLines && pairedLines.length > 0 ? (
          <ul className="space-y-3">
            {pairedLines.map((l) => (
              <li key={l.id} className="text-sm border border-border rounded-md p-2.5 bg-muted/30">
                <div className="font-medium mb-1.5">
                  {l.brand} {l.model}{l.type ? ` ${l.type}` : ""}{l.line_weight ? ` ${l.line_weight}` : ""}{l.species ? ` - ${l.species}` : ""}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <LineDetail label="Grain Wt" value={l.grain_weight} />
                  <LineDetail label="Head Length" value={l.head_length} />
                  <LineDetail label="Total Length" value={l.total_length} />
                  <LineDetail label="Colour" value={l.colour} />
                  <LineDetail label="Condition" value={l.condition} />
                  <LineDetail label="Spooled Reel" value={l.reel} />
                </div>
                {l.description && <p className="text-xs text-muted-foreground mt-1.5">{l.description}</p>}
                {l.notes && <p className="text-xs text-muted-foreground italic mt-1">{l.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No lines paired with this rod.</p>
        )}
      </div>

      {rod.notes && <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{rod.notes}</p>}

      <div className="flex items-center gap-2 mt-auto pt-1" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(rod)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <ShareButton card={card} photoUrls={getItemImages(rod)} />
        <div className="w-px self-stretch bg-border mx-1" aria-hidden="true" />
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(rod)}>
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

function LineDetail({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right break-words">{value != null && value !== "" ? value : "—"}</span>
    </div>
  );
}