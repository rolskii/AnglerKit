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
      {/* net handle - vertical lines */}
      <path d="M 11 2 L 11 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 13 2 L 13 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      
      {/* net frame - curved top */}
      <path d="M 8 5 Q 12 4 16 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      
      {/* net mesh - diagonal grid pattern */}
      {/* vertical lines */}
      <line x1="8.5" y1="5.5" x2="7" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="10" y1="5" x2="9" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="4.8" x2="12" y2="16.5" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="5" x2="15" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="15.5" y1="5.5" x2="17" y2="15" stroke="currentColor" strokeWidth="1" />
      
      {/* diagonal lines left to right */}
      <line x1="7" y1="7" x2="9" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="8" y1="5.5" x2="11.5" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="10.5" y1="5" x2="14.5" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="13.5" y1="5" x2="16.5" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="15" y1="5.5" x2="17" y2="12" stroke="currentColor" strokeWidth="1" />
      
      {/* diagonal lines right to left */}
      <line x1="17" y1="7" x2="15" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="16" y1="5.5" x2="12.5" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="13.5" y1="5" x2="9.5" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="10.5" y1="5" x2="7.5" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="9" y1="5.5" x2="7" y2="12" stroke="currentColor" strokeWidth="1" />
      
      {/* net bottom - curved */}
      <path d="M 7 15.5 Q 12 17 17 15.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}