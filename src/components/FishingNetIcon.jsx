import React from "react";

export default function FishingNetIcon({ className, ...props }) {
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
      {/* handle - long solid angled line */}
      <line x1="20" y1="2" x2="8" y2="16" strokeWidth="2.5" />
      
      {/* hoop - oval loop */}
      <ellipse cx="6.5" cy="9" rx="3" ry="3.5" />
      
      {/* net pouch - rounded dome shape */}
      <path d="M 3.5 12 Q 2 17 6.5 19 Q 11 17 9.5 12" fill="none" strokeWidth="2" />
      
      {/* mesh grid - vertical lines */}
      <line x1="4.5" y1="12" x2="3.5" y2="18.5" strokeWidth="1.2" />
      <line x1="6.5" y1="12.5" x2="6.5" y2="19" strokeWidth="1.2" />
      <line x1="8.5" y1="12" x2="9.5" y2="18.5" strokeWidth="1.2" />
      
      {/* mesh grid - horizontal/curved lines */}
      <path d="M 3.8 14 Q 6.5 13.5 9.2 14" strokeWidth="1.2" />
      <path d="M 3.3 16 Q 6.5 15.3 9.7 16" strokeWidth="1.2" />
    </svg>
  );
}