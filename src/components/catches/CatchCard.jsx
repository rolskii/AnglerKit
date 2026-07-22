import React, { useRef, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { getItemImages } from "@/components/ImageGallery";
import { useUnits } from "@/lib/unitsContext";

const CRAFT = "#c9b9a6";
const CRAFT_DARK = "#4a3f33";
const INK = "#3e362e";
const INK_LIGHT = "#7a6e61";
const RULE = "#7a6e61";
const PAPER = "#f5f0e6";

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
      { label: "LENGTH", value: catchItem.length != null ? `${catchItem.length} in` : null },
      { label: "GIRTH", value: catchItem.girth != null ? `${catchItem.girth} in` : null },
    ],
    [
      { label: "WEIGHT", value: catchItem.weight != null ? formatWeight(catchItem.weight) : null },
      { label: "FLY", value: catchItem.fly_used },
    ],
    [
      { label: "WATER", value: catchItem.water_temp != null ? `${catchItem.water_temp}°` : null },
      { label: "DATE", value: fmtDate(catchItem.date) },
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
      className="overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-shadow rounded-lg"
      style={{ background: CRAFT, borderColor: INK_LIGHT + "55", color: INK }}
    >
      {/* Photo with white torn-paper frame */}
      <div style={{ padding: "12px 12px 0 12px" }}>
        <div
          className="relative p-2 shadow-md"
          style={{ background: PAPER, borderRadius: "4px 6px 3px 7px / 6px 3px 7px 4px" }}
        >
          <div className="relative aspect-[4/5] overflow-hidden" style={{ background: "#dcdada" }}>
            {hasPhotos ? (
              <img
                src={images[photoIdx]}
                alt={catchItem.species || "Catch"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Fish className="w-16 h-16" style={{ color: INK_LIGHT }} />
              </div>
            )}

            {/* Released/Kept stamp — upper right, tilted ~45deg */}
            <div
              className="absolute flex items-center justify-center rounded-full shadow-lg"
              style={{
                top: "10px",
                right: "10px",
                width: "62px",
                height: "62px",
                background: INK + "d9",
                color: "#f0ebe0",
                border: "3px solid #f0ebe04d",
                boxShadow: "inset 0 0 0 2px #f0ebe033, 0 2px 6px rgba(0,0,0,0.4)",
                transform: "rotate(-45deg)",
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
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

      {/* Title — centered typewriter */}
      <div className="px-4 pt-3 pb-1 text-center">
        <h3 className="font-mono text-xl font-bold tracking-wide" style={{ color: INK }}>
          {catchItem.species || "Catch"}
        </h3>
      </div>

      {/* Stat grid — 2 columns × 3 rows with rules */}
      <div className="px-4 pb-1">
        <div style={{ borderTop: `1px solid ${RULE}` }} />
        {statRows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-2" style={{ borderBottom: `1px solid ${RULE}` }}>
            {row.map((stat, si) => (
              <div
                key={stat.label}
                className="flex items-baseline gap-1.5 py-1.5 px-1"
                style={si === 1 ? { borderLeft: `1px solid ${RULE}` } : undefined}
              >
                <span
                  className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: INK + "aa" }}
                >
                  {stat.label}
                </span>
                <span className="text-[11px] font-medium truncate" style={{ color: INK }}>
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
          <p className="font-mono text-sm italic" style={{ color: INK }}>
            {catchItem.location}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 px-3 pb-3 pt-1 mt-auto" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" style={{ background: INK + "0d", borderColor: INK_LIGHT + "55" }} onClick={(e) => { e.stopPropagation(); onEdit(catchItem); }}>
          <Pencil className="w-3 h-3 mr-1" /> Edit
        </Button>
        <span onClick={(e) => e.stopPropagation()}>
          <ShareButton card={card} photoUrls={images} />
        </span>
        <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive px-2" style={{ background: INK + "0d", borderColor: INK_LIGHT + "55" }} onClick={(e) => { e.stopPropagation(); onDelete(catchItem); }}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}