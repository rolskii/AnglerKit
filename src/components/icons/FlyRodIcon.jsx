import React from "react";

export default function FlyRodIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Rod blank, flexed into a classic arc (butt lower-left, tip upper-right) */}
      <path d="M3 19 Q 9 6 20 4" />
      {/* Tip */}
      <circle cx="20" cy="4" r="0.7" fill="currentColor" stroke="none" />
      {/* Cork grip at the butt */}
      <path d="M3 19 L 5.2 20.4" />
      <path d="M4.2 17.6 L 6.4 19" />
      {/* Reel seat just above the grip */}
      <line x1="5" y1="17" x2="6.6" y2="18" />
      {/* A couple of guides along the blank */}
      <circle cx="9" cy="10.5" r="0.7" />
      <circle cx="13.5" cy="7.5" r="0.7" />
      <circle cx="17" cy="5.6" r="0.7" />
      {/* Fly line coming off the tip, curving down */}
      <path d="M20 4.5 Q 18 9 14 11" />
    </svg>
  );
}