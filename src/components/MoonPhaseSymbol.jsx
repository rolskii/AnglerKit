import React from "react";

export default function MoonPhaseSymbol({ phase, className = "" }) {
  if (!phase) return null;

  const illum = phase.illumination / 100;
  const isWaxing = phase.name.includes("Waxing") || phase.name === "First Quarter";
  const isNew = phase.name === "New Moon";
  const isFull = phase.name === "Full Moon";

  const litColor = "#fde68a";
  const darkColor = "#94a3b8";

  if (isNew) {
    return (
      <svg viewBox="-1.1 -1.1 2.2 2.2" className={className} aria-label={phase.name}>
        <circle cx="0" cy="0" r="1" fill={darkColor} opacity="0.3" />
        <circle cx="0" cy="0" r="1" fill="none" stroke={darkColor} strokeWidth="0.08" opacity="0.5" />
      </svg>
    );
  }

  if (isFull) {
    return (
      <svg viewBox="-1.1 -1.1 2.2 2.2" className={className} aria-label={phase.name}>
        <circle cx="0" cy="0" r="1" fill={litColor} />
      </svg>
    );
  }

  const rx = Math.abs(1 - 2 * illum);
  const outerSweep = isWaxing ? 1 : 0;
  const termSweep = isWaxing
    ? (illum > 0.5 ? 1 : 0)
    : (illum > 0.5 ? 0 : 1);

  const path = `M 0 -1 A 1 1 0 0 ${outerSweep} 0 1 A ${rx} 1 0 0 ${termSweep} 0 -1 Z`;

  return (
    <svg viewBox="-1.1 -1.1 2.2 2.2" className={className} aria-label={phase.name}>
      <circle cx="0" cy="0" r="1" fill={darkColor} opacity="0.3" />
      <path d={path} fill={litColor} />
    </svg>
  );
}