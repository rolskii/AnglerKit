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
      <circle cx="12" cy="2.5" r="1.5" />
      
      {/* shank - vertical bar */}
      <rect x="11" y="4.5" width="2" height="7" rx="1" />
      
      {/* left hook - curved downward */}
      <path d="M 11 11.5 Q 6 11.5 5.5 15 Q 5.2 17.5 7 19 Q 8.5 20 10 18.5 Q 11 16 11 11.5" />
      
      {/* right hook - curved downward */}
      <path d="M 13 11.5 Q 18 11.5 18.5 15 Q 18.8 17.5 17 19 Q 15.5 20 14 18.5 Q 13 16 13 11.5" />
    </svg>
  );
}