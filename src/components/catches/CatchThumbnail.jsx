import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { getItemImages } from "@/components/ImageGallery";

export default function CatchThumbnail({ catchItem }) {
  const navigate = useNavigate();
  const images = getItemImages(catchItem);
  const primaryImage = images[0];

  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" }); }
    catch { return d; }
  };

  return (
    <div
      onClick={() => navigate(`/catches/${catchItem.id}`)}
      className="cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-muted relative">
        {primaryImage ? (
          <img src={primaryImage} alt={catchItem.species || "Catch"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No photo
          </div>
        )}
        {catchItem.released && (
          <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            Released
          </span>
        )}
      </div>
      <div className="p-2 space-y-0.5">
        <div className="font-medium text-sm truncate">{catchItem.species || "—"}</div>
        {fmtDate(catchItem.date) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{fmtDate(catchItem.date)}</span>
          </div>
        )}
        {catchItem.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{catchItem.location}</span>
          </div>
        )}
        <div className="flex gap-2 text-xs text-muted-foreground pt-0.5">
          {catchItem.length != null && <span>{catchItem.length}″</span>}
          {catchItem.weight != null && <span>{catchItem.weight} lb</span>}
        </div>
      </div>
    </div>
  );
}