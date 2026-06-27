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
      {/* Rod blank, tapering from butt to tip */}
      <path d="M4 20 L20 4" />
      {/* Tip point */}
      <circle cx="20" cy="4" r="0.6" fill="currentColor" stroke="none" />
      {/* Stripping guide (largest) near the butt */}
      <ellipse cx="7.5" cy="16.5" rx="1.1" ry="0.5" transform="rotate(-45 7.5 16.5)" />
      {/* Snake guides along the blank */}
      <ellipse cx="10.5" cy="13.5" rx="0.9" ry="0.4" transform="rotate(-45 10.5 13.5)" />
      <ellipse cx="13.5" cy="10.5" rx="0.9" ry="0.4" transform="rotate(-45 13.5 10.5)" />
      <ellipse cx="16.5" cy="7.5" rx="0.9" ry="0.4" transform="rotate(-45 16.5 7.5)" />
      {/* Reel seat / handle at the butt */}
      <rect x="2.2" y="18.2" width="3.2" height="3.2" rx="0.6" transform="rotate(-45 3.8 19.8)" />
      {/* Cork grip rings */}
      <line x1="3.2" y1="19.8" x2="4.4" y2="21" />
    </svg>
  );
}