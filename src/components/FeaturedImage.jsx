import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Camera, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import gearEmptyHero from "@/assets/gear-empty-hero.jpg";

const entityRoutes = {
  FlyLine: "/lines",
  Reel: "/reels",
  Rod: "/rods",
  Lure: "/lures",
  MiscItem: "/misc",
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

  const labelFor = (type, item) => {
    const join = (parts) => parts.filter(Boolean).join(" ").trim();
    if (type === "Rod") {
      const parts = [item.brand, item.model, item.length];
      if (item.line_weight) parts.push(`${item.line_weight}wt`);
      return join(parts) || item.name || "Rod";
    }
    if (type === "Reel") {
      return join([item.brand, item.model, item.size]) || item.name || "Reel";
    }
    if (type === "Lure") {
      return join([item.brand, item.model, item.size, item.colour]) || item.name || "Lure";
    }
    if (type === "MiscItem") {
      return join([item.brand, item.model]) || item.name || "Misc";
    }
    if (type === "Catch") {
      const parts = [item.species];
      if (item.length) parts.push(`${item.length}"`);
      if (item.location) parts.push(item.location);
      return join(parts) || "Catch";
    }
    return item.name || type;
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
            allImages.push({
              image_url: img,
              label: labelFor(type, item),
              subtitle: entityLabels[type],
              link: entityRoutes[type],
            });
          }
        }
      } catch (e) {}
    }
    return allImages;
  };

  const loadFeatured = async (forceNew = false) => {
    setLoading(true);
    const isExcluded = (img) => img && img.link === "/lines";

    try {
      const userStored = localStorage.getItem("featuredImageUser");
      if (userStored && !forceNew) {
        const parsed = JSON.parse(userStored);
        if (!isExcluded(parsed)) {
          setFeatured(parsed);
          setLoading(false);
          return;
        }
        localStorage.removeItem("featuredImageUser");
      }
    } catch {}

    try {
      if (!forceNew) {
        const dailyStored = localStorage.getItem("featuredImageDaily");
        if (dailyStored) {
          const parsed = JSON.parse(dailyStored);
          if (parsed.date === todayStr() && parsed.image && !isExcluded(parsed.image)) {
            setFeatured(parsed.image);
            setLoading(false);
            return;
          }
          localStorage.removeItem("featuredImageDaily");
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
    const onChanged = () => loadFeatured(true);
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

  if (!featured) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-scan-gear"))}
          className="block w-full text-left"
        >
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="relative aspect-square flex items-end justify-center overflow-hidden">
              <img
                src={gearEmptyHero}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/5" />
              <span className="absolute top-3 left-3 text-xs font-bold tracking-wide px-2 py-1 rounded-full bg-black/35 backdrop-blur-sm text-white">
                Get Started
              </span>
              <div className="relative z-10 flex flex-col items-center text-center gap-3 px-8 md:px-12 pb-5">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-white text-xl md:text-2xl font-heading font-bold tracking-tight">
                    Add your first piece of gear
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    Snap a photo and we'll fill in the details for you
                  </p>
                </div>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary bg-white rounded-full px-4 py-2">
                  <Sparkles className="w-4 h-4" />
                  Scan Gear
                </span>
              </div>
            </div>
          </Card>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => loadFeatured(true)} className="block w-full text-left">
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
      </button>
    </div>
  );
}