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
      <rect x="11" y="5" width="2" height="9.5" rx="1" />
      
      {/* curved hook base */}
      <path d="M 11 14.5 Q 6 14.5 6 18 Q 6 21.5 10 22 Q 13 22 13 19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* barb point on hook */}
      <path d="M 8 19 L 6.5 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}