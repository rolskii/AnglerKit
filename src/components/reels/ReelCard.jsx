import React, { useRef } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";
import { formatGearDate } from "@/lib/utils";

const conditionColor = {
  "New": "bg-emerald-100 text-emerald-700",
  "Like New": "bg-emerald-100 text-emerald-700",
  "Good": "bg-blue-100 text-blue-700",
  "Fair": "bg-amber-100 text-amber-700",
  "Poor": "bg-rose-100 text-rose-700",
};

export default function ReelCard({ reel, lineCount, spooledLines, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const card = {
    title: reel.name,
    subtitle: [reel.brand, reel.model, reel.size].filter(Boolean).join(" · ") || "—",
    badge: reel.condition,
    details: [
      { label: "Brand", value: reel.brand },
      { label: "Model", value: reel.model },
      { label: "Size", value: reel.size },
      { label: "Condition", value: reel.condition },
      { label: "Value", value: reel.value != null ? `$${reel.value}` : null },
      { label: "Acquired", value: formatGearDate(reel.date_acquired) },
    ],
    sections: spooledLines && spooledLines.length > 0 ? [{
      title: "Currently Spooled with",
      items: spooledLines.map((l) => ({
        name: [l.brand, l.model, l.type, l.line_weight, l.species ? `- ${l.species}` : null].filter(Boolean).join(" "),
        sub: [
          { label: "Grain Wt", value: l.grain_weight },
          { label: "Head Length", value: l.head_length },
          { label: "Total Length", value: l.total_length },
          { label: "Colour", value: l.colour },
          { label: "Condition", value: l.condition },
          { label: "Paired Rod", value: l.rod },
        ],
        description: l.description,
        notes: l.notes,
      })),
    }] : [],
    notes: reel.notes,
  };
  return (
    <Card ref={cardRef} className="p-4 flex flex-col gap-3">
      <ImageGallery images={getItemImages(reel)} featuredLabel={[reel.brand, reel.model, reel.size].filter(Boolean).join(" ") || reel.name} featuredSubtitle="Reel" featuredLink="/gear/reels" />
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
         <Detail label="Type" value={reel.type} />
         <Detail label="Condition" value={reel.condition} />
         <Detail label="Value" value={reel.value != null ? `$${reel.value}` : null} />
         <Detail label="Acquired" value={formatGearDate(reel.date_acquired)} />
       </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Currently Spooled with:</span>
        </div>
        {spooledLines && spooledLines.length > 0 ? (
          <ul className="space-y-3">
            {spooledLines.map((l) => (
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
                  <LineDetail label="Paired Rod" value={l.rod} />
                </div>
                {l.description && <p className="text-xs text-muted-foreground mt-1.5">{l.description}</p>}
                {l.notes && <p className="text-xs text-muted-foreground italic mt-1">{l.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No lines spooled on this reel.</p>
        )}
      </div>

      {reel.notes && <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{reel.notes}</p>}

      <div className="flex gap-2 mt-auto pt-1" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(reel)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <ShareButton card={card} photoUrls={getItemImages(reel)} />
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

function LineDetail({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-words">{value != null && value !== "" ? value : "—"}</span>
    </div>
  );
}