import React from "react";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, Waves } from "lucide-react";

// Toggle panel for Ontario GeoHub fishing datasets overlaid on the map.
export default function GeoHubLayersPanel({
  open,
  onOpenChange,
  showFishingAccess,
  showAraLines,
  onToggleFishing,
  onToggleAra,
  loading,
  araZoomHint,
}) {
  if (!open) return null;
  return (
    <>
      <div className="absolute inset-0 z-[540]" onClick={() => onOpenChange(false)} />
      <div className="absolute top-16 right-3 z-[550] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-heading font-semibold text-sm">Ontario Fishing Data</h3>
            <p className="text-[11px] text-muted-foreground">Source: Ontario GeoHub (LIO open data)</p>
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
          {/* Fishing Access Points */}
          <div className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-accent/5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500">
              <span className="block w-3 h-3 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Fishing Access Points</span>
                <Switch checked={showFishingAccess} onCheckedChange={onToggleFishing} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Shoreline, dock &amp; pier access sites.
              </p>
              {loading?.fishing && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                </p>
              )}
            </div>
          </div>

          {/* ARA Line Segments */}
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
        </div>
      </div>
    </>
  );
}