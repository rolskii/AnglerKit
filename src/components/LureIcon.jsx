import React from "react";

export default function LureIcon({ className, ...props }) {
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
      {/* hook shank */}
      <line x1="12" y1="2" x2="12" y2="14" />
      
      {/* hook curve */}
      <path d="M 12 14 Q 16 14 16 18 Q 16 22 12 22" />
      
      {/* barb */}
      <line x1="14" y1="18" x2="16" y2="19" />
    </svg>
  );
}