import React from "react";

export default function UnderwaterCameraIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* top water wave line */}
      <path d="M 2 3 Q 4 2 6 3 Q 8 4 10 3 Q 12 2 14 3 Q 16 4 18 3 Q 20 2 22 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      
      {/* bottom water wave line */}
      <path d="M 2 5 Q 4 4 6 5 Q 8 6 10 5 Q 12 4 14 5 Q 16 6 18 5 Q 20 4 22 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      
      {/* camera body - rounded rectangle */}
      <rect x="3" y="8" width="14" height="10" rx="1.5" fill="currentColor" />
      
      {/* camera flash - small rectangle at top left */}
      <rect x="7" y="7" width="1.5" height="1.2" fill="currentColor" />
      
      {/* camera lens - white circle */}
      <circle cx="16" cy="13" r="2.5" fill="white" />
      
      {/* camera viewfinder line - white vertical line */}
      <rect x="5" y="10" width="1" height="6" rx="0.5" fill="white" />
    </svg>
  );
}