import React from "react";

export default function FishingNetIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* handle */}
      <rect x="18" y="1" width="2" height="12" rx="1" transform="rotate(-50 19 7)" />
      
      {/* hoop oval */}
      <ellipse cx="7" cy="8" rx="3" ry="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* net dome outline */}
      <path d="M 4 11.5 L 2.5 18 Q 7 21 11.5 18 L 10 11.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      
      {/* vertical mesh */}
      <line x1="5" y1="11.5" x2="3" y2="17.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="11.5" x2="7" y2="20.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="11.5" x2="11" y2="17.5" stroke="currentColor" strokeWidth="1.5" />
      
      {/* horizontal mesh */}
      <line x1="4.2" y1="13.5" x2="9.8" y2="13.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3.7" y1="15.5" x2="10.3" y2="15.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3.2" y1="17.5" x2="10.8" y2="17.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}