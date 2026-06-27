import React from "react";

export default function FlyRodIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Cork grip at the butt */}
      <path d="M2.6 20.4 L5.4 18.2" strokeWidth="3" />
      {/* Reel seat */}
      <line x1="4.6" y1="18.6" x2="5.8" y2="17.8" strokeWidth="2" />
      {/* Reel: large-arbor disc with holes */}
      <circle cx="3.6" cy="20.2" r="2" strokeWidth="1.6" />
      <circle cx="3.6" cy="20.2" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="2.5" cy="19.4" r="0.28" fill="currentColor" stroke="none" />
      <circle cx="4.7" cy="19.4" r="0.28" fill="currentColor" stroke="none" />
      <circle cx="2.5" cy="21" r="0.28" fill="currentColor" stroke="none" />
      <circle cx="4.7" cy="21" r="0.28" fill="currentColor" stroke="none" />

      {/* Rod blank: dramatic flexed arch, butt lower-left to tip right */}
      <path d="M5.4 17.8 Q12 2.5 20.5 6.2" strokeWidth="2.2" />

      {/* Guides along the arch (small Y/triangle feet + loop) */}
      <path d="M8.4 12.6 l1.1 -0.5 m-1.1 0.5 l0.4 0.9" strokeWidth="1.3" />
      <circle cx="9.4" cy="12.1" r="0.5" strokeWidth="1.1" />
      <path d="M11.6 7.4 l1.1 -0.4 m-1.1 0.4 l0.5 0.8" strokeWidth="1.3" />
      <circle cx="12.7" cy="7" r="0.5" strokeWidth="1.1" />
      <path d="M15.4 4.6 l1.1 -0.2 m-1.1 0.2 l0.6 0.7" strokeWidth="1.3" />
      <circle cx="16.5" cy="4.4" r="0.5" strokeWidth="1.1" />
      <path d="M18.8 4.6 l1.1 0.1 m-1.1 -0.1 l0.7 0.6" strokeWidth="1.3" />
      <circle cx="19.9" cy="4.9" r="0.5" strokeWidth="1.1" />

      {/* Fly line: thin, flowing loop in the air off the tip */}
      <path
        d="M20.4 5.4 Q 16 9 18 13 Q 20 16 15.5 15 Q 12 14 14 10.5"
        strokeWidth="1"
        opacity="0.65"
      />
      {/* The fly at the end of the line */}
      <path d="M14 10.5 q -0.8 -0.2 -1.2 0.4" strokeWidth="1" opacity="0.75" />
      <path d="M12.8 10.9 q -0.6 0.4 -0.2 1" strokeWidth="0.8" opacity="0.7" />
      <path d="M13.4 10.7 q -0.4 -0.5 0.1 -0.9" strokeWidth="0.8" opacity="0.7" />
    </svg>
  );
}