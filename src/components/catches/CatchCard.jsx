import React, { useRef, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { getItemImages } from "@/components/ImageGallery";
import { useUnits } from "@/lib/unitsContext";

export default function CatchCard({ catchItem, onView, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const { formatWeight } = useUnits();
  const images = getItemImages(catchItem);
  const [photoIdx, setPhotoIdx] = useState(0);

  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };

  const statRows = [
    [
      { label: "Length", value: catchItem.length != null ? `${catchItem.length} in` : null },
      { label: "Girth", value: catchItem.girth != null ? `${catchItem.girth} in` : null },
    ],
    [
      { label: "Weight", value: catchItem.weight != null ? formatWeight(catchItem.weight) : null },
      { label: "Fly", value: catchItem.fly_used },
    ],
    [
      { label: "Water", value: catchItem.water_temp != null ? `${catchItem.water_temp}°` : null },
      { label: "Date", value: fmtDate(catchItem.date) },
    ],
  ];

  const hasPhotos = images.length > 0;

  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + images.length) % images.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % images.length); };

  const card = {
    title: catchItem.species || "Catch",
    subtitle: [fmtDate(catchItem.date), catchItem.location].filter(Boolean).join(" · "),
    badge: catchItem.released ? "Released" : "Kept",
    details: statRows.flat().filter(Boolean),
    sections: [],
    notes: catchItem.notes,
  };

  return (
    <Card
      ref={cardRef}
      onClick={() => onView?.(catchItem)}
      className="overflow-hidden flex flex-col cursor-pointer border border-[#7a6e61]/30 bg-[#c9b9a6] dark:bg-[#4a3f33] dark:border-[#a89880]/30 hover:shadow-xl transition-shadow rounded-lg"
    >
      {/* Photo with white torn-paper frame */}
      <div className="p-3 pb-0">
        <div
          className="relative bg-[#f5f0e6] dark:bg-stone-300 p-2 shadow-md"
          style={{ borderRadius: "4px 6px 3px 7px / 6px 3px 7px 4px" }}
        >
          <div className="relative aspect-[4/5] bg-[#dcdada] dark:bg-stone-500 overflow-hidden">
            {hasPhotos ? (
              <img
                src={images[photoIdx]}
                alt={catchItem.species || "Catch"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Fish className="w-16 h-16 text-[#7a6e61]" />
              </div>
            )}

            {/* Released/Kept stamp — upper right, tilted */}
            <div className="absolute top-3 right-3 flex items-center justify-center w-16 h-16 rounded-full bg-[#3e362e]/85 dark:bg-[#2a241c]/90 text-[#f0ebe0] text-[8px] font-bold uppercase tracking-widest border-[3px] border-[#f0ebe0]/30 dark:border-stone-200/30 shadow-lg -rotate-12 leading-tight text-center">
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
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Title — centered serif */}
      <div className="px-4 pt-3 pb-1 text-center">
        <h3 className="font-serif text-xl font-bold tracking-wide text-[#3e362e] dark:text-[#e8e0d0]">
          {catchItem.species || "Catch"}
        </h3>
      </div>

      {/* Stat grid — 2 columns × 3 rows with rules */}
      <div className="px-4 pb-1">
        <div className="border-t border-[#7a6e61]/50 dark:border-[#a89880]/40" />
        {statRows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-2 border-b border-[#7a6e61]/50 dark:border-[#a89880]/40">
            {row.map((stat, si) => (
              <div
                key={stat.label}
                className={`flex items-baseline gap-1.5 py-1.5 px-1 ${si === 1 ? "border-l border-[#7a6e61]/50 dark:border-[#a89880]/40" : ""}`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#3e362e]/65 dark:text-[#e8e0d0]/65 whitespace-nowrap">
                  {stat.label}
                </span>
                <span className="text-[11px] font-medium text-[#3e362e] dark:text-[#e8e0d0] truncate">
                  {stat.value || "—"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer — location centered */}
      {catchItem.location && (
        <div className="px-4 pt-1.5 pb-2 text-center">
          <p className="font-serif text-sm italic text-[#3e362e] dark:text-[#e8e0d0]">
            {catchItem.location}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 px-3 pb-3 pt-1 mt-auto" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs bg-[#3e362e]/5 dark:bg-white/5 border-[#7a6e61]/30 dark:border-[#a89880]/30" onClick={(e) => { e.stopPropagation(); onEdit(catchItem); }}>
          <Pencil className="w-3 h-3 mr-1" /> Edit
        </Button>
        <span onClick={(e) => e.stopPropagation()}>
          <ShareButton card={card} photoUrls={images} />
        </span>
        <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive px-2 bg-[#3e362e]/5 dark:bg-white/5 border-[#7a6e61]/30 dark:border-[#a89880]/30" onClick={(e) => { e.stopPropagation(); onDelete(catchItem); }}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}