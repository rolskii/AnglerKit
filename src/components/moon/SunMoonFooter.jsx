import React from "react";
import { Sunrise, Sunset, Sun } from "lucide-react";
import RealisticMoon from "@/components/RealisticMoon";

export default function SunMoonFooter({ sunrise, sunset, zenith, moonPhase, illumination }) {
  return (
    <div className="grid grid-cols-[2fr_auto_1fr] gap-2 items-center">
      {/* Left: Sun times */}
      <div className="space-y-1 grid grid-cols-[1fr_auto_auto] items-center gap-x-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap text-right">Sunrise</span>
        <Sunrise className="w-5 h-5 text-amber-400 shrink-0" />
        <span className="text-sm font-medium text-left whitespace-nowrap">{sunrise || "--"}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap text-right">Solar Noon</span>
        <Sun className="w-5 h-5 text-amber-500 shrink-0" />
        <span className="text-sm font-medium text-left whitespace-nowrap">{zenith || "--"}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap text-right">Sunset</span>
        <Sunset className="w-5 h-5 text-orange-500 shrink-0" />
        <span className="text-sm font-medium text-left whitespace-nowrap">{sunset || "--"}</span>
      </div>
      {/* Center: Moon */}
      <div className="flex flex-col items-center gap-1.5 border-l border-border px-3">
        <RealisticMoon illumination={illumination} className="w-12 h-12" />
        <p className="text-xs text-muted-foreground">{illumination}% lit</p>
      </div>
      {/* Right: Moon data */}
      <div className="space-y-1 text-left pl-1">
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