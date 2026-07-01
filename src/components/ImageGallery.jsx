import React, { useState } from "react";
import { Star } from "lucide-react";
import { setFeaturedImage } from "@/lib/featuredImage";

export function getItemImages(item) {
  if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images;
  if (item.image_url) return [item.image_url];
  return [];
}

export default function ImageGallery({ images = [], featuredLabel, featuredSubtitle, featuredLink }) {
  const [active, setActive] = useState(0);
  if (!images || images.length === 0) return null;

  const handleSetFeatured = () => {
    setFeaturedImage({
      image_url: images[active],
      label: featuredLabel || "Gear",
      subtitle: featuredSubtitle || "",
      link: featuredLink || "/gear/lines",
    });
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <img src={images[active]} alt={`Photo ${active + 1}`} className="w-full max-h-[60vh] object-contain rounded-md bg-muted/30" />
        {featuredLabel && (
          <button
            type="button"
            onClick={handleSetFeatured}
            className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full px-2.5 py-1 hover:bg-black/70 transition-colors"
            title="Set as featured image"
          >
            <Star className="w-3.5 h-3.5" />
            Feature
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {images.map((url, idx) => (
            <div key={idx} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setActive(idx)}
                className={`block w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${idx === active ? "border-primary" : "border-border"}`}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
              {featuredLabel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setFeaturedImage({
                      image_url: url,
                      label: featuredLabel || "Gear",
                      subtitle: featuredSubtitle || "",
                      link: featuredLink || "/gear/lines",
                    });
                  }}
                  className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
                  title="Set this image as featured"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}