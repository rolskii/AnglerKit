import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* eye at top */}
      <circle cx="12" cy="3" r="1.5" />
      
      {/* straight shaft down */}
      <line x1="12" y1="4.5" x2="12" y2="12" />
      
      {/* J-hook curve - start at shaft end, curve down and around */}
      <path d="M 12 12 Q 8 12 6 14 Q 4 16 4 18.5 Q 4 21 6.5 22" />
      
      {/* barb - small angled line inside the hook */}
      <line x1="6" y1="17" x2="3.5" y2="19" strokeWidth="1.5" />
    </svg>
  );
}