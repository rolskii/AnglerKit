import React from "react";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, Waves, Anchor, Droplets } from "lucide-react";

// Toggle panel for map data layers. Access points and lake depth contours are
// border-blind: the backend detects the region (province or US state) under
// the map centre and serves that region's official open-data layer, so one
// toggle covers all of Canada and the USA as coverage is discovered.
export default function GeoHubLayersPanel({
  open,
  onOpenChange,
  showAccessPoints,
  onToggleAccessPoints,
  showAraLines,
  onToggleAra,
  showSeaMap,
  onToggleSeaMap,
  showBathy,
  onToggleBathy,
  loading,
  araZoomHint,
  bathyZoomHint,
}) {
  if (!open) return null;

  return (
    <>
      <div className="absolute inset-0 z-[540]" onClick={() => onOpenChange(false)} />
      <div className="absolute top-16 right-3 z-[550] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-heading font-semibold text-sm">Fishing Data Layers</h3>
            <p className="text-[11px] text-muted-foreground">Region-aware open data</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2">
          <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Fishing Access Points
          </p>
          <div className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-accent/5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500">
              <span className="block w-3 h-3 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Access Points</span>
                <Switch checked={showAccessPoints} onCheckedChange={onToggleAccessPoints} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Boat launches &amp; shore access — official open data, auto-detected for the region
                on screen (Canada &amp; USA). Coverage varies by region.
              </p>
              {loading?.access && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </p>
              )}
            </div>
          </div>

          <div className="my-2 mx-2 border-t border-border" />

          <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Lake Depth Contours
          </p>
          <div className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-accent/5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Lake Depth Contours</span>
                <Switch checked={showBathy} onCheckedChange={onToggleBathy} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Depth contour lines in feet — auto-detected per region. Coverage varies by lake and
                by state or province.
              </p>
              {bathyZoomHint && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug mt-1">
                  Zoom in closer to load depth contours.
                </p>
              )}
              {loading?.bathy && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </p>
              )}
            </div>
          </div>

          <div className="my-2 mx-2 border-t border-border" />

          <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Waterbody Lines (Ontario)
          </p>
          <div className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-accent/5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Waves className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Aquatic Resource Lines</span>
                <Switch checked={showAraLines} onCheckedChange={onToggleAra} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                River &amp; stream segments with species info.
              </p>
              {araZoomHint && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug mt-1">
                  Zoom in closer to load waterbody lines.
                </p>
              )}
              {loading?.ara && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </p>
              )}
            </div>
          </div>

          <div className="my-2 mx-2 border-t border-border" />

          <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Nautical Charts
          </p>
          <div className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-accent/5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
              <Anchor className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">OpenSeaMap Seamarks</span>
                <Switch checked={showSeaMap} onCheckedChange={onToggleSeaMap} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Buoys, lights &amp; harbour markers (© OpenSeaMap contributors).
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}