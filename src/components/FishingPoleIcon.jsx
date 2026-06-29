import React from "react";

export default function FishingPoleIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* handle */}
      <path d="M3 20.5 6.5 17" />
      {/* loaded rod shaft */}
      <path d="M6.5 17 Q13 5 21 4" />
      {/* reel */}
      <circle cx="7" cy="16" r="2" />
      <circle cx="7" cy="16" r="0.7" fill="currentColor" stroke="none" />
      {/* guides along the shaft */}
      <path d="M9.5 11.7 v-1.8" />
      <path d="M13.3 7.8 v-1.8" />
      <path d="M17.1 5.2 v-1.8" />
      <path d="M19.4 4.3 v-1.8" />
    </svg>
  );
}