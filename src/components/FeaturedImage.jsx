import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

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
        setLoading(false);
        return;
      }
    } catch {}

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

  useEffect(() => {
    loadFeatured();
    const onChanged = () => loadFeatured();
    window.addEventListener("featured-image-changed", onChanged);
    window.addEventListener("storage", onChanged);
    return () => {
      window.removeEventListener("featured-image-changed", onChanged);
      window.removeEventListener("storage", onChanged);
    };
  }, []);

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
      <Link to={featured.link || "/gear/lines"}>
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
          <div className="relative aspect-square bg-muted">
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
    </div>
  );
}