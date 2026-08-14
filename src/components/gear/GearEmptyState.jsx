import React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

// Photo empty-state card shown on a gear list page when that category has
// zero items — same visual treatment as the Home dashboard's empty state
// (FeaturedImage.jsx), just shorter/wider to fit a list page's header area
// and swapped per category (photo, icon, headline).
export default function GearEmptyState({ image, icon: Icon, headline, subtext }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-scan-gear"))}
      className="block w-full text-left"
    >
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <div className="relative h-56 md:h-72 flex items-end justify-center overflow-hidden">
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/5" />
          <span className="absolute top-3 left-3 text-xs font-bold tracking-wide px-2 py-1 rounded-full bg-black/35 backdrop-blur-sm text-white">
            Get Started
          </span>
          <div className="relative z-10 flex flex-col items-center text-center gap-2.5 px-8 md:px-12 pb-5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-white text-lg md:text-2xl font-heading font-bold tracking-tight">
                {headline}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {subtext}
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
  );
}
