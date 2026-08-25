import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Fish, Car, Accessibility, DollarSign, ExternalLink, ImageOff } from "lucide-react";

const YESNO = (v) => (v && v.toUpperCase() === "Y" ? "Yes" : v && v.toUpperCase() === "N" ? "No" : v || "—");

// Detail dialog for a tapped Ontario GeoHub Fishing Access Point.
export default function AccessPointDialog({ open, onOpenChange, point }) {
  if (!point) return null;
  const p = point;
  const rows = [
    { label: "Type", value: p.FISHING_ACCESS_POINT_TYPE },
    { label: "Ownership", value: p.SITE_OWNERSHIP_TYPE },
    { label: "Parking", value: YESNO(p.PARKING_PRESENCE_FLG) },
    { label: "Accessible", value: YESNO(p.ACCESSIBILITY_FLG) },
    { label: "User Fee", value: YESNO(p.USER_FEE_FLG) },
  ].filter((r) => r.value && r.value !== "—");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>{p.SITE_NAME || "Fishing Access Point"}</DialogTitle>
              <DialogDescription>Ontario GeoHub · Fishing Access Point</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-1.5">
                  {r.label === "Parking" && <Car className="w-3.5 h-3.5 text-muted-foreground" />}
                  {r.label === "Accessible" && <Accessibility className="w-3.5 h-3.5 text-muted-foreground" />}
                  {r.label === "User Fee" && <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="text-muted-foreground">{r.label}:</span>
                  <span className="font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {p.GENERAL_COMMENTS && (
            <p className="text-sm text-muted-foreground italic">{p.GENERAL_COMMENTS}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {p.SITE_PHOTO_URL && (
              <a href={p.SITE_PHOTO_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ImageOff className="w-3.5 h-3.5" /> Site photo
              </a>
            )}
            {p.ADDITIONAL_INFORMATION_URL && (
              <a href={p.ADDITIONAL_INFORMATION_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> More info
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}