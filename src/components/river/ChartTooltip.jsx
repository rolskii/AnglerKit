import React from 'react';
import { Droplets, Gauge, Clock } from 'lucide-react';

function fmtLevel(v) { return v != null && !isNaN(v) ? `${v.toFixed(2)} m` : '—'; }
function fmtFlow(v) { return v != null && !isNaN(v) ? `${v.toFixed(1)} m³/s` : '—'; }

export default function ChartTooltip({ hourLabel, level, discharge, overlayLabel, overlayLevel, overlayDischarge, hasOverlay }) {
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm space-y-1 min-w-[160px]">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-medium">{hourLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Droplets className="w-3.5 h-3.5 text-primary" />
        <span className="text-muted-foreground">Level</span>
        <span className="font-semibold ml-auto">{fmtLevel(level)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Gauge className="w-3.5 h-3.5 text-primary" />
        <span className="text-muted-foreground">Flow</span>
        <span className="font-semibold ml-auto">{fmtFlow(discharge)}</span>
      </div>
      {hasOverlay && (
        <>
          <div className="border-t border-border/60 my-1" />
          <div className="text-xs font-medium text-red-700">{overlayLabel || 'Historical'}</div>
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-red-700" />
            <span className="text-muted-foreground">Level</span>
            <span className="font-semibold ml-auto">{fmtLevel(overlayLevel)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-red-700" />
            <span className="text-muted-foreground">Flow</span>
            <span className="font-semibold ml-auto">{fmtFlow(overlayDischarge)}</span>
          </div>
        </>
      )}
    </div>
  );
}