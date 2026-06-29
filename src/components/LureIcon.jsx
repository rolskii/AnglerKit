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
      
      {/* J-hook: main curved body */}
      <path d="M 11 14.5 C 8 14.5 5 16.5 5 19.5 C 5 22 7.5 23 10.5 23 C 13 23 13 21 13 19 L 13 14.5" fill="currentColor" />
      
      {/* barb point inside the hook */}
      <polygon points="8,19 6,20.5 7.5,21" fill="currentColor" />
    </svg>
  );
}