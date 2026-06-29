import React from "react";

export default function HorizontalLinesIcon({ className, ...props }) {
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
      <line x1="5" y1="6" x2="19" y2="6" />
      <line x1="5" y1="10" x2="19" y2="10" />
      <line x1="5" y1="14" x2="19" y2="14" />
      <line x1="5" y1="18" x2="19" y2="18" />
    </svg>
  );
}