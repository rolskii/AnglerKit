import React from "react";

export default function VerticalLinesIcon({ className, ...props }) {
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
      <line x1="6" y1="5" x2="6" y2="19" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="18" y1="5" x2="18" y2="19" />
    </svg>
  );
}