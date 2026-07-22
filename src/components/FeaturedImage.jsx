import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

const entityRoutes = {
  FlyLine: "/gear/lines",
  Reel: "/gear/reels",
  Rod: "/gear/rods",
  Lure: "/gear/lures",
  MiscItem: "/gear/misc",
  Catch: "/catches",
};

const entityLabels = {
  FlyLine: "Lines",
  Reel: "Reel",
  Rod: "Rod",
  Lure: "Lure",
  MiscItem: "Misc",
  Catch: "Fish Log",
};

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function FeaturedImage() {
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labelColor, setLabelColor] = useState("white");
  const imgRef = useRef(null);
  const prevUrlRef = useRef(null);

  const computeBrightness = (img) => {
    try {
      const canvas = document.createElement("canvas");
      const w = 60, h = 60;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avg = sum / (data.length / 4);
      return avg >= 128 ? "black" : "white";
    } catch {
      return "white";
    }
  };

  const fetchAllGearImages = async () => {
    const entityTypes = ["Reel", "Rod", "Lure", "MiscItem", "Catch"];
    const allImages = [];
    for (const type of entityTypes) {
      try {
        const items = await base44.entities[type].list("-created_date", 500);
        for (const item of items) {
          const imgs = item.images || (item.image_url ? [item.image_url] : []);
          for (const img of imgs) {
            let label;
            if (type === "Catch") {
              label = [
                item.species,
                item.length != null ? `${item.length}"` : null,
                item.location,
              ].filter(Boolean).join(" ") || "Catch";
            } else {
              label = `${item.brand || ""} ${item.name || ""}`.trim() || type;
            }
            allImages.push({
              image_url: img,
              label,
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
    const isExcluded = (img) => img && img.link === "/gear/lines";

    try {
      const userStored = localStorage.getItem("featuredImageUser");
      if (userStored) {
        const parsed = JSON.parse(userStored);
        if (!isExcluded(parsed)) {
          prevUrlRef.current = parsed.image_url;
          setFeatured(parsed);
          setLoading(false);
          return;
        }
        localStorage.removeItem("featuredImageUser");
      }
    } catch {}

    try {
      const dailyStored = localStorage.getItem("featuredImageDaily");
      if (dailyStored) {
        const parsed = JSON.parse(dailyStored);
        if (parsed.date === todayStr() && parsed.image && !isExcluded(parsed.image)) {
          prevUrlRef.current = parsed.image.image_url;
          setFeatured(parsed.image);
          setLoading(false);
          return;
        }
        localStorage.removeItem("featuredImageDaily");
      }
      const allImages = await fetchAllGearImages();
      if (allImages.length === 0) { setLoading(false); return; }
      // Exclude the currently-shown image so refresh always rotates to a different photo
      const pool = prevUrlRef.current
        ? allImages.filter(img => img.image_url !== prevUrlRef.current)
        : allImages;
      const pickFrom = pool.length > 0 ? pool : allImages;
      const random = pickFrom[Math.floor(Math.random() * pickFrom.length)];
      prevUrlRef.current = random.image_url;
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
            <img
              ref={imgRef}
              src={featured.image_url}
              alt={featured.label}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onLoad={(e) => setLabelColor(computeBrightness(e.target))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className={`absolute top-3 left-3 text-xs font-bold tracking-wide px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm ${labelColor === "black" ? "text-black" : "text-white"}`}>
              Featured Photo
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
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