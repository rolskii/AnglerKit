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
      {/* cork grip */}
      <path d="M2.5 21 7 16" strokeWidth="3.5" />
      {/* bent rod shaft */}
      <path d="M7 16 Q13 7 20 4" />
      {/* reel */}
      <circle cx="8.5" cy="15" r="1.7" />
      <circle cx="8.5" cy="15" r="0.6" fill="currentColor" stroke="none" />
      {/* fishing line off the tip */}
      <path d="M20 4 Q22.5 9 21 13" strokeWidth="1.5" />
      {/* hook */}
      <path d="M21 13 q -1.4 0 -1.4 1.4 q 0 1 1 1" strokeWidth="1.5" />
    </svg>
  );
}