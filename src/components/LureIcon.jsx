import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* eye - circle at top */}
      <circle cx="12" cy="3" r="2" />
      
      {/* straight shaft */}
      <rect x="11" y="5" width="2" height="10" />
      
      {/* J-shaped hook curve */}
      <path d="M 11 15 Q 5 15 5 19 Q 5 22 9 22 L 13 22 Q 13 18 12 15" fill="currentColor" />
      
      {/* barb point */}
      <polygon points="6,18 4,20 6,21" fill="currentColor" />
    </svg>
  );
}