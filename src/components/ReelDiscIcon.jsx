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
      {/* Horizontal line at the top */}
      <line x1="3" y1="3" x2="21" y2="3" />
      {/* Disc */}
      <circle cx="12" cy="14" r="7" />
      <circle cx="12" cy="14" r="2.5" />
    </svg>
  );
}