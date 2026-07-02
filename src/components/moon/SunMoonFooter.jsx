import React from "react";
import { Sunrise, Sunset, Sun } from "lucide-react";
import RealisticMoon from "@/components/RealisticMoon";

export default function SunMoonFooter({ sunrise, sunset, zenith, moonPhase, illumination }) {
  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      <div className="space-y-3 text-right pr-2">
        <div className="flex items-center gap-1.5 justify-end">
          <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs">{sunrise || "--"}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs">{zenith || "--"}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <Sunset className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-xs">{sunset || "--"}</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 border-l border-border pl-2">
        <RealisticMoon illumination={illumination} className="w-14 h-14" />
        <p className="text-[10px] font-semibold text-muted-foreground tracking-wide text-center uppercase">
          {moonPhase}
        </p>
        <p className="text-[10px] text-muted-foreground">{illumination}% lit</p>
      </div>
    </div>
  );
}