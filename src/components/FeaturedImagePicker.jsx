import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

const entityConfigs = [
  { entity: "FlyLine", label: "Lines", link: "/gear/lines", nameField: (item) => `${item.brand || ""} ${item.model || ""}`.trim() || "Lines" },
  { entity: "Reel", label: "Reel", link: "/gear/reels", nameField: (item) => [item.brand, item.model, item.size].filter(Boolean).join(" ") || "Reel" },
  { entity: "Rod", label: "Rod", link: "/gear/rods", nameField: (item) => [item.brand, item.model, item.length, item.line_weight ? `${item.line_weight}wt` : null].filter(Boolean).join(" ") || "Rod" },
  { entity: "Lure", label: "Lure", link: "/gear/lures", nameField: (item) => `${item.brand || ""} ${item.name || ""}`.trim() || "Lure" },
  { entity: "MiscItem", label: "Misc", link: "/gear/misc", nameField: (item) => `${item.brand || ""} ${item.name || ""}`.trim() || "Item" },
  { entity: "Catch", label: "Fish Log", link: "/catches", nameField: (item) => [item.species, item.length != null ? `${item.length}"` : null, item.location].filter(Boolean).join(" ") || "Catch" },
];

export default function FeaturedImagePicker({ open, onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchAll = async () => {
      setLoading(true);
      const allImages = [];
      for (const cfg of entityConfigs) {
        try {
          const items = await base44.entities[cfg.entity].list("-created_date", 500);
          for (const item of items) {
            const imgs = item.images || (item.image_url ? [item.image_url] : []);
            for (const img of imgs) {
              allImages.push({
                image_url: img,
                label: cfg.nameField(item),
                subtitle: cfg.label,
                link: cfg.link,
              });
            }
          }
        } catch (e) {}
      }
      setImages(allImages);
      setLoading(false);
    };
    fetchAll();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Featured Image</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No gear images found. Add photos to your gear items first.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(img)}
                className="relative aspect-square rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all"
              >
                <img src={img.image_url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-semibold truncate">{img.label}</p>
                  <p className="text-white/80 text-[10px]">{img.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}