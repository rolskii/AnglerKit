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
      {/* handle - diagonal pole */}
      <path d="M 18 3 L 8 15" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      
      {/* hoop - circle */}
      <circle cx="6" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* net pouch - curved trapezoid shape */}
      <path d="M 3 12 Q 2 16 3 19 Q 6 21 9 19 Q 10 16 9 12" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
      
      {/* net mesh lines - vertical and diagonal for net texture */}
      <line x1="4" y1="12" x2="3.5" y2="19" stroke="currentColor" strokeWidth="0.8" />
      <line x1="6" y1="12" x2="6" y2="20" stroke="currentColor" strokeWidth="0.8" />
      <line x1="8" y1="12" x2="8.5" y2="19" stroke="currentColor" strokeWidth="0.8" />
      
      <line x1="3.5" y1="14" x2="8.5" y2="14" stroke="currentColor" strokeWidth="0.8" />
      <line x1="3.2" y1="16" x2="8.8" y2="16" stroke="currentColor" strokeWidth="0.8" />
      <line x1="3.2" y1="18" x2="8.8" y2="18" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}