import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Waves, Thermometer, Fish, Ruler, Maximize } from "lucide-react";

// Detail dialog for a tapped Ontario GeoHub Aquatic Resource Area (ARA) line segment.
export default function AraLineDialog({ open, onOpenChange, line }) {
  if (!line) return null;
  const p = line.properties || {};
  const name = p.OFFICIAL_WATERBODY_NAME || p.CORPORATE_WATERBODY_NAME || p.OFFICIAL_NAME_LABEL || "Aquatic Resource Line";
  const rows = [
    { label: "Waterbody Type", value: p.WATERBODY_TYPE },
    { label: "Thermal Regime", value: p.THERMAL_REGIME },
    { label: "FMZ", value: p.FISHERIES_MANAGEMENT_ZONE_ID },
    { label: "ARA ID", value: p.ARA_IDENT },
  ].filter((r) => r.value != null && r.value !== "");

  const depths = [];
  if (p.MAXIMUM_DEPTH != null && p.MAXIMUM_DEPTH !== "") depths.push(`Max ${p.MAXIMUM_DEPTH} m`);
  if (p.MEAN_DEPTH != null && p.MEAN_DEPTH !== "") depths.push(`Mean ${p.MEAN_DEPTH} m`);
  if (p.SURFACE_AREA != null && p.SURFACE_AREA !== "") depths.push(`${p.SURFACE_AREA} ha`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>Ontario GeoHub · Aquatic Resource Line</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {p.FISH_SPECIES_SUMMARY ? (
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Fish className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                  Fish Species
                </span>
              </div>
              <p className="text-sm leading-relaxed">{p.FISH_SPECIES_SUMMARY}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No species summary recorded for this segment.</p>
          )}

          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-1.5">
                  {r.label === "Thermal Regime" && <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="text-muted-foreground">{r.label}:</span>
                  <span className="font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {depths.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{depths.join(" · ")}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}