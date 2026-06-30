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

export default function MiscCard({ item, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const card = {
    title: item.name,
    subtitle: [item.category, item.brand, item.model].filter(Boolean).join(" · ") || "—",
    badge: item.condition,
    details: [
      { label: "Category", value: item.category },
      { label: "Brand", value: item.brand },
      { label: "Model / Size", value: item.model },
      { label: "Colour", value: item.colour },
      { label: "Quantity", value: item.quantity != null ? item.quantity : null },
      { label: "Condition", value: item.condition },
      { label: "Value", value: item.value != null ? `$${item.value}` : null },
      { label: "Acquired", value: item.date_acquired },
    ],
    sections: [],
    notes: item.notes,
  };
  return (
    <Card ref={cardRef} className="p-4 flex flex-col gap-3">
      <ImageGallery images={getItemImages(item)} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold">{item.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[item.category, item.brand, item.model].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {item.condition && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[item.condition] || "bg-muted text-muted-foreground"}`}>
            {item.condition}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Category" value={item.category} />
        <Detail label="Brand" value={item.brand} />
        <Detail label="Model / Size" value={item.model} />
        <Detail label="Colour" value={item.colour} />
        <Detail label="Quantity" value={item.quantity != null ? item.quantity : null} />
        <Detail label="Condition" value={item.condition} />
        <Detail label="Value" value={item.value != null ? `$${item.value}` : null} />
        <Detail label="Acquired" value={item.date_acquired} />
      </div>

      {item.notes && <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{item.notes}</p>}

      <div className="flex items-center gap-2 mt-auto pt-1" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(item)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <ShareButton card={card} photoUrls={getItemImages(item)} />
        <div className="w-px self-stretch bg-border mx-1" aria-hidden="true" />
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
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