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
      {/* cork grip / handle */}
      <path d="M2.5 21 7 16" strokeWidth="3.5" />
      {/* loaded rod shaft */}
      <path d="M7 16 Q15 6 21 4" />
      {/* reel */}
      <circle cx="8.5" cy="15.6" r="1.8" />
      <circle cx="8.5" cy="15.6" r="0.6" fill="currentColor" stroke="none" />
      {/* line guides / eyelets along the shaft */}
      <path d="M10 11.5 Q10.9 9.7 11.8 11.5" />
      <path d="M13.6 8 Q14.5 6.2 15.4 8" />
      <path d="M17 5.5 Q17.9 3.7 18.8 5.5" />
      <path d="M18.9 4.5 Q19.8 2.7 20.7 4.5" />
    </svg>
  );
}