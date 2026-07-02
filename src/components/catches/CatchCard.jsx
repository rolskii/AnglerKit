import React, { useRef } from "react";
import ShareButton from "@/components/ShareButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pencil, Trash2, MapPin, Calendar, Ruler, Scale, Thermometer,
  Waves, Fish, Disc, Activity, CloudSun,
} from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";

export default function CatchCard({ catchItem, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const images = getItemImages(catchItem);
  const hasImage = images.length > 0;

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

  // Key stats — only show ones with values
  const stats = [
    { icon: Ruler, label: "Length", value: catchItem.length, unit: "in" },
    { icon: Activity, label: "Girth", value: catchItem.girth, unit: "in" },
    { icon: Scale, label: "Weight", value: catchItem.weight, unit: "lb" },
    { icon: Thermometer, label: "Water", value: catchItem.water_temp, unit: "°" },
  ].filter((s) => s.value != null && s.value !== "");

  // Gear info
  const gear = [
    { icon: Fish, label: "Fly", value: catchItem.fly_used },
    { icon: Activity, label: "Rod", value: catchItem.rod },
    { icon: Disc, label: "Reel", value: catchItem.reel },
    { icon: Waves, label: "Line", value: catchItem.line },
  ].filter((g) => g.value);

  return (
    <Card ref={cardRef} className="overflow-hidden flex flex-col gap-0 hover:shadow-lg transition-shadow">
      {/* Hero image with overlay */}
      {hasImage && (
        <div className="relative">
          <ImageGallery
            images={images}
            featuredLabel={catchItem.species || "Catch"}
            featuredSubtitle="Catch"
            featuredLink={`/catches/${catchItem.id}`}
          />
        </div>
      )}

      {/* Header section */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-2xl font-bold tracking-tight">{catchItem.species}</h2>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${catchItem.released ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {catchItem.released ? "Released" : "Kept"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5 flex-wrap">
              {fmtDate(catchItem.date) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {fmtDate(catchItem.date)}
                </span>
              )}
              {catchItem.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {catchItem.location}
                </span>
              )}
            </div>
          </div>
          {!hasImage && (
            <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Fish className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Key stats tiles */}
      {stats.length > 0 && (
        <div className="px-5 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center rounded-xl bg-muted/60 py-3 px-1 text-center">
                <s.icon className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="font-heading font-bold text-lg leading-none">{s.value}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{s.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gear section */}
      {gear.length > 0 && (
        <div className="px-5 pb-4">
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {gear.map((g) => (
              <div key={g.label} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <g.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground w-12 shrink-0">{g.label}</span>
                <span className="text-sm font-medium truncate">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditions */}
      {catchItem.conditions && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3.5 py-2.5">
            <CloudSun className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">Conditions</span>
            <span className="text-sm font-medium truncate">{catchItem.conditions}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {catchItem.notes && (
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-muted/40 px-4 py-3 border-l-4 border-primary/40">
            <p className="text-sm text-muted-foreground italic">{catchItem.notes}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-5 pt-1" data-html2canvas-ignore="true">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(catchItem)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <ShareButton card={card} photoUrls={images} />
        <div className="w-px self-stretch bg-border mx-1" aria-hidden="true" />
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(catchItem)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}