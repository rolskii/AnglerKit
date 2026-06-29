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
      <rect x="10.5" y="5.5" width="3" height="8" rx="1.5" />
      
      {/* curved hook - J shape */}
      <path d="M 10.5 13.5 Q 6 13.5 6 17.5 Q 6 21 10 21.5 Q 14 21.5 14 17.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}