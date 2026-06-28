import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Calendar, Fish } from "lucide-react";
import ImageGallery, { getItemImages } from "@/components/ImageGallery";

export default function CatchCard({ catchItem, onEdit, onDelete }) {
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };

  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <ImageGallery images={getItemImages(catchItem)} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold">{catchItem.species}</h3>
            {catchItem.released && <Badge variant="secondary" className="text-xs">Released</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
            {fmtDate(catchItem.date) && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {fmtDate(catchItem.date)}
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Detail label="Length" value={catchItem.length ? `${catchItem.length} in` : null} />
        <Detail label="Weight" value={catchItem.weight ? `${catchItem.weight} lb` : null} />
        <Detail label="Fly" value={catchItem.fly_used} />
        <Detail label="Water Temp" value={catchItem.water_temp != null ? `${catchItem.water_temp}°` : null} />
        <Detail label="Rod" value={catchItem.rod} />
        <Detail label="Reel" value={catchItem.reel} />
        <Detail label="Line" value={catchItem.line} />
        <Detail label="Conditions" value={catchItem.conditions} />
      </div>

      {catchItem.notes && (
        <p className="text-sm text-muted-foreground italic border-t border-border pt-2">{catchItem.notes}</p>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(catchItem)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(catchItem)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value || "—"}</span>
    </div>
  );
}