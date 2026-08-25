import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Fish, ExternalLink, ImageOff } from "lucide-react";

// Detail dialog for a tapped fishing/boating access point.
// Consumes a normalized shape so it works across provincial sources
// (Ontario GeoHub, Manitoba Waterbody Entry Points, Nova Scotia Boat Launches, …).
export default function AccessPointDialog({ open, onOpenChange, point }) {
  if (!point) return null;
  const p = point;
  const rows = Array.isArray(p.rows) ? p.rows.filter((r) => r && r.value) : [];
  const photos = Array.isArray(p.photos) ? p.photos.filter(Boolean) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{p.name || "Fishing Access Point"}</DialogTitle>
              <DialogDescription>{p.source || "Fishing Access Point"}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{r.label}:</span>
                  <span className="font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {p.comments && (
            <p className="text-sm text-muted-foreground italic">{p.comments}</p>
          )}

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <ImageOff className="w-3.5 h-3.5" /> Photo {i + 1}
                </a>
              ))}
            </div>
          )}

          {p.infoUrl && (
            <a href={p.infoUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> More info
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}