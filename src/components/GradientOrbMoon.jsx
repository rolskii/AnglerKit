import React from "react";

/**
 * A smooth gradient orb moon with a soft glow effect.
 * The lit area reflects the illumination percentage.
 */
export default function GradientOrbMoon({ illumination = 100, className = "" }) {
  const pct = Math.max(0, Math.min(100, illumination));
  const shadowWidth = 100 - pct;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Moon phase">
      <defs>
        <radialGradient id="orbLit" cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f0ecdc" />
          <stop offset="100%" stopColor="#d8d0b8" />
        </radialGradient>
        <radialGradient id="orbDark" cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#2a2a3e" />
          <stop offset="100%" stopColor="#12121f" />
        </radialGradient>
        <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="75%" stopColor="rgba(220,220,255,0)" />
          <stop offset="100%" stopColor="rgba(180,180,220,0.25)" />
        </radialGradient>
        <clipPath id="orbClip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      {/* Outer glow */}
      <circle cx="50" cy="50" r="50" fill="url(#orbGlow)" />

      {/* Dark base (full moon disc in shadow color) */}
      <circle cx="50" cy="50" r="46" fill="url(#orbDark)" />

      {/* Lit portion clipped to moon circle */}
      <g clipPath="url(#orbClip)">
        <rect x="0" y="0" width={pct} height="100" fill="url(#orbLit)" />
      </g>

      {/* Rim highlight */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
    </svg>
  );
}