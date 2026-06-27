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
      {/* Rod blank: straight, tapering from butt (lower-left) to tip (upper-right) */}
      <path d="M4 20 L20 4" />
      {/* Cork grip: a short thick rounded block at the butt, angled along the rod */}
      <path d="M2.6 18.6 L5.4 21.4" strokeWidth="3.4" />
      {/* Reel seat: thin connector just above the grip */}
      <line x1="5" y1="17" x2="6.4" y2="18.4" strokeWidth="2.4" />
      {/* Reel hanging below the seat */}
      <circle cx="5.2" cy="19.8" r="1.6" />
      <circle cx="5.2" cy="19.8" r="0.5" fill="currentColor" stroke="none" />
      {/* Line guides: small loops perpendicular to the blank */}
      <path d="M9 15 L10 14" />
      <path d="M12 12 L13 11" />
      <path d="M15 9 L16 8" />
      <path d="M18 6 L19 5" />
      {/* Fly line coming off the tip, curving down */}
      <path d="M20 4 Q 17 7 15 11" />
    </svg>
  );
}