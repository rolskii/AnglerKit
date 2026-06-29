import React from "react";

export default function FishingNetIcon({ className, ...props }) {
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
      {/* toolbox body */}
      <rect x="3" y="8" width="18" height="10" rx="1" />
      
      {/* handle */}
      <path d="M 8 8 Q 12 3 16 8" />
      
      {/* divider line */}
      <line x1="12" y1="8" x2="12" y2="18" />
      
      {/* tool compartments */}
      <rect x="3" y="18" width="18" height="3" rx="0.5" />
    </svg>
  );
}