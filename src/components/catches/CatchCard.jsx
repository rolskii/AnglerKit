import React, { useRef, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Calendar, Fish, Star, Info } from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";

export default function CatchCard({ catchItem, onEdit, onDelete, lines = [], rods = [], reels = [] }) {
  const cardRef = useRef(null);
  const [showFormula, setShowFormula] = useState(false);
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };
  const fmtTime = (t) => {
    if (!t) return null;
    const [h, m] = String(t).split(":").map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`;
  };
  const estWeight = (catchItem.length && catchItem.girth)
    ? (catchItem.length * catchItem.girth * catchItem.girth / 800)
    : null;
  const matchedLine = lines.find((l) => l.id === catchItem.line)
    || lines.find((l) => `${l.brand} ${l.model}`.trim() === catchItem.line);
  const grainWeight = matchedLine?.grain_weight;
  const lineDisplay = matchedLine ? `${matchedLine.brand} ${matchedLine.model}`.trim() : catchItem.line;
  const matchedReel = reels.find((r) => r.id === catchItem.reel)
    || reels.find((r) => r.name === catchItem.reel);
  const reelDisplay = matchedReel
    ? [matchedReel.brand, matchedReel.model].filter(Boolean).join(" ")
    : catchItem.reel;
  const reelDetails = matchedReel
    ? [matchedReel.size, matchedReel.type].filter(Boolean).join(" · ")
    : null;
  const matchedRod = rods.find((r) => r.id === catchItem.rod)
    || rods.find((r) => r.name === catchItem.rod);
  const rodDisplay = matchedRod
    ? [matchedRod.brand, matchedRod.model].filter(Boolean).join(" ")
    : catchItem.rod;
  const rodDetails = matchedRod
    ? [matchedRod.length, matchedRod.line_weight && `${matchedRod.line_weight} wt`].filter(Boolean).join(" · ")
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
      { label: "Rod", value: rodDetails ? `${rodDisplay} (${rodDetails})` : rodDisplay },
      { label: "Reel", value: reelDetails ? `${reelDisplay} (${reelDetails})` : reelDisplay },
      { label: "Line", value: lineDisplay },
      { label: "Grain Weight", value: catchItem.line && grainWeight != null ? `${grainWeight} gr` : null },
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
                <Calendar className="w-3.5 h-3.5" /> {fmtDate(catchItem.date)}{catchItem.time ? ` · ${fmtTime(catchItem.time)}` : ""}
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

      <div className="space-y-1.5 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <Detail label="Length" value={catchItem.length ? `${catchItem.length} in` : null} />
          <Detail label="Girth" value={catchItem.girth ? `${catchItem.girth} in` : null} />
          {estWeight != null ? (
            <div className="flex justify-between gap-2 items-center">
              <button onClick={() => setShowFormula(v => !v)} className="text-muted-foreground whitespace-normal text-left leading-snug" aria-label="Show formula">
                Est. Weight<span className="text-xl font-bold text-amber-500 align-middle">*</span>
              </button>
              <span className="font-medium text-right whitespace-nowrap">{estWeight.toFixed(2)} lb</span>
            </div>
          ) : (
            <Detail label="Weight" value={catchItem.weight ? `${catchItem.weight} lb` : null} />
          )}
          <Detail label="Water Temp" value={catchItem.water_temp != null ? `${catchItem.water_temp}°` : null} />
        </div>
        <Detail label="Fly or Lure Used" value={catchItem.fly_used} />
        <Detail label="Rod" value={rodDisplay} subValue={rodDetails} />
        <Detail label="Reel" value={reelDisplay} subValue={reelDetails} />
        <Detail label="Line" value={lineDisplay} />
        {catchItem.line && grainWeight != null && (
          <Detail label="Grain Weight" value={`${grainWeight} gr`} />
        )}
        <Detail label="Conditions" value={catchItem.conditions} />
      </div>

      {catchItem.video_url && (
        <div className="border-t border-border pt-2">
          <video src={catchItem.video_url} controls className="w-full max-h-64 rounded-lg bg-black" />
        </div>
      )}
      {catchItem.audio_url && (
        <div className="border-t border-border pt-2">
          <audio src={catchItem.audio_url} controls className="w-full" />
        </div>
      )}
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

function Detail({ label, value, subValue }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-words whitespace-normal">
        {value || "—"}
        {subValue && <span className="text-muted-foreground font-normal"> ({subValue})</span>}
      </span>
    </div>
  );
}