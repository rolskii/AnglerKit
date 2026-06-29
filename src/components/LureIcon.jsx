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
      <circle cx="12" cy="2.5" r="1.8" />
      
      {/* straight shaft */}
      <rect x="11" y="4.5" width="2" height="9" rx="1" />
      
      {/* J-shaped hook - curves to the left */}
      <path d="M 11 13.5 Q 4 13.5 4 17.5 Q 4 20.5 7.5 21 Q 11 21.5 12 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}