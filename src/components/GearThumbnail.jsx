import React from "react";
import { getItemImages } from "@/components/ImageGallery";

export default function GearThumbnail({ item, title, subtitle, details = [], onClick }) {
  const images = getItemImages(item);
  const primaryImage = images[0];
  const validDetails = details.filter(Boolean);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-muted relative">
        {primaryImage ? (
          <img src={primaryImage} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No photo
          </div>
        )}
        {item.condition && (
          <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            {item.condition}
          </span>
        )}
      </div>
      <div className="p-2 space-y-0.5">
        <div className="font-medium text-sm truncate">{title || "—"}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        )}
        {validDetails.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground pt-0.5">
            {validDetails.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}