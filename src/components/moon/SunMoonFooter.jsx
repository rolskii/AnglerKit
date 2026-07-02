import React from "react";
import { Sunrise, Sunset, Sun } from "lucide-react";
import RealisticMoon from "@/components/RealisticMoon";

export default function SunMoonFooter({ sunrise, sunset, zenith, moonPhase, illumination }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      {/* Left: Sun times */}
      <div className="space-y-2.5 text-right pr-1">
        <div className="flex items-center gap-1 justify-end">
          <Sunrise className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] font-medium">{sunrise || "--"}</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[10px] font-medium">{zenith || "--"}</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <Sunset className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="text-[10px] font-medium">{sunset || "--"}</span>
        </div>
      </div>
      {/* Center: Moon */}
      <div className="flex flex-col items-center gap-1 border-x border-border px-2">
        <RealisticMoon illumination={illumination} className="w-14 h-14" />
        <p className="text-[9px] font-semibold text-muted-foreground tracking-wide text-center uppercase leading-tight">
          {moonPhase}
        </p>
        <p className="text-[9px] text-muted-foreground">{illumination}% lit</p>
      </div>
      {/* Right: Moon data */}
      <div className="space-y-2.5 text-left pl-1">
        <div>
          <p className="text-[9px] text-muted-foreground">Illumination</p>
          <p className="text-xs font-semibold">{illumination}%</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground">Phase</p>
          <p className="text-[10px] font-medium leading-tight">{moonPhase}</p>
        </div>
      </div>
    </div>
  );
}