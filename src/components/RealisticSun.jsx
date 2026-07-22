import React from "react";

/**
 * A realistic sun with a textured surface, sunspots, corona rays and a
 * warm glow — designed to visually pair with RealisticMoon.
 */
export default function RealisticSun({ className = "" }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Sun">
      <defs>
        <radialGradient id="sunSurface" cx="40%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor="#ffd76a" />
          <stop offset="80%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#e07b0c" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="rgba(255,200,80,0)" />
          <stop offset="100%" stopColor="rgba(255,180,60,0.4)" />
        </radialGradient>
        <clipPath id="sunClip">
          <circle cx="50" cy="50" r="30" />
        </clipPath>
      </defs>

      {/* Outer glow */}
      <circle cx="50" cy="50" r="50" fill="url(#sunGlow)" />

      {/* Corona rays */}
      <g className="wx-anim-rays" opacity="0.85">
        {rays.map((deg) => (
          <rect
            key={deg}
            x="48.5"
            y="4"
            width="3"
            height="14"
            rx="1.5"
            fill="#ffcf5c"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        {rays.map((deg) => (
          <rect
            key={`s${deg}`}
            x="49"
            y="9"
            width="2"
            height="8"
            rx="1"
            fill="#ffe9a8"
            transform={`rotate(${deg + 15} 50 50)`}
          />
        ))}
      </g>

      {/* Sun body */}
      <circle cx="50" cy="50" r="30" fill="url(#sunSurface)" />

      {/* Surface granulation / sunspots */}
      <g clipPath="url(#sunClip)" fill="#d9871a" opacity="0.35">
        <circle cx="42" cy="44" r="3" />
        <circle cx="58" cy="40" r="2" />
        <circle cx="54" cy="56" r="2.5" />
        <circle cx="44" cy="58" r="2" />
        <circle cx="50" cy="50" r="1.5" />
      </g>

      {/* Highlight sheen */}
      <ellipse cx="42" cy="40" rx="9" ry="6" fill="#fffbe8" opacity="0.45" clipPath="url(#sunClip)" />
    </svg>
  );
}