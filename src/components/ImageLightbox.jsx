import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Full-screen photo viewer. Opens above dialogs (z-[6000]). Click the
// backdrop or the close button to dismiss; arrow keys / chevrons move
// between photos when more than one is available.
export default function ImageLightbox({ images = [], index = 0, onClose, onIndex }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && images.length > 1) onIndex((index + 1) % images.length);
      else if (e.key === "ArrowLeft" && images.length > 1) onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }}
            className="absolute left-2 sm:left-4 text-white/80 hover:text-white p-2"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length); }}
            className="absolute right-2 sm:right-4 text-white/80 hover:text-white p-2"
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}
      <img
        src={images[index]}
        alt={`Photo ${index + 1}`}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}