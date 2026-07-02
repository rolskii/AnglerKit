import React from "react";
import { Sunrise, Sunset, Sun } from "lucide-react";
import RealisticMoon from "@/components/RealisticMoon";

export default function SunMoonFooter({ sunrise, sunset, zenith, moonPhase, illumination }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      {/* Left: Sun times */}
      <div className="space-y-1 flex flex-col items-end">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sunrise</span>
          <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">{sunrise || "--"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Solar Noon</span>
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">{zenith || "--"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sunset</span>
          <Sunset className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">{sunset || "--"}</span>
        </div>
      </div>
      {/* Center: Moon */}
      <div className="flex flex-col items-center gap-1.5">
        <RealisticMoon illumination={illumination} className="w-12 h-12" />
        <p className="text-xs text-muted-foreground">{illumination}% lit</p>
      </div>
      {/* Right: Moon data */}
      <div className="space-y-1 text-left">
        <div>
          <p className="text-xs text-muted-foreground">Illumination</p>
          <p className="text-sm font-semibold">{illumination}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Phase</p>
          <p className="text-sm font-medium leading-tight">{moonPhase}</p>
        </div>
      </div>
    </div>
  );
}