import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { getStarredPhotos, toggleStarredPhoto } from "@/lib/featuredImage";
import ImageLightbox from "@/components/ImageLightbox";

export function getItemImages(item) {
  if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images;
  if (item.image_url) return [item.image_url];
  return [];
}

// Photo gallery for a gear/catch card. Each photo can be starred individually:
// starred photos join the select group the Home "Featured Photo" rotates through.
export default function ImageGallery({ images = [], featuredLabel, featuredSubtitle, featuredLink }) {
  const [active, setActive] = useState(0);
  const [starredUrls, setStarredUrls] = useState([]);
  const [lightbox, setLightbox] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      const list = await getStarredPhotos();
      if (!cancelled) setStarredUrls(list.map((p) => p.image_url));
    };
    update();
    window.addEventListener("featured-image-changed", update);
    return () => {
      cancelled = true;
      window.removeEventListener("featured-image-changed", update);
    };
  }, []);
  if (!images || images.length === 0) return null;

  const handleToggleStar = async (url) => {
    // Optimistic toggle — reverts if the save fails.
    const wasStarred = starredUrls.includes(url);
    setStarredUrls(wasStarred ? starredUrls.filter((u) => u !== url) : [...starredUrls, url]);
    try {
      await toggleStarredPhoto({
        image_url: url,
        label: featuredLabel || "Gear",
        subtitle: featuredSubtitle || "",
        link: featuredLink || "",
      });
    } catch {
      setStarredUrls(wasStarred ? [...starredUrls, url] : starredUrls.filter((u) => u !== url));
    }
  };

  const isStarred = (url) => starredUrls.includes(url);

  return (
    <div className="space-y-2">
      <div className="relative">
        <img
          src={images[active]}
          alt={`Photo ${active + 1}`}
          onClick={() => setLightbox(true)}
          className="w-full max-h-[60vh] object-contain rounded-md bg-muted/30 cursor-zoom-in"
        />
        {featuredLabel && (
          <button
            type="button"
            onClick={() => handleToggleStar(images[active])}
            className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full px-2.5 py-1 hover:bg-black/70 transition-colors"
            title={isStarred(images[active]) ? "Remove from featured photos" : "Star to feature on Home"}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred(images[active]) ? "text-yellow-400 fill-yellow-400" : ""}`} />
            {isStarred(images[active]) ? "Starred" : "Star"}
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
                    handleToggleStar(url);
                  }}
                  className={`absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center w-6 h-6 ${isStarred(url) ? "bg-yellow-400 text-primary-foreground" : "bg-primary text-primary-foreground"} rounded-full shadow-md hover:bg-primary/90 transition-colors`}
                  title={isStarred(url) ? "Remove from featured photos" : "Star to feature on Home"}
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred(url) ? "fill-primary" : ""}`} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {lightbox && (
        <ImageLightbox
          images={images}
          index={active}
          onClose={() => setLightbox(false)}
          onIndex={setActive}
        />
      )}
    </div>
  );
}