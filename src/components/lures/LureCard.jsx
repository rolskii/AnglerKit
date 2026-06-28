import React, { useRef } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
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

export default function LureCard({ lure, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const card = {
    title: lure.name,
    subtitle: [lure.type, lure.category, lure.brand].filter(Boolean).join(" · ") || "—",
    badge: lure.condition,
    details: [
      { label: "Type", value: lure.type },
      { label: "Category", value: lure.category },
      { label: "Brand", value: lure.brand },
      { label: "Size", value: lure.size },
      { label: "Colour", value: lure.colour },
      { label: "Quantity", value: lure.quantity != null ? lure.quantity : null },
      { label: "Condition", value: lure.condition },
      { label: "Value", value: lure.value != null ? `$${lure.value}` : null },
    ],
    sections: [],
    notes: lure.notes,
  };
  return (
    <Card ref={cardRef} className="p-4 flex flex-col gap-3">
      <ImageGallery images={getItemImages(lure)} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold">{lure.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[lure.type, lure.category, lure.brand].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {lure.condition && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[lure.condition] || "bg-muted text-muted-foreground"}`}>
            {lure.condition}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Type" value={lure.type} />
        <Detail label="Category" value={lure.category} />
        <Detail label="Brand" value={lure.brand} />
        <Detail label="Size" value={lure.size} />
        <Detail label="Colour" value={lure.colour} />
        <Detail label="Quantity" value={lure.quantity != null ? lure.quantity : null} />
        <Detail label="Condition" value={lure.condition} />
        <Detail label="Value" value={lure.value != null ? `$${lure.value}` : null} />
      </div>

      {lure.notes && <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{lure.notes}</p>}

      <div className="flex gap-2 mt-auto pt-1" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(lure)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <ShareButton card={card} photoUrls={getItemImages(lure)} />
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(lure)}>
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
      <span className="font-medium text-right break-words">{value != null && value !== "" ? value : "—"}</span>
    </div>
  );
}