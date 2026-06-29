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
      <circle cx="12" cy="3" r="1.5" />
      
      {/* shank - vertical bar */}
      <rect x="11" y="4.5" width="2" height="6.5" rx="1" />
      
      {/* left hook curve */}
      <path d="M 11 11 Q 5.5 11 4.5 16 Q 4 18.5 6.5 20.5 Q 8 21.5 9.5 19.5 Q 10.5 17 11 11" fill="currentColor" />
      
      {/* right hook curve */}
      <path d="M 13 11 Q 18.5 11 19.5 16 Q 20 18.5 17.5 20.5 Q 16 21.5 14.5 19.5 Q 13.5 17 13 11" fill="currentColor" />
    </svg>
  );
}