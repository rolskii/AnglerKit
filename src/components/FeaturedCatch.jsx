import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FeaturedCatch() {
  const [catchItem, setCatchItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const catches = await base44.entities.Catch.list("-created_date", 500);
        const withImages = catches.filter(c => c.images && c.images.length > 0);
        if (withImages.length === 0) { setLoading(false); return; }
        const random = withImages[Math.floor(Math.random() * withImages.length)];
        setCatchItem(random);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="h-48 md:h-64 bg-muted animate-pulse" />
      </Card>
    );
  }

  if (!catchItem) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const dateLabel = formatDate(catchItem.date);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg md:text-xl font-heading font-semibold tracking-tight">Featured Catch</h2>
        <Link to="/catches" className="text-xs md:text-sm font-semibold text-primary hover:underline">View All</Link>
      </div>
      <Link to={`/catches/${catchItem.id}`}>
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
          <div className="relative h-48 md:h-64 bg-muted">
            <img
              src={catchItem.images[0]}
              alt={catchItem.species || "Featured catch"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 space-y-1">
              <h3 className="text-white text-xl md:text-2xl font-heading font-bold tracking-tight">
                {catchItem.species || "Unknown Species"}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/90 text-xs md:text-sm">
                {catchItem.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {catchItem.location}
                  </span>
                )}
                {dateLabel && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateLabel}
                  </span>
                )}
                {catchItem.weight && (
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    {catchItem.weight} lb
                  </span>
                )}
                {catchItem.length && (
                  <span>{catchItem.length}"</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}