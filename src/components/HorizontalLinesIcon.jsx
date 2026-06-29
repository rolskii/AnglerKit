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
      <line x1="5" y1="4.5" x2="19" y2="4.5" />
      <line x1="5" y1="9.5" x2="19" y2="9.5" />
      <line x1="5" y1="14.5" x2="19" y2="14.5" />
      <line x1="5" y1="19.5" x2="19" y2="19.5" />
    </svg>
  );
}