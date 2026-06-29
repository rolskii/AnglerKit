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
      <circle cx="12" cy="3.5" r="2" />
      
      {/* straight shaft */}
      <rect x="11" y="5.5" width="2" height="10" rx="1" />
      
      {/* J-shaped curve */}
      <path d="M 11 15.5 Q 5 15.5 5 19 Q 5 22 9 22 Q 12 22 12 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}