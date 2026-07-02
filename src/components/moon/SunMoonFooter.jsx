import React from "react";
import { Sunrise, Sunset, Sun } from "lucide-react";
import WeatherGlyph from "@/components/weather/WeatherGlyph";

export default function SunMoonFooter({ sunrise, sunset, zenith, moonPhase, illumination }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] gap-3 items-center">
      <div />
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
        <WeatherGlyph code={0} isNight={true} className="w-14 h-14" />
        <p className="text-xs text-muted-foreground">{illumination}% lit</p>
      </div>
      {/* Right: Moon data */}
      <div className="space-y-1 text-left">
        <div className="flex items-baseline gap-1">
          <p className="text-sm font-semibold">{illumination}%</p>
          <p className="text-xs text-muted-foreground">Illumination</p>
        </div>
        <p className="text-sm font-medium leading-tight whitespace-nowrap">{moonPhase}</p>
      </div>
    </div>
  );
}