import React, { useRef, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Calendar, Fish, Star, Info } from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";

export default function CatchCard({ catchItem, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const [showFormula, setShowFormula] = useState(false);
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };
  const estWeight = (catchItem.length && catchItem.girth)
    ? (catchItem.length * catchItem.girth * catchItem.girth / 800)
    : null;
  const card = {
    title: catchItem.species || "Catch",
    subtitle: [fmtDate(catchItem.date), catchItem.location].filter(Boolean).join(" · "),
    badge: catchItem.released ? "Released" : "Kept",
    details: [
      { label: "Length", value: catchItem.length ? `${catchItem.length} in` : null },
      { label: "Girth", value: catchItem.girth ? `${catchItem.girth} in` : null },
      { label: estWeight != null ? "Estimated Weight" : "Weight", value: estWeight != null ? `${estWeight.toFixed(2)} lb` : (catchItem.weight ? `${catchItem.weight} lb` : null) },
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

      {showFormula && estWeight != null && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-medium">Weight formula:</span>{' '}
            Weight = (Length × Girth²) ÷ 800
            <div className="text-muted-foreground mt-0.5">
              = ({catchItem.length} × {catchItem.girth}²) ÷ 800 = {estWeight.toFixed(2)} lb
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Length" value={catchItem.length ? `${catchItem.length} in` : null} />
        <Detail label="Girth" value={catchItem.girth ? `${catchItem.girth} in` : null} />
        {estWeight != null ? (
          <div className="flex justify-between gap-2 items-center">
            <span className="text-muted-foreground shrink-0 flex items-center gap-1">
              Estimated Weight
              <button onClick={() => setShowFormula(v => !v)} className="text-amber-500 hover:text-amber-600 transition-colors" aria-label="Show formula">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </button>
            </span>
            <span className="font-medium text-right break-words whitespace-normal">{estWeight.toFixed(2)} lb</span>
          </div>
        ) : (
          <Detail label="Weight" value={catchItem.weight ? `${catchItem.weight} lb` : null} />
        )}
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