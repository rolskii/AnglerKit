import React from "react";

export default function ReelDiscIcon({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Horizontal line on top, tangent to the outer circle */}
      <line x1="9" y1="7" x2="15" y2="7" />
      {/* Disc */}
      <circle cx="12" cy="14" r="7" />
      <circle cx="12" cy="14" r="2.5" />
    </svg>
  );
}