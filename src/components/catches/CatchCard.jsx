import React, { useRef, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Calendar, Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { getItemImages } from "@/components/ImageGallery";
import { useUnits } from "@/lib/unitsContext";

export default function CatchCard({ catchItem, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const { formatLength, formatWeight } = useUnits();
  const images = getItemImages(catchItem);
  const [photoIdx, setPhotoIdx] = useState(0);

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
      { label: "Weight", value: catchItem.weight ? formatWeight(catchItem.weight) : null },
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

  const stats = card.details.filter(d => d.value);
  const hasPhotos = images.length > 0;

  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + images.length) % images.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % images.length); };

  return (
    <Card ref={cardRef} className="overflow-hidden flex flex-col bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-700 hover:shadow-lg transition-shadow">
      {/* Large photo window */}
      <div className="relative aspect-[4/3] bg-stone-200 dark:bg-stone-800 overflow-hidden">
        {hasPhotos ? (
          <img
            src={images[photoIdx]}
            alt={catchItem.species || "Catch"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Fish className="w-16 h-16 text-stone-400 dark:text-stone-600" />
          </div>
        )}

        {/* Released/Kept stamp */}
        <div className="absolute top-2.5 left-2.5 flex items-center justify-center w-14 h-14 rounded-full bg-stone-800/85 dark:bg-amber-50/90 text-amber-50 dark:text-stone-900 text-[8px] font-bold uppercase tracking-wider transform -rotate-6 border-2 border-amber-50/30 dark:border-stone-900/30 shadow-md leading-tight text-center">
          {catchItem.released ? "Released" : "Kept"}
        </div>

        {/* Photo navigation */}
        {hasPhotos && images.length > 1 && (
          <>
            <button onClick={prevPhoto} className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors" aria-label="Previous photo">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextPhoto} className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors" aria-label="Next photo">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Compact details section */}
      <div className="p-3 space-y-1.5 flex-1 flex flex-col">
        <div>
          <h3 className="font-serif text-lg font-bold leading-tight text-stone-800 dark:text-stone-100">
            {catchItem.species || "Catch"}
          </h3>
          <div className="border-b border-stone-300 dark:border-stone-700 mt-1" />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 flex-wrap">
          {fmtDate(catchItem.date) && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" /> {fmtDate(catchItem.date)}
            </span>
          )}
          {catchItem.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" /> {catchItem.location}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {stats.map((s) => (
            <div key={s.label} className="flex justify-between gap-1.5 border-b border-stone-200 dark:border-stone-800 py-1">
              <span className="uppercase tracking-wide text-stone-500 dark:text-stone-400 text-[9px] font-semibold shrink-0 self-center">{s.label}</span>
              <span className="font-medium text-stone-800 dark:text-stone-100 tabular-nums text-[11px] text-right break-words">{s.value}</span>
            </div>
          ))}
        </div>

        {catchItem.notes && (
          <p className="text-[11px] text-stone-600 dark:text-stone-400 italic border-t border-stone-300 dark:border-stone-700 pt-1.5 leading-snug">{catchItem.notes}</p>
        )}

        <div className="flex gap-1.5 mt-auto pt-1.5" data-html2canvas-ignore="true">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => onEdit(catchItem)}>
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <ShareButton card={card} photoUrls={images} />
          <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive px-2" onClick={() => onDelete(catchItem)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}