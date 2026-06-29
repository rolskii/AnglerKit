import React, { useState } from "react";

export function getItemImages(item) {
  if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images;
  if (item.image_url) return [item.image_url];
  return [];
}

export default function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="space-y-2">
      <img src={images[active]} alt={`Photo ${active + 1}`} className="w-full max-h-[60vh] object-contain rounded-md bg-muted/30" />
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${idx === active ? "border-primary" : "border-border"}`}
            >
              <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}