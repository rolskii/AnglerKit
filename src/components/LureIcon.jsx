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
      
      {/* shank - vertical line */}
      <rect x="11" y="5" width="2" height="8" rx="1" />
      
      {/* left hook curve */}
      <path d="M 11 13 Q 6 13 5 17 Q 4.5 19 6 20.5 Q 7 21 8 20 Q 9 18 11 13" fill="currentColor" />
      
      {/* right hook curve */}
      <path d="M 13 13 Q 18 13 19 17 Q 19.5 19 18 20.5 Q 17 21 16 20 Q 15 18 13 13" fill="currentColor" />
    </svg>
  );
}