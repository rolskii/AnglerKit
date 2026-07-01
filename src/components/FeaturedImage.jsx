import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, X, Shuffle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FeaturedImagePicker from "@/components/FeaturedImagePicker";

const entityRoutes = {
  FlyLine: "/gear/lines",
  Reel: "/gear/reels",
  Rod: "/gear/rods",
  Lure: "/gear/lures",
  MiscItem: "/gear/misc",
};

const entityLabels = {
  FlyLine: "Line",
  Reel: "Reel",
  Rod: "Rod",
  Lure: "Lure",
  MiscItem: "Misc",
};

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function FeaturedImage() {
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isUserSelected, setIsUserSelected] = useState(false);

  const fetchAllGearImages = async () => {
    const entityTypes = ["FlyLine", "Reel", "Rod", "Lure", "MiscItem"];
    const allImages = [];
    for (const type of entityTypes) {
      try {
        const items = await base44.entities[type].list("-created_date", 500);
        for (const item of items) {
          const imgs = item.images || (item.image_url ? [item.image_url] : []);
          for (const img of imgs) {
            allImages.push({
              image_url: img,
              label: type === "FlyLine"
                ? `${item.brand || ""} ${item.model || ""}`.trim() || "Line"
                : (item.name || type),
              subtitle: entityLabels[type],
              link: entityRoutes[type],
            });
          }
        }
      } catch (e) {}
    }
    return allImages;
  };

  const loadFeatured = async () => {
    setLoading(true);
    try {
      const userStored = localStorage.getItem("featuredImageUser");
      if (userStored) {
        setFeatured(JSON.parse(userStored));
        setIsUserSelected(true);
        setLoading(false);
        return;
      }
    } catch {}

    setIsUserSelected(false);
    try {
      const dailyStored = localStorage.getItem("featuredImageDaily");
      if (dailyStored) {
        const parsed = JSON.parse(dailyStored);
        if (parsed.date === todayStr() && parsed.image) {
          setFeatured(parsed.image);
          setLoading(false);
          return;
        }
      }
      const allImages = await fetchAllGearImages();
      if (allImages.length === 0) { setLoading(false); return; }
      const random = allImages[Math.floor(Math.random() * allImages.length)];
      localStorage.setItem("featuredImageDaily", JSON.stringify({ date: todayStr(), image: random }));
      setFeatured(random);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeatured(); }, []);

  const handleSelect = (img) => {
    localStorage.setItem("featuredImageUser", JSON.stringify(img));
    setFeatured(img);
    setIsUserSelected(true);
    setPickerOpen(false);
  };

  const handleClear = () => {
    localStorage.removeItem("featuredImageUser");
    setIsUserSelected(false);
    loadFeatured();
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="h-48 md:h-64 bg-muted animate-pulse" />
      </Card>
    );
  }

  if (!featured) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg md:text-xl font-heading font-semibold tracking-tight">Featured</h2>
        <div className="flex items-center gap-3">
          {isUserSelected ? (
            <button onClick={handleClear} className="flex items-center gap-1 text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          ) : (
            <button onClick={loadFeatured} className="flex items-center gap-1 text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground">
              <Shuffle className="w-3.5 h-3.5" /> Shuffle
            </button>
          )}
          <button onClick={() => setPickerOpen(true)} className="flex items-center gap-1 text-xs md:text-sm font-semibold text-primary hover:underline">
            <Star className="w-3.5 h-3.5" /> Choose
          </button>
        </div>
      </div>
      <Link to={featured.link || "/gear/lines"}>
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
          <div className="relative h-48 md:h-64 bg-muted">
            <img src={featured.image_url} alt={featured.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
              <span className="inline-block text-white/80 text-[10px] md:text-xs font-semibold uppercase tracking-wide bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 mb-1">
                {featured.subtitle}
              </span>
              <h3 className="text-white text-xl md:text-2xl font-heading font-bold tracking-tight">
                {featured.label}
              </h3>
            </div>
          </div>
        </Card>
      </Link>
      <FeaturedImagePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} />
    </div>
  );
}