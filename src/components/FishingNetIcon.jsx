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
      <path d="M 18 3 L 8 14" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      
      {/* hoop - circle at top */}
      <circle cx="6" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* net mesh - grid pattern creating the net appearance */}
      <line x1="2.5" y1="11" x2="1.5" y2="20" stroke="currentColor" strokeWidth="0.9" />
      <line x1="4" y1="11" x2="3.5" y2="21" stroke="currentColor" strokeWidth="0.9" />
      <line x1="6" y1="11" x2="6" y2="22" stroke="currentColor" strokeWidth="0.9" />
      <line x1="8" y1="11" x2="8.5" y2="21" stroke="currentColor" strokeWidth="0.9" />
      <line x1="9.5" y1="11" x2="10.5" y2="20" stroke="currentColor" strokeWidth="0.9" />
      
      {/* horizontal mesh lines */}
      <line x1="2" y1="12.5" x2="10" y2="12.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="1.8" y1="14.5" x2="10.2" y2="14.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="1.5" y1="16.5" x2="10.5" y2="16.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="1.5" y1="18.5" x2="10.5" y2="18.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="2" y1="20.5" x2="10" y2="20.5" stroke="currentColor" strokeWidth="0.9" />
      
      {/* net bottom - curved closure */}
      <path d="M 1.5 20.5 Q 6 22.5 10.5 20.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}