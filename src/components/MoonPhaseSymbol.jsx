import React from "react";

export default function MoonPhaseSymbol({ phase, className = "" }) {
  if (!phase) return null;

  const illum = phase.illumination || 0;

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{
        background: `conic-gradient(
          #1a1a1a 0deg,
          #1a1a1a ${illum * 3.6}deg,
          #e5e5e5 ${illum * 3.6}deg,
          #e5e5e5 360deg
        )`,
        opacity: 0.85,
      }}
      aria-label={`${phase.name} — ${illum}% illuminated`}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-200 to-slate-300" style={{ opacity: 0.15 }} />
    </div>
  );
}