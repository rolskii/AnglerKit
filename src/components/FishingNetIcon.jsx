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
      {/* handle - solid bar */}
      <rect x="17" y="2" width="2.5" height="14" rx="1.2" transform="rotate(-45 18.25 9)" fill="currentColor" />
      
      {/* hoop - filled oval */}
      <ellipse cx="7" cy="8" rx="3.5" ry="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      
      {/* net pouch - filled trapezoid with mesh */}
      <path d="M 3.5 12 L 2 20 Q 7 23 12 20 L 10.5 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      
      {/* mesh grid - vertical lines */}
      <line x1="4" y1="12" x2="2.5" y2="20" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="12" x2="7" y2="21.5" stroke="currentColor" strokeWidth="1" />
      <line x1="10" y1="12" x2="11.5" y2="20" stroke="currentColor" strokeWidth="1" />
      
      {/* mesh grid - horizontal lines */}
      <line x1="3.2" y1="14.5" x2="10.8" y2="14.5" stroke="currentColor" strokeWidth="1" />
      <line x1="2.8" y1="17" x2="11.2" y2="17" stroke="currentColor" strokeWidth="1" />
      <line x1="2.5" y1="19.5" x2="11.5" y2="19.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}