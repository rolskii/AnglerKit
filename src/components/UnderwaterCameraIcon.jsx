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
      {/* top water wave */}
      <path d="M 1 3 Q 3 1.5 5 3 Q 7 4.5 9 3 Q 11 1.5 13 3 Q 15 4.5 17 3 Q 19 1.5 21 3 Q 22 3.5 23 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* second water wave */}
      <path d="M 1 6 Q 3 4.5 5 6 Q 7 7.5 9 6 Q 11 4.5 13 6 Q 15 7.5 17 6 Q 19 4.5 21 6 Q 22 6.5 23 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* camera body - rounded rectangle */}
      <rect x="2" y="9" width="18" height="11" rx="1.5" ry="1.5" fill="currentColor" />
      
      {/* camera top button/flash */}
      <rect x="9" y="7.5" width="1.5" height="1.8" fill="currentColor" />
      
      {/* left viewfinder window - white vertical rectangle */}
      <rect x="4.5" y="12" width="2" height="5" rx="0.5" fill="white" />
      
      {/* right camera lens - large white circle */}
      <circle cx="17" cy="14.5" r="3" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}