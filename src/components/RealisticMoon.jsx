import React from "react";

/**
 * A realistic moon with craters and surface texture, visually
 * shaded to reflect the current illumination percentage.
 */
export default function RealisticMoon({ illumination = 100, className = "" }) {
  const pct = Math.max(0, Math.min(100, illumination));
  // Shadow covers from the right side inward (waxing) — simple approach:
  // the lit fraction = pct% of the diameter from the left edge.
  const shadowWidth = 100 - pct;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Moon phase">
      <defs>
        <radialGradient id="moonSurface" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fdfaf0" />
          <stop offset="55%" stopColor="#e8e0cc" />
          <stop offset="100%" stopColor="#c4b898" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="rgba(255,255,230,0)" />
          <stop offset="100%" stopColor="rgba(255,255,230,0.3)" />
        </radialGradient>
        <clipPath id="moonClip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      {/* Outer glow */}
      <circle cx="50" cy="50" r="50" fill="url(#moonGlow)" />

      {/* Moon body */}
      <circle cx="50" cy="50" r="48" fill="url(#moonSurface)" />

      {/* Craters */}
      <g clipPath="url(#moonClip)" fill="#b8a880" opacity="0.5">
        <circle cx="35" cy="32" r="6" />
        <circle cx="62" cy="28" r="4" />
        <circle cx="28" cy="58" r="5" />
        <circle cx="70" cy="60" r="7" />
        <circle cx="48" cy="48" r="3" />
        <circle cx="58" cy="72" r="4.5" />
        <circle cx="40" cy="74" r="3.5" />
        <circle cx="72" cy="42" r="2.5" />
        <circle cx="22" cy="42" r="3" />
      </g>

      {/* Crater highlights */}
      <g clipPath="url(#moonClip)" fill="#f5efda" opacity="0.4">
        <circle cx="33" cy="30" r="2" />
        <circle cx="60" cy="26" r="1.5" />
        <circle cx="26" cy="56" r="1.8" />
        <circle cx="68" cy="58" r="2.5" />
        <circle cx="56" cy="70" r="1.5" />
      </g>

      {/* Shadow overlay (dark side) */}
      {shadowWidth > 0 && (
        <rect
          x={pct}
          y="0"
          width={shadowWidth}
          height="100"
          fill="#4a4a5e"
          opacity="0.75"
          clipPath="url(#moonClip)"
        />
      )}

      {/* Subtle terminator line */}
      {pct > 0 && pct < 100 && (
        <line
          x1={pct}
          y1="0"
          x2={pct}
          y2="100"
          stroke="#5a5a6e"
          strokeWidth="0.5"
          opacity="0.4"
          clipPath="url(#moonClip)"
        />
      )}
    </svg>
  );
}