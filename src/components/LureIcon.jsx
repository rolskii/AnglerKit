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
      {/* shank - straight line */}
      <line x1="12" y1="2" x2="12" y2="12" />
      
      {/* hook bend and curve */}
      <path d="M 12 12 Q 15 13 16 16 Q 16.5 19 14 21" />
      
      {/* barb */}
      <line x1="15" y1="17" x2="17" y2="17.5" />
      
      {/* point */}
      <circle cx="13.5" cy="21.5" r="0.8" fill="currentColor" />
    </svg>
  );
}