import React, { useRef } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Calendar, Fish } from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";

export default function CatchCard({ catchItem, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };
  const card = {
    title: catchItem.species || "Catch",
    subtitle: [fmtDate(catchItem.date), catchItem.location].filter(Boolean).join(" · "),
    badge: catchItem.released ? "Released" : "Kept",
    details: [
      { label: "Length", value: catchItem.length ? `${catchItem.length} in` : null },
      { label: "Girth", value: catchItem.girth ? `${catchItem.girth} in` : null },
      { label: "Weight", value: catchItem.weight ? `${catchItem.weight} lb` : null },
      { label: "Fly", value: catchItem.fly_used },
      { label: "Water Temp", value: catchItem.water_temp != null ? `${catchItem.water_temp}°` : null },
      { label: "Rod", value: catchItem.rod },
      { label: "Reel", value: catchItem.reel },
      { label: "Line", value: catchItem.line },
      { label: "Conditions", value: catchItem.conditions },
    ],
    sections: [],
    notes: catchItem.notes,
  };

  return (
    <Card ref={cardRef} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <ImageGallery images={getItemImages(catchItem)} featuredLabel={catchItem.species || "Catch"} featuredSubtitle="Catch" featuredLink={`/catches/${catchItem.id}`} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold">{catchItem.species}</h3>
            {catchItem.released && <Badge variant="secondary" className="text-xs">Released</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
            {fmtDate(catchItem.date) && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {fmtDate(catchItem.date)}
              </span>
            )}
            {catchItem.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {catchItem.location}
              </span>
            )}
          </div>
        </div>
        {!catchItem.released && (
          <Badge variant="outline" className="text-xs">Kept</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Length" value={catchItem.length ? `${catchItem.length} in` : null} />
        <Detail label="Girth" value={catchItem.girth ? `${catchItem.girth} in` : null} />
        <Detail label="Weight" value={catchItem.weight ? `${catchItem.weight} lb` : null} />
        <Detail label="Fly" value={catchItem.fly_used} />
        <Detail label="Water Temp" value={catchItem.water_temp != null ? `${catchItem.water_temp}°` : null} />
        <Detail label="Rod" value={catchItem.rod} />
        <Detail label="Reel" value={catchItem.reel} />
        <Detail label="Line" value={catchItem.line} />
        <Detail label="Conditions" value={catchItem.conditions} />
      </div>

      {catchItem.notes && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{catchItem.notes}</p>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(catchItem)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <ShareButton card={card} photoUrls={getItemImages(catchItem)} />
        <div className="w-px self-stretch bg-border mx-1" aria-hidden="true" />
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(catchItem)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-words whitespace-normal">{value || "—"}</span>
    </div>
  );
}